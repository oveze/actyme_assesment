// services/otaService.js
const axios = require('axios');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const config = require('../config/staging.config');

class OTAIntegrationService {
  constructor() {
    this.partners = config.otaPartners;
    this.featureFlags = config.featureFlags;
    this.integration = config.integration;
    this.fallback = config.fallback;
    this.rateLimiters = new Map();
    this.circuitBreakers = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      partnerMetrics: {}
    };
    
    this.initializeCircuitBreakers();
  }

  initializeCircuitBreakers() {
    Object.keys(this.partners).forEach(partner => {
      this.circuitBreakers.set(partner, {
        failures: 0,
        lastFailureTime: null,
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        nextAttemptTime: null
      });
    });
  }

  // Rate limiter implementation
  async checkRateLimit(partner) {
    const now = Date.now();
    const limiter = this.rateLimiters.get(partner) || {
      requests: [],
      minuteRequests: [],
      hourRequests: []
    };

    const partnerConfig = this.partners[partner];
    const { requestsPerMinute, requestsPerHour } = partnerConfig.rateLimits;

    // Clean old requests
    limiter.minuteRequests = limiter.minuteRequests.filter(time => now - time < 60000);
    limiter.hourRequests = limiter.hourRequests.filter(time => now - time < 3600000);

    // Check limits
    if (limiter.minuteRequests.length >= requestsPerMinute) {
      throw new Error(`Rate limit exceeded for ${partner}: ${requestsPerMinute}/minute`);
    }
    
    if (limiter.hourRequests.length >= requestsPerHour) {
      throw new Error(`Rate limit exceeded for ${partner}: ${requestsPerHour}/hour`);
    }

    // Add current request
    limiter.minuteRequests.push(now);
    limiter.hourRequests.push(now);
    
    this.rateLimiters.set(partner, limiter);
  }

  // Circuit breaker implementation
  checkCircuitBreaker(partner) {
    const breaker = this.circuitBreakers.get(partner);
    const now = Date.now();

    switch (breaker.state) {
      case 'OPEN':
        if (now < breaker.nextAttemptTime) {
          throw new Error(`Circuit breaker OPEN for ${partner}. Next attempt in ${Math.ceil((breaker.nextAttemptTime - now) / 1000)}s`);
        }
        breaker.state = 'HALF_OPEN';
        break;
      case 'HALF_OPEN':
        // Allow one request to test
        break;
      case 'CLOSED':
      default:
        // Normal operation
        break;
    }
  }

  recordSuccess(partner) {
    const breaker = this.circuitBreakers.get(partner);
    breaker.failures = 0;
    breaker.state = 'CLOSED';
    this.metrics.successfulRequests++;
  }

  recordFailure(partner) {
    const breaker = this.circuitBreakers.get(partner);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failures >= this.integration.circuitBreakerThreshold) {
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = Date.now() + (60000 * breaker.failures); // Exponential backoff
    }
    
    this.metrics.failedRequests++;
  }

  // Main integration method
  async makeOTARequest(partner, endpoint, params = {}, options = {}) {
    if (!this.featureFlags.enableOTAIntegration) {
      return this.getFallbackResponse(partner, endpoint, params);
    }

    const startTime = performance.now();
    let attempt = 0;
    let lastError;

    while (attempt < this.integration.retryAttempts) {
      try {
        await this.checkRateLimit(partner);
        this.checkCircuitBreaker(partner);

        const response = await this.executeLiveRequest(partner, endpoint, params, options);
        
        // Record success metrics
        const responseTime = performance.now() - startTime;
        this.recordSuccess(partner);
        this.updateMetrics(partner, responseTime, true);
        
        console.log(`✅ OTA Request successful: ${partner}/${endpoint} (${responseTime.toFixed(2)}ms)`);
        return response;

      } catch (error) {
        attempt++;
        lastError = error;
        
        console.warn(`⚠️  OTA Request failed (attempt ${attempt}): ${partner}/${endpoint} - ${error.message}`);
        
        this.recordFailure(partner);
        this.updateMetrics(partner, performance.now() - startTime, false);

        if (attempt < this.integration.retryAttempts) {
          await this.delay(this.integration.retryDelay * attempt);
        }
      }
    }

    // All attempts failed, try fallback
    if (this.fallback.enableStubResponses) {
      console.log(`🔄 Using fallback response for ${partner}/${endpoint}`);
      return this.getFallbackResponse(partner, endpoint, params);
    }

    throw lastError;
  }

  async executeLiveRequest(partner, endpoint, params, options = {}) {
    const partnerConfig = this.partners[partner];
    
    if (!partnerConfig || !partnerConfig.apiKey) {
      throw new Error(`Partner ${partner} not configured or missing API key`);
    }

    const requestConfig = {
      method: options.method || 'GET',
      url: `${partnerConfig.baseUrl}${endpoint}`,
      timeout: partnerConfig.timeout,
      headers: {
        'Authorization': `Bearer ${partnerConfig.apiKey}`,
        'Content-Type': 'application/json',
        'X-Source': 'actyme-staging',
        'X-Request-ID': crypto.randomUUID(),
        ...options.headers
      }
    };

    if (requestConfig.method === 'GET') {
      requestConfig.params = params;
    } else {
      requestConfig.data = params;
    }

    // Add partner-specific authentication
    this.addPartnerAuth(partner, requestConfig);

    const response = await axios(requestConfig);
    return this.transformResponse(partner, response.data);
  }

  addPartnerAuth(partner, requestConfig) {
    const partnerConfig = this.partners[partner];
    
    switch (partner) {
      case 'booking':
        // Booking.com specific auth
        requestConfig.headers['X-Booking-API-Key'] = partnerConfig.apiKey;
        if (partnerConfig.apiSecret) {
          const timestamp = Date.now().toString();
          const signature = crypto
            .createHmac('sha256', partnerConfig.apiSecret)
            .update(timestamp + requestConfig.method + requestConfig.url)
            .digest('hex');
          requestConfig.headers['X-Booking-Timestamp'] = timestamp;
          requestConfig.headers['X-Booking-Signature'] = signature;
        }
        break;
        
      case 'expedia':
        // Expedia specific auth
        requestConfig.headers['X-Expedia-API-Key'] = partnerConfig.apiKey;
        break;
        
      case 'airbnb':
        // Airbnb specific auth
        requestConfig.headers['X-Airbnb-API-Key'] = partnerConfig.apiKey;
        break;
    }
  }

  transformResponse(partner, rawData) {
    // Transform partner-specific response format to standardized format
    const standardResponse = {
      partner,
      timestamp: new Date().toISOString(),
      data: rawData,
      metadata: {
        source: 'live',
        cached: false
      }
    };

    switch (partner) {
      case 'booking':
        return this.transformBookingResponse(standardResponse);
      case 'expedia':
        return this.transformExpediaResponse(standardResponse);
      case 'airbnb':
        return this.transformAirbnbResponse(standardResponse);
      default:
        return standardResponse;
    }
  }

  transformBookingResponse(response) {
    // Booking.com specific transformation
    if (response.data.hotels) {
      response.data.properties = response.data.hotels.map(hotel => ({
        id: hotel.hotel_id,
        name: hotel.hotel_name,
        location: hotel.city,
        rating: hotel.class,
        price: hotel.min_total_price,
        currency: hotel.currency_code
      }));
      delete response.data.hotels;
    }
    return response;
  }

  transformExpediaResponse(response) {
    // Expedia specific transformation
    return response;
  }

  transformAirbnbResponse(response) {
    // Airbnb specific transformation
    return response;
  }

  getFallbackResponse(partner, endpoint, params) {
    console.log(`📁 Loading fallback response for ${partner}/${endpoint}`);
    
    // In a real implementation, this would load from stub data files
    const stubResponse = {
      partner,
      timestamp: new Date().toISOString(),
      data: {
        properties: [
          {
            id: `${partner}_stub_001`,
            name: `Sample Hotel - ${partner}`,
            location: 'Sample City',
            rating: 4,
            price: 150.00,
            currency: 'USD',
            availability: true
          }
        ],
        total: 1,
        message: 'This is a fallback response'
      },
      metadata: {
        source: 'fallback',
        cached: false,
        reason: 'Integration unavailable'
      }
    };

    return stubResponse;
  }

  updateMetrics(partner, responseTime, success) {
    this.metrics.totalRequests++;
    
    // Update average response time
    const currentAvg = this.metrics.averageResponseTime;
    const total = this.metrics.totalRequests;
    this.metrics.averageResponseTime = ((currentAvg * (total - 1)) + responseTime) / total;

    // Update partner-specific metrics
    if (!this.metrics.partnerMetrics[partner]) {
      this.metrics.partnerMetrics[partner] = {
        requests: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0
      };
    }

    const partnerMetrics = this.metrics.partnerMetrics[partner];
    partnerMetrics.requests++;
    
    if (success) {
      partnerMetrics.successes++;
    } else {
      partnerMetrics.failures++;
    }

    // Update partner average response time
    const partnerTotal = partnerMetrics.requests;
    const partnerCurrentAvg = partnerMetrics.averageResponseTime;
    partnerMetrics.averageResponseTime = ((partnerCurrentAvg * (partnerTotal - 1)) + responseTime) / partnerTotal;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck() {
    const results = {};
    
    for (const partner of Object.keys(this.partners)) {
      try {
        const startTime = performance.now();
        await this.makeOTARequest(partner, '/health', {}, { method: 'GET' });
        const responseTime = performance.now() - startTime;
        
        results[partner] = {
          status: 'healthy',
          responseTime: Math.round(responseTime),
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        results[partner] = {
          status: 'unhealthy',
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    return {
      overall: Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      partners: results,
      metrics: this.getMetrics()
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([partner, breaker]) => [
          partner,
          {
            state: breaker.state,
            failures: breaker.failures,
            lastFailure: breaker.lastFailureTime
          }
        ])
      )
    };
  }
}

module.exports = OTAIntegrationService;