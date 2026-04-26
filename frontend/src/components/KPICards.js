import React from 'react';

export default function KPICards({ insights }) {
  const cards = [
    {
      label: 'Total Problems',
      value: insights?.total_problems || 0,
      icon: '📊',
      color: '#eff6ff',
      textColor: '#1e3a8a',
    },
    {
      label: 'Critical Issues',
      value: insights?.by_severity?.Critical || 0,
      icon: '🚨',
      color: '#fef2f2',
      textColor: '#7f1d1d',
    },
    {
      label: 'Resolution Rate',
      value: `${(insights?.resolution_rate * 100 || 0).toFixed(0)}%`,
      icon: '✅',
      color: '#f0fdf4',
      textColor: '#15803d',
    },
    {
      label: 'Avg Response',
      value: insights?.avg_response_time || '--',
      icon: '⏱️',
      color: '#faf5ff',
      textColor: '#6b21a8',
    },
  ];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  };

  const cardStyle = (card) => ({
    backgroundColor: card.color,
    color: card.textColor,
    border: `1px solid ${card.textColor}20`,
    borderRadius: '0.5rem',
    padding: '1.5rem',
    transition: 'box-shadow 0.2s',
  });

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    opacity: 0.75,
    marginBottom: '0.5rem',
  };

  const valueStyle = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginTop: '0.5rem',
  };

  const iconStyle = {
    fontSize: '2rem',
    float: 'right',
  };

  return (
    <div style={gridStyle}>
      {cards.map((card, idx) => (
        <div key={idx} style={cardStyle(card)}>
          <span style={iconStyle}>{card.icon}</span>
          <p style={labelStyle}>{card.label}</p>
          <p style={valueStyle}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}