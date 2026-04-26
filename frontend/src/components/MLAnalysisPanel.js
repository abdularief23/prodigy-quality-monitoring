import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function MLAnalysisPanel({ problem }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (problem) {
      analyzeProblem();
    }
  }, [problem]);

  const analyzeProblem = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/analyze`, {
        description: problem.description,
        problem_id: problem.id,
      });
      setAnalysis(response.data.data);
    } catch (error) {
      console.error('Error analyzing:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  };

  const emptyStyle = {
    textAlign: 'center',
    color: '#6b7280',
    padding: '1rem',
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '2rem',
  };

  const skeletonStyle = {
    height: '0.75rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '0.25rem',
    marginBottom: '0.5rem',
  };

  const titleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
  };

  const sectionStyle = {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: '0.25rem',
  };

  const valueStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: '0.25rem',
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return '#10b981';
    if (conf >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (!problem) {
    return (
      <div style={containerStyle}>
        <div style={emptyStyle}>
          <p>👈 Select a problem to view AI analysis</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{ ...skeletonStyle, width: '75%', height: '1.5rem', marginBottom: '1rem' }}></div>
          <div style={{ ...skeletonStyle, width: '100%' }}></div>
          <div style={{ ...skeletonStyle, width: '80%' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>🤖 ML Analysis Results</h3>

      <div style={sectionStyle}>
        <p style={labelStyle}>Category</p>
        <p style={valueStyle}>{analysis?.category || 'Unknown'}</p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Severity</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>
            {analysis?.severity === 'Critical' ? '🚨' :
             analysis?.severity === 'High' ? '⚠️' :
             analysis?.severity === 'Medium' ? '⚡' :
             '✅'}
          </span>
          <p style={{ ...valueStyle, margin: 0 }}>{analysis?.severity}</p>
        </div>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Analysis Confidence</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ flex: 1, height: '0.75rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              width: `${analysis?.confidence || 0}%`,
              height: '100%',
              backgroundColor: getConfidenceColor(analysis?.confidence || 0),
              transition: 'width 0.3s ease',
            }}></div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 'bold', minWidth: '45px' }}>
            {(analysis?.confidence || 0).toFixed(0)}%
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 0 }}>
        <p style={labelStyle}>Recommended Actions</p>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1rem' }}>
          {(analysis?.suggested_actions || []).map((action, idx) => (
            <li key={idx} style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem', listStyle: 'none', paddingLeft: '1.5rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#10b981', fontWeight: 'bold' }}>✓</span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
          ☁️ Powered by Azure Cognitive Services (Text Analytics)
        </p>
      </div>
    </div>
  );
}