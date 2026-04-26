import React from 'react';

export default function ProblemsList({ problems, selectedId, onSelect }) {
  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  };

  const headerTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  };

  const listStyle = {
    maxHeight: '600px',
    overflowY: 'auto',
    borderTop: '1px solid #e5e7eb',
  };

  const itemStyle = (isSelected) => ({
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#eff6ff' : 'white',
    borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
    transition: 'background-color 0.2s',
  });

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: { bg: '#fee2e2', text: '#991b1b' },
      High: { bg: '#fed7aa', text: '#92400e' },
      Medium: { bg: '#fef3c7', text: '#b45309' },
      Low: { bg: '#dcfce7', text: '#166534' },
    };
    return colors[severity] || colors.Low;
  };

  const getStatusIcon = (status) => {
    const icons = {
      Open: '🔴',
      'In Progress': '🟡',
      Analyzing: '🔵',
      Resolved: '✅',
    };
    return icons[status] || '⚪';
  };

  const badgeStyle = (severity) => {
    const color = getSeverityColor(severity);
    return {
      display: 'inline-block',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: color.bg,
      color: color.text,
      marginRight: '0.5rem',
      marginTop: '0.5rem',
    };
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={headerTitleStyle}>
          📋 Production Problems ({problems.length})
        </h2>
      </div>
      <div style={listStyle}>
        {problems.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No problems found</p>
            <p style={{ fontSize: '0.875rem' }}>Production running smoothly! 🎉</p>
          </div>
        ) : (
          problems.map((problem) => (
            <div
              key={problem.id}
              style={itemStyle(selectedId === problem.id)}
              onClick={() => onSelect(problem)}
              onMouseOver={(e) => !selectedId && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseOut={(e) => !selectedId && (e.currentTarget.style.backgroundColor = 'white')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{getStatusIcon(problem.status)}</span>
                    <p style={{ fontWeight: '600', color: '#111827', margin: 0, fontSize: '0.875rem' }}>
                      {problem.id}
                    </p>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.5rem 0', lineHeight: '1.5' }}>
                    {problem.description}
                  </p>
                  <div>
                    <span style={badgeStyle(problem.severity)}>
                      {problem.severity}
                    </span>
                    <span style={{
                      ...badgeStyle('Low'),
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      marginRight: 0,
                    }}>
                      {problem.status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '1rem', minWidth: '120px' }}>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 0.25rem 0', fontWeight: '500' }}>
                    {problem.location}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0' }}>
                    {problem.equipment}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#d1d5db', margin: '0.5rem 0 0 0' }}>
                    {problem.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}