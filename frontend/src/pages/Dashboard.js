import React, { useState } from 'react';
import KPICards from '../components/KPICards';
import ProblemsList from '../components/ProblemsList';
import MLAnalysisPanel from '../components/MLAnalysisPanel';
import AIChat from '../components/AIChat';

export default function Dashboard({ problems, insights, loading, error }) {
  const [selectedProblem, setSelectedProblem] = useState(null);

  const mainStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  };

  const loadingStyle = {
    textAlign: 'center',
  };

  const spinnerStyle = {
    display: 'inline-block',
    width: '3rem',
    height: '3rem',
    border: '4px solid #dbeafe',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  };

  const errorStyle = {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '2rem',
  };

  const errorTitleStyle = {
    color: '#991b1b',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
  };

  const errorTextStyle = {
    color: '#b91c1c',
    fontSize: '0.875rem',
    margin: '0 0 0.5rem 0',
  };

  const errorTipStyle = {
    color: '#dc2626',
    fontSize: '0.75rem',
    margin: 0,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  };

  const gridFullStyle = {
    gridColumn: '1 / -1',
  };

  const footerStyle = {
    textAlign: 'center',
    paddingTop: '2rem',
    marginTop: '3rem',
    borderTop: '1px solid #e5e7eb',
  };

  const footerTextStyle = {
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0,
  };

  if (loading) {
    return (
      <div style={mainStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ color: '#6b7280' }}>Loading Prodigy Dashboard...</p>
        </div>
        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={mainStyle}>
        <div style={errorStyle}>
          <p style={errorTitleStyle}>❌ Error</p>
          <p style={errorTextStyle}>{error}</p>
          <p style={errorTipStyle}>
            💡 Make sure backend is running on port 5000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={mainStyle}>
      <KPICards insights={insights} />

      <div style={gridStyle}>
        <div style={gridFullStyle}>
          <ProblemsList
            problems={problems}
            selectedId={selectedProblem?.id}
            onSelect={setSelectedProblem}
          />
        </div>

        <MLAnalysisPanel problem={selectedProblem} />
        <AIChat selectedProblem={selectedProblem} />
      </div>

      <div style={footerStyle}>
        <p style={footerTextStyle}>
          Prodigy - AI-Powered Production Problem Detection | Powered by Azure
        </p>
      </div>
    </div>
  );
}