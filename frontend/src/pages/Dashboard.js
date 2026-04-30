import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Dashboard({ problems = [], insights = null, loading, error, onRefresh }) {
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [optimalSteps, setOptimalSteps] = useState({});
  const [approachScores, setApproachScores] = useState({});
  const [loadingSteps, setLoadingSteps] = useState({});

  const handleProblemClick = async (problem) => {
    if (!problem || !problem.id) return;

    // Toggle off
    if (selectedProblemId === problem.id) {
      setSelectedProblemId(null);
      return;
    }

    setSelectedProblemId(problem.id);

    // Only fetch if not already loaded
    if (!optimalSteps[problem.id]) {
      setLoadingSteps((prev) => ({ ...prev, [problem.id]: true }));

      try {
        console.log(`🔍 Fetching steps for ${problem.id}...`);

        const [stepsRes, scoresRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/problems/${problem.id}/optimal-steps`),
          axios.get(`${API_BASE_URL}/problems/${problem.id}/approach-scores`),
        ]);

        console.log(`📊 Steps response:`, stepsRes.data);
        console.log(`📊 Scores response:`, scoresRes.data);

        if (stepsRes.data.status === 'success') {
          setOptimalSteps((prev) => ({
            ...prev,
            [problem.id]: stepsRes.data.data || [],
          }));
        }

        if (scoresRes.data.status === 'success') {
          setApproachScores((prev) => ({
            ...prev,
            [problem.id]: scoresRes.data.bestApproach || null,
          }));
        }
      } catch (err) {
        console.error(`❌ Error fetching data for ${problem.id}:`, err.message);
        setOptimalSteps((prev) => ({ ...prev, [problem.id]: [] }));
      } finally {
        setLoadingSteps((prev) => ({ ...prev, [problem.id]: false }));
      }
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', icon: '🔴' },
      High: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '🟠' },
      Medium: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: '🟡' },
      Low: { bg: '#dcfce7', border: '#16a34a', text: '#166534', icon: '🟢' },
    };
    return colors[severity] || colors['Medium'];
  };

  const getStepIcon = (stepType) => {
    const icons = { DIAGNOSE: '🔍', ACTION: '⚙️', VERIFY: '✅' };
    return icons[stepType] || '📌';
  };

  const getRiskColor = (risk) => {
    const colors = {
      LOW: { bg: '#dcfce7', text: '#166534' },
      MEDIUM: { bg: '#fef3c7', text: '#92400e' },
      HIGH: { bg: '#fecaca', text: '#991b1b' },
    };
    return colors[risk] || colors['MEDIUM'];
  };

  if (loading && problems.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><h2>⏳ Loading...</h2></div>;
  }

  if (error && problems.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={onRefresh} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* ==================== INSIGHTS ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #667eea' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Total Problems</p>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#667eea' }}>{problems.length}</h3>
            </div>
            <div style={{ fontSize: '40px' }}>📊</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Critical Issues</p>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#dc2626' }}>{insights?.by_severity?.Critical || 0}</h3>
            </div>
            <div style={{ fontSize: '40px' }}>🚨</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Avg Approaches</p>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#16a34a' }}>20</h3>
            </div>
            <div style={{ fontSize: '40px' }}>🔄</div>
          </div>
        </div>
      </div>

      {/* ==================== PROBLEMS LIST ==================== */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>📋 Production Problems with Optimal 6-Step Solutions</h2>

        {problems.length === 0 ? (
          <div style={{ background: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            <p>No problems found. Upload Excel to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {problems.map((problem) => {
              if (!problem || !problem.id) return null;

              const severityColor = getSeverityColor(problem.severity);
              const isSelected = selectedProblemId === problem.id;
              const steps = optimalSteps[problem.id] || [];
              const bestScore = approachScores[problem.id];
              const isLoadingSteps = loadingSteps[problem.id] || false;

              return (
                <div
                  key={problem.id}
                  onClick={() => handleProblemClick(problem)}
                  style={{
                    background: 'white',
                    border: `2px solid ${severityColor.border}`,
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* HEADER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '18px' }}>
                        {severityColor.icon} {problem.id}
                      </h3>
                      <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                        {problem.equipment || 'Unknown'} • {problem.location || 'Unknown'}
                      </p>
                    </div>
                    <span style={{ background: severityColor.bg, color: severityColor.text, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {problem.severity || 'Unknown'}
                    </span>
                  </div>

                  {/* DESCRIPTION */}
                  <p style={{ margin: '10px 0', color: '#374151', lineHeight: '1.5', fontSize: '14px' }}>
                    📝 {problem.description || 'No description'}
                  </p>

                  {/* SCORE BADGE */}
                  {bestScore && (
                    <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #bfdbfe' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#0369a1' }}>
                        <strong>✨ Optimal Score:</strong> {bestScore.total_score?.toFixed(2)}/10
                        {' '}(Safety: {bestScore.safety_score?.toFixed(1)}, Efficiency: {bestScore.efficiency_score?.toFixed(1)}, Time: {bestScore.time_score?.toFixed(1)}, Risk: {bestScore.risk_score?.toFixed(1)})
                      </p>
                    </div>
                  )}

                  {/* EXPANDED: 6 STEPS */}
                  {isSelected && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f3f4f6' }} onClick={(e) => e.stopPropagation()}>

                      {isLoadingSteps ? (
                        <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '6px', textAlign: 'center', color: '#666' }}>
                          ⏳ Loading steps...
                        </div>
                      ) : steps.length > 0 ? (
                        <div>
                          <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '16px' }}>
                            🚀 OPTIMAL 6-STEP SOLUTION
                          </h4>

                          {steps.map((step, idx) => {
                            const riskColor = getRiskColor(step.step_risk);

                            return (
                              <div
                                key={step.id || idx}
                                style={{
                                  marginBottom: '15px',
                                  paddingBottom: '15px',
                                  borderBottom: idx < steps.length - 1 ? '1px solid #e5e7eb' : 'none',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                                  <div
                                    style={{
                                      background: '#667eea',
                                      color: 'white',
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold',
                                      fontSize: '14px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {idx + 1}
                                  </div>

                                  <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                                        {getStepIcon(step.step_type)} {step.step_name || `Step ${idx + 1}`}
                                      </span>
                                      <span
                                        style={{
                                          background: step.step_type === 'DIAGNOSE' ? '#dbeafe' : step.step_type === 'VERIFY' ? '#dcfce7' : '#fef3c7',
                                          color: step.step_type === 'DIAGNOSE' ? '#0369a1' : step.step_type === 'VERIFY' ? '#166534' : '#92400e',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {step.step_type}
                                      </span>
                                      <span style={{ background: riskColor.bg, color: riskColor.text, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                        Risk: {step.step_risk}
                                      </span>
                                    </div>

                                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#4b5563' }}>
                                      {step.step_description || step.step_name}
                                    </p>

                                    <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                      <span>Priority: {step.priority}/5</span>
                                      <span>Impact: {step.impact}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* CRITICAL PATH */}
                          <div style={{ background: '#fdf2f8', padding: '12px', borderRadius: '6px', marginTop: '10px', border: '1px solid #fbcfe8' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#831843', fontWeight: 'bold' }}>
                              ⚡ CRITICAL PATH: {steps.filter((s) => s.priority <= 2).map((s) => s.step_name).join(' → ') || 'All steps recommended'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '6px', textAlign: 'center', color: '#92400e' }}>
                          ⚠️ No optimal steps found. Try re-uploading the Excel file.
                        </div>
                      )}
                    </div>
                  )}

                  {/* CLICK INDICATOR */}
                  <div style={{ marginTop: '15px', textAlign: 'center', color: '#999', fontSize: '12px', fontWeight: 'bold' }}>
                    {isSelected ? '▲ Close Solution' : '▼ View 6-Step Optimal Solution'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}