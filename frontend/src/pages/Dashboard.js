import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState({});
  const [uploading, setUploading] = useState(false);

  // ======================================
  // FETCH PROBLEMS
  // ======================================
  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/problems');
      const data = await res.json();
      setProblems(data.data || []);
      await fetchInsights();
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // FETCH PROBLEM DETAIL
  // ======================================
  const fetchProblemDetail = async (problemId) => {
    try {
      const res = await fetch(`/api/problems/${problemId}`);
      const data = await res.json();
      setSelectedProblem(data.data);
    } catch (error) {
      console.error('Error fetching detail:', error);
    }
  };

  // ======================================
  // FETCH INSIGHTS
  // ======================================
  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/insights');
      const data = await res.json();
      setInsights(data.data || {});
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  // ======================================
  // UPLOAD EXCEL
  // ======================================
  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      alert(data.message);

      // Refresh setelah 3 detik
      setTimeout(() => {
        fetchProblems();
      }, 3000);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ======================================
  // RESET DATABASE
  // ======================================
  const handleResetDB = async () => {
    if (window.confirm('⚠️ Yakin reset SEMUA data? Tidak bisa dibatalkan!')) {
      try {
        setLoading(true);
        const res = await fetch('/api/reset-database', { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        setProblems([]);
        setSelectedProblem(null);
        await fetchProblems();
      } catch (error) {
        alert('Reset failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // ======================================
  // USE EFFECT
  // ======================================
  useEffect(() => {
    fetchProblems();
  }, []);

  // ======================================
  // RENDER LOADING
  // ======================================
  if (loading && problems.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>⏳ Loading data...</h2>
      </div>
    );
  }

  // ======================================
  // RENDER MAIN
  // ======================================
  return (
    <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100vh' }}>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          borderRadius: '12px',
          color: 'white',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>
            🔧 Prodigy
          </h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            AI-Powered Production Problem Detection System v3.0
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              border: 'none',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadExcel}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={handleResetDB}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🗑️ Reset DB
          </button>
          <button
            onClick={() => fetchProblems()}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* INSIGHTS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <InsightCard
          title="Total Problems"
          value={insights.total_problems || 0}
          icon="📊"
          color="#667eea"
        />
        <InsightCard
          title="Critical"
          value={insights.by_severity?.Critical || 0}
          icon="🚨"
          color="#dc2626"
        />
        <InsightCard
          title="High"
          value={insights.by_severity?.High || 0}
          icon="🟠"
          color="#f59e0b"
        />
        <InsightCard
          title="Resolution Rate"
          value={`${(insights.resolution_rate * 100).toFixed(0)}%`}
          icon="✅"
          color="#10b981"
        />
      </div>

      {/* PROBLEMS LIST */}
      <div>
        <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>
          📋 Production Problems - Analysis Report
        </h2>

        {problems.length === 0 ? (
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p style={{ fontSize: '18px', margin: 0 }}>No problems found</p>
            <p style={{ fontSize: '14px', margin: '10px 0 0 0', color: '#999' }}>
              Upload an Excel file to get started!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(800px, 1fr))',
              gap: '20px',
            }}
          >
            {problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                isSelected={selectedProblem?.problem?.id === problem.id}
                onSelect={() => {
                  if (selectedProblem?.problem?.id === problem.id) {
                    setSelectedProblem(null);
                  } else {
                    fetchProblemDetail(problem.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* EXPANDED DETAIL */}
      {selectedProblem && <DetailPanel selectedProblem={selectedProblem} />}
    </div>
  );
}

// ======================================
// INSIGHT CARD COMPONENT
// ======================================
function InsightCard({ title, value, icon, color }) {
  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: `3px solid ${color}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '32px', color, fontWeight: 'bold' }}>
          {value}
        </h3>
        <div style={{ fontSize: '40px' }}>{icon}</div>
      </div>
    </div>
  );
}

// ======================================
// PROBLEM CARD COMPONENT
// ======================================
function ProblemCard({ problem, isSelected, onSelect }) {
  const severityColors = {
    Critical: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', icon: '🔴' },
    High: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '🟠' },
    Medium: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: '🟡' },
    Low: { bg: '#dcfce7', border: '#16a34a', text: '#166534', icon: '🟢' },
  };

  const color = severityColors[problem.severity] || severityColors.Medium;

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'white',
        border: `2px solid ${color.border}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isSelected
          ? '0 10px 25px rgba(0,0,0,0.15)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        transform: isSelected ? 'translateY(-5px)' : 'translateY(0)',
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '18px', fontWeight: 'bold' }}>
            {color.icon} {problem.id}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
            {problem.equipment} • {problem.location}
          </p>
        </div>
        <div
          style={{
            background: color.bg,
            color: color.text,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {problem.severity}
        </div>
      </div>

      {/* DESCRIPTION */}
      <p style={{ margin: '12px 0', color: '#374151', lineHeight: '1.5', fontSize: '14px' }}>
        📝 {problem.description.substring(0, 150)}...
      </p>

      {/* STATUS */}
      <div style={{ marginBottom: '15px' }}>
        <span
          style={{
            background: '#f3f4f6',
            color: '#1f2937',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          📋 {problem.status}
        </span>
      </div>

      {/* APPROACHES INFO */}
      <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          📊 <strong>{problem.approach_count}</strong> approaches analyzed | 
          <strong> {problem.step_count}</strong> optimal steps
        </p>
      </div>

      {/* CLICK INDICATOR */}
      <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', fontWeight: 'bold' }}>
        {isSelected ? '▲ Close Analysis' : '▼ Click for Detailed Analysis'}
      </div>
    </div>
  );
}

// ======================================
// DETAIL PANEL COMPONENT
// ======================================
function DetailPanel({ selectedProblem }) {
  const problem = selectedProblem.problem;
  const steps = selectedProblem.optimal_steps || [];
  const analysis = selectedProblem.analysis;
  const rca = selectedProblem.rca_analysis;
  const why = selectedProblem.why_why_analysis;

  return (
    <div style={{ marginTop: '40px', paddingBottom: '40px' }}>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>
        📊 Detailed Analysis for {problem.id}
      </h2>

      {/* STEP 1: SENTIMENT ANALYSIS */}
      {analysis && (
        <div
          style={{
            background: '#e0e7ff',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid #c7d2fe',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#3730a3', fontSize: '18px', fontWeight: 'bold' }}>
            📊 STEP 1: Azure Sentiment Analysis
          </h3>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e1b4b' }}>
              <strong>Sentiment:</strong> {analysis.sentiment || 'N/A'}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e1b4b' }}>
              <strong>Confidence:</strong> {(analysis.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: RCA ANALYSIS */}
      {rca && (
        <div
          style={{
            background: '#fef3c7',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid #fcd34d',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#92400e', fontSize: '18px', fontWeight: 'bold' }}>
            🔍 STEP 2: Root Cause Analysis
          </h3>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#78350f' }}>
              🎯 Root Causes:
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#78350f', fontSize: '13px' }}>
              {rca.root_causes
                ? rca.root_causes.split(' | ').map((cause, idx) => (
                    <li key={idx} style={{ margin: '4px 0' }}>
                      {cause}
                    </li>
                  ))
                : <li>No data</li>
              }
            </ul>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#78350f' }}>
              ⚠️ Contributing Factors:
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#78350f', fontSize: '13px' }}>
              {rca.contributing_factors
                ? rca.contributing_factors.split(' | ').map((factor, idx) => (
                    <li key={idx} style={{ margin: '4px 0' }}>
                      {factor}
                    </li>
                  ))
                : <li>No data</li>
              }
            </ul>
          </div>
          <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
              <strong>RCA Score:</strong> {rca.rca_score?.toFixed(2) || 'N/A'}/1.0
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: 5 WHY ANALYSIS */}
      {why && (
        <div
          style={{
            background: '#dbeafe',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid #7dd3fc',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#0c4a6e', fontSize: '18px', fontWeight: 'bold' }}>
            🔄 STEP 3: 5 Why Analysis
          </h3>
          <div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.8' }}>
            {why.why_1 && <p style={{ margin: '8px 0' }}><strong>❓ Why 1:</strong> {why.why_1}</p>}
            {why.why_2 && <p style={{ margin: '8px 0' }}><strong>❓ Why 2:</strong> {why.why_2}</p>}
            {why.why_3 && <p style={{ margin: '8px 0' }}><strong>❓ Why 3:</strong> {why.why_3}</p>}
            {why.why_4 && <p style={{ margin: '8px 0' }}><strong>❓ Why 4:</strong> {why.why_4}</p>}
            {why.why_5 && (
              <p style={{ margin: '8px 0', background: '#e0f7ff', padding: '10px', borderRadius: '4px' }}>
                <strong>✅ Why 5 (ROOT CAUSE):</strong> {why.why_5}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: OPTIMAL STEPS */}
      {steps.length > 0 && (
        <div
          style={{
            background: '#f3e8ff',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid #d8b4fe',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#6b21a8', fontSize: '18px', fontWeight: 'bold' }}>
            🚀 STEP 4: Optimized Workflow (6 Steps)
          </h3>

          <div style={{ background: '#faf5ff', padding: '12px', borderRadius: '6px', marginBottom: '15px', borderLeft: '4px solid #a855f7' }}>
            <p style={{ fontSize: '12px', color: '#6b21a8', margin: 0, lineHeight: '1.6' }}>
              💡 ML telah menganalisis 20 berbeda approaches dan memilih urutan step yang paling optimal untuk efisiensi maksimal.
            </p>
          </div>

          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
            {steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: idx < steps.length - 1 ? '15px' : '0',
                  paddingBottom: idx < steps.length - 1 ? '15px' : '0',
                  borderBottom: idx < steps.length - 1 ? '2px solid #f3e8ff' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                  <div
                    style={{
                      background: '#a855f7',
                      color: 'white',
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b21a8', marginRight: '10px' }}>
                        {step.step_name}:
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          background:
                            step.step_type === 'CHECK'
                              ? '#dbeafe'
                              : step.step_type === 'DIAGNOSE'
                              ? '#fef3c7'
                              : step.step_type === 'ACTION'
                              ? '#fecaca'
                              : '#dcfce7',
                          color:
                            step.step_type === 'CHECK'
                              ? '#0369a1'
                              : step.step_type === 'DIAGNOSE'
                              ? '#92400e'
                              : step.step_type === 'ACTION'
                              ? '#991b1b'
                              : '#166534',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginRight: '8px',
                        }}
                      >
                        {step.step_type}
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          background:
                            step.step_risk === 'LOW'
                              ? '#dcfce7'
                              : step.step_risk === 'MEDIUM'
                              ? '#fef3c7'
                              : '#fecaca',
                          color:
                            step.step_risk === 'LOW'
                              ? '#166534'
                              : step.step_risk === 'MEDIUM'
                              ? '#92400e'
                              : '#991b1b',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        Risk: {step.step_risk}
                      </span>
                    </div>

                    <p style={{ margin: '8px 0', fontSize: '13px', color: '#4c1d95', lineHeight: '1.6' }}>
                      {step.step_description}
                    </p>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#9333ea', marginTop: '8px' }}>
                      <span>
                        <strong>Priority:</strong> {step.priority}/5
                      </span>
                      <span>
                        <strong>Impact:</strong> {step.impact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#faf5ff', padding: '12px', borderRadius: '6px', marginTop: '15px', borderLeft: '4px solid #a855f7' }}>
            <p style={{ fontSize: '12px', color: '#6b21a8', margin: 0, lineHeight: '1.6' }}>
              📚 <strong>Gunakan urutan ini sebagai reference untuk analysis dan training berikutnya.</strong>
            </p>
          </div>
        </div>
      )}

      {/* CORRECTIVE & PREVENTIVE */}
      {rca && (
        <div
          style={{
            background: '#dcfce7',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #86efac',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '18px', fontWeight: 'bold' }}>
            ✅ STEP 5: Corrective & Preventive Actions
          </h3>
          {rca.corrective_actions && (
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                🔧 Corrective Action (Immediate):
              </p>
              <pre
                style={{
                  background: '#f0fdf4',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {rca.corrective_actions}
              </pre>
            </div>
          )}
          {rca.preventive_measures && (
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                🛡️ Preventive Action (Long-term):
              </p>
              <pre
                style={{
                  background: '#f0fdf4',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {rca.preventive_measures}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}