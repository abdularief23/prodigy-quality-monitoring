import React from 'react';

export default function Header({ onRefresh }) {
  const headerStyle = {
    background: 'linear-gradient(to right, #2563eb, #1e40af)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1rem',
  };

  const contentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1.5rem',
    paddingBottom: '1.5rem',
  };

  const titleStyle = {
    color: 'white',
  };

  const h1Style = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    margin: '0',
  };

  const subtitleStyle = {
    color: '#dbeafe',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    color: '#2563eb',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.2s',
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={titleStyle}>
            <h1 style={h1Style}>⚙️ Prodigy</h1>
            <p style={subtitleStyle}>
              AI-Powered Production Problem Detection System
            </p>
          </div>
          <button
            onClick={onRefresh}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseOut={(e) => (e.target.style.backgroundColor = 'white')}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </header>
  );
}