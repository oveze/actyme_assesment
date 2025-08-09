import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import PrizeDraw from './components/PrizeDraw';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set axios default header for authenticated requests
      axios.defaults.headers.common['x-auth-token'] = token;
      
      // Verify token and get user data
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      // You'll need to create this endpoint in your backend
      const res = await axios.get('https://actyme-assesment-backk.onrender.com');
      setUser(res.data.user);
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} logout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tasks" 
            element={user ? <TaskList user={user} setUser={setUser} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/prizedraw" 
            element={user ? <PrizeDraw user={user} setUser={setUser} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
