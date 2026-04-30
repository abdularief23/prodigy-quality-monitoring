import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  // ==================== STATE ====================
  const [problems, setProblems] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // ==================== FETCH PROBLEMS ====================
  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Fetching problems from API...');

      const response = await axios.get(`${API_BASE_URL}/problems-with-full-analysis`);

      if (response.data.status === 'success') {
        setProblems(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data.length} problems`);
      }
    } catch (err) {
      console.error('❌ Error fetching problems:', err.message);
      setError('Failed to load problems. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH INSIGHTS ====================
  const fetchInsights = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/insights`);

      if (response.data.status === 'success') {
        setInsights(response.data.data);
        console.log('✅ Insights loaded');
      }
    } catch (err) {
      console.error('❌ Error fetching insights:', err.message);
    }
  };

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    fetchProblems();
    fetchInsights();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchProblems();
      fetchInsights();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ==================== HANDLE FILE UPLOAD ====================
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      alert('❌ No file selected');
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('❌ Please upload an Excel file (.xlsx or .xls)');
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
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          },
        }
      );

      if (response.data.status === 'success') {
        alert(
          `✅ ${response.data.data.importedRows} problems imported successfully!\n\nAnalysis in progress...`
        );
        console.log('✅ Upload successful:', response.data.message);

        // Reset file input
        event.target.value = '';

        // Refresh data after 2 seconds
        setTimeout(() => {
          fetchProblems();
          fetchInsights();
        }, 2000);

        // Continue polling for 30 seconds
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          pollCount++;
          fetchProblems();
          fetchInsights();

          if (pollCount >= 15) {
            clearInterval(pollInterval);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Upload error:', err.message);
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
      alert(`❌ Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ==================== HANDLE REFRESH ====================
  const handleRefresh = async () => {
    console.log('🔄 Refreshing data...');
    await fetchProblems();
    await fetchInsights();
  };

  // ==================== HANDLE ANALYZE PROBLEM ====================
  const handleAnalyzeProblem = async (problemId, description) => {
    try {
      console.log(`🔍 Analyzing problem: ${problemId}`);

      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        problem_id: problemId,
        description: description,
      });

      if (response.data.status === 'success') {
        console.log('✅ Analysis complete');
        // Refresh to show new analysis
        setTimeout(() => {
          fetchProblems();
        }, 1000);
      }
    } catch (err) {
      console.error('❌ Analysis error:', err.message);
      setError(`Analysis failed: ${err.message}`);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="App">
      {/* ==================== HEADER ==================== */}
      <Header onFileUpload={handleFileUpload} isUploading={isUploading} uploadProgress={uploadProgress} />

      {/* ==================== UPLOAD PROGRESS ==================== */}
      {isUploading && uploadProgress > 0 && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '0',
          right: '0',
          height: '4px',
          background: '#e5e7eb',
          zIndex: 100,
        }}>
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

      {/* ==================== MAIN CONTENT ==================== */}
      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Dashboard
          problems={problems}
          insights={insights}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
          onAnalyze={handleAnalyzeProblem}
        />
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer style={{
        marginTop: '40px',
        padding: '20px',
        textAlign: 'center',
        color: '#999',
        fontSize: '12px',
        borderTop: '1px solid #e5e7eb',
      }}>
        <p>🚀 Prodigy AI-Powered Production Problem Detection System v2.1</p>
        <p>Auto-refreshes every 30 seconds | API: {API_BASE_URL}</p>
      </footer>
    </div>
  );
}