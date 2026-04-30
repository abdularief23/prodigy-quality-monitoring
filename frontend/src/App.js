import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './pages/Dashboard';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [problems, setProblems] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const pollRef = useRef(null);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/problems-with-full-analysis`);

      if (response.data.status === 'success') {
        setProblems(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data.length} problems`);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
      setError('Failed to load problems.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/insights`);
      if (response.data.status === 'success') {
        setInsights(response.data.data);
      }
    } catch (err) {
      console.error('❌ Insights error:', err.message);
    }
  };

  // Initial load only once
  useEffect(() => {
    fetchProblems();
    fetchInsights();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      alert('❌ No file selected');
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('❌ Please upload .xlsx or .xls file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      console.log(`📤 Uploading ${file.name}...`);

      const response = await axios.post(
        `${API_BASE_URL}/upload-excel`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          },
        }
      );

      if (response.data.status === 'success') {
        alert(`✅ Upload berhasil!\n\n${response.data.message || 'Data imported.'}`);
        event.target.value = '';

        // Wait for backend to finish processing, then refresh once
        setTimeout(() => {
          fetchProblems();
          fetchInsights();
        }, 5000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(`❌ Upload failed: ${errorMsg}`);
      setError(`Upload failed: ${errorMsg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Refreshing...');
    await fetchProblems();
    await fetchInsights();
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ Reset semua data?')) return;

    try {
      await axios.post(`${API_BASE_URL}/full-reset`);
      alert('✅ Database reset! Upload Excel baru.');
      setProblems([]);
      setInsights(null);
    } catch (err) {
      alert('❌ Reset failed: ' + err.message);
    }
  };

  return (
    <div className="App">
      <header
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
              ⚙️ Prodigy
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
              AI-Powered Production Problem Detection System
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label
              style={{
                background: isUploading ? '#9ca3af' : '#10b981',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'inline-block',
              }}
            >
              {isUploading ? `⏳ Uploading ${uploadProgress}%...` : '📤 Upload Excel'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={handleRefresh}
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              🔄 Refresh
            </button>

            <button
              onClick={handleReset}
              style={{
                background: '#ef4444',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              🗑️ Reset
            </button>
          </div>
        </div>
      </header>

      {isUploading && (
        <div style={{ height: '4px', background: '#e5e7eb' }}>
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              width: `${uploadProgress}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Dashboard
          problems={problems}
          insights={insights}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />
      </main>

      <footer
        style={{
          marginTop: '40px',
          padding: '20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <p>🚀 Prodigy v3.0 - AI-Powered Production Problem Detection</p>
      </footer>
    </div>
  );
}