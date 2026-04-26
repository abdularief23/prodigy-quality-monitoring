import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('🔗 API URL:', API_URL);

export default function App() {
  const [problems, setProblems] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [problemsRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/api/problems`),
        axios.get(`${API_URL}/api/insights`),
      ]);

      setProblems(problemsRes.data.data || []);
      setInsights(insightsRes.data.data || null);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(
        err.response?.data?.message || 'Failed to fetch data. Backend unavailable?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header onRefresh={fetchData} />
      <Dashboard
        problems={problems}
        insights={insights}
        loading={loading}
        error={error}
      />
    </div>
  );
}