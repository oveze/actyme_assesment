// config/staging.config.js
const config = {
  environment: 'staging',
  
  // Server Configuration
  server: {
    port: process.env.STAGING_PORT || 5001,
    host: process.env.STAGING_HOST || '0.0.0.0',
    cors: {
      origin: [
        'https://staging-actyme.yourdomain.com',
        'http://localhost:3000' // For development testing
      ],
      credentials: true
    }
  },

  // Database Configuration
  database: {
    mongodb: {
      uri: process.env.STAGING_MONGODB_URI || 'mongodb://localhost:27017/actyme_staging',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    }
  },

  // Feature Flags
  featureFlags: {
    enableOTAIntegration: process.env.ENABLE_OTA_INTEGRATION === 'true',
    enableStubMode: process.env.ENABLE_STUB_MODE === 'false', // Disabled for staging
    enableLiveBooking: process.env.ENABLE_LIVE_BOOKING === 'true',
    enablePaymentProcessing: process.env.ENABLE_PAYMENT_PROCESSING === 'true',
    enableRealtimeUpdates: process.env.ENABLE_REALTIME_UPDATES === 'true',
    batchProcessingEnabled: process.env.BATCH_PROCESSING_ENABLED === 'true'
  },

  // OTA Partner Credentials (Encrypted/Secured)
  otaPartners: {
    booking: {
      apiKey: process.env.BOOKING_API_KEY,
      apiSecret: process.env.BOOKING_API_SECRET,
      baseUrl: process.env.BOOKING_BASE_URL || 'https://api.booking.com/v1',
      timeout: parseInt(process.env.BOOKING_TIMEOUT) || 30000,
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 5000
      }
    },
    expedia: {
      apiKey: process.env.EXPEDIA_API_KEY,
      apiSecret: process.env.EXPEDIA_API_SECRET,
      baseUrl: process.env.EXPEDIA_BASE_URL || 'https://api.expedia.com/v3',
      timeout: parseInt(process.env.EXPEDIA_TIMEOUT) || 30000,
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 6000
      }
    },
    airbnb: {
      apiKey: process.env.AIRBNB_API_KEY,
      apiSecret: process.env.AIRBNB_API_SECRET,
      baseUrl: process.env.AIRBNB_BASE_URL || 'https://api.airbnb.com/v2',
      timeout: parseInt(process.env.AIRBNB_TIMEOUT) || 25000,
      rateLimits: {
        requestsPerMinute: 80,
        requestsPerHour: 4000
      }
    }
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.STAGING_JWT_SECRET,
    jwtExpiresIn: '24h',
    encryptionKey: process.env.STAGING_ENCRYPTION_KEY,
    allowedIPs: process.env.ALLOWED_IPS?.split(',') || [],
    requireSSL: true
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: true,
    enableConsoleLogging: true,
    logDirectory: './logs/staging',
    rotateFiles: true,
    maxFiles: 30,
    maxSize: '100MB'
  },

  // Monitoring & Alerts
  monitoring: {
    enableHealthChecks: true,
    healthCheckInterval: 60000, // 1 minute
    alertThresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8 // 80%
    },
    webhooks: {
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL
    }
  },

  // Integration Settings
  integration: {
    batchSize: 50,
    retryAttempts: 3,
    retryDelay: 2000,
    timeout: 30000,
    circuitBreakerThreshold: 5,
    fallbackEnabled: true
  },

  // Cache Configuration
  cache: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      database: 1 // Different DB for staging
    },
    ttl: {
      default: 300, // 5 minutes
      otaData: 600, // 10 minutes
      userSessions: 3600 // 1 hour
    }
  },

  // Fallback Configuration
  fallback: {
    enableStubResponses: true,
    stubDataPath: './data/stub-responses',
    fallbackTimeout: 10000,
    maxFallbackAttempts: 2
  }
};

// Configuration validation
const validateConfig = () => {
  const required = [
    'STAGING_JWT_SECRET',
    'STAGING_MONGODB_URI',
    'STAGING_ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate OTA credentials if integration is enabled
  if (config.featureFlags.enableOTAIntegration) {
    const otaRequired = [
      'BOOKING_API_KEY',
      'EXPEDIA_API_KEY',
      'AIRBNB_API_KEY'
    ];

    const missingOTA = otaRequired.filter(key => !process.env[key]);
    
    if (missingOTA.length > 0) {
      console.warn(`OTA Integration enabled but missing credentials: ${missingOTA.join(', ')}`);
    }
  }
};

// Initialize configuration
try {
  validateConfig();
  console.log('✅ Staging configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;