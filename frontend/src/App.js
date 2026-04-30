import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import logoImage from './assets/prodigy-logo.jpg';

const API_BASE_URL = '/api';

export default function App() {
  const [problems, setProblems] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/problems-with-full-analysis`);
      if (response.data.status === 'success') {
        setProblems(response.data.data || []);
      }
    } catch (err) {
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
      console.error('Insights error:', err.message);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchInsights();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload .xlsx or .xls file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/upload-excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        },
      });

      if (response.data.status === 'success') {
        alert(response.data.message || 'Upload berhasil');
        event.target.value = '';
        setTimeout(() => {
          fetchProblems();
          fetchInsights();
        }, 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Upload failed: ${errorMsg}`);
      setError(`Upload failed: ${errorMsg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRefresh = async () => {
    await fetchProblems();
    await fetchInsights();
  };

  const handleReset = async () => {
    if (!window.confirm('Reset semua data?')) return;
    try {
      await axios.post(`${API_BASE_URL}/full-reset`);
      alert('Database reset. Upload Excel baru.');
      setProblems([]);
      setInsights(null);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <nav className="navbar navbar-expand-lg bg-primary navbar-dark shadow-sm sticky-top">
        <div className="container py-2">
          <div className="d-flex align-items-center gap-3">
            <img
              src={logoImage}
              alt="Prodigy logo"
              style={{ height: '64px', width: '64px', objectFit: 'contain', borderRadius: '12px', background: 'white', padding: '4px' }}
            />
            <div>
              <a className="navbar-brand fw-bold d-block m-0" href="/">Prodigy</a>
              <div className="small text-white-50">AI-Powered Production Problem Detection System</div>
            </div>
          </div>
          <div className="app-action-bar">
            <label className={`btn ${isUploading ? 'btn-secondary' : 'btn-success'} mb-0 app-action-btn app-action-btn-upload`}>
              {isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Excel'}
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={isUploading} hidden />
            </label>
            <button onClick={handleRefresh} className="btn btn-info text-white app-action-btn">Refresh</button>
            <button onClick={handleReset} className="btn btn-danger app-action-btn">Reset</button>
          </div>
        </div>
      </nav>

      {isUploading && (
        <div className="progress rounded-0" style={{ height: '6px' }}>
          <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      <main className="container py-4">
        <Dashboard
          problems={problems}
          insights={insights}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />
      </main>
    </div>
  );
}
