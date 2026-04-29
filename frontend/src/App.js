import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState({});
  const [uploading, setUploading] = useState(false);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/problems');
      const data = await res.json();
      setProblems(data.data || []);
      const resInsights = await fetch('/api/insights');
      const insightsData = await resInsights.json();
      setInsights(insightsData.data || {});
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemDetail = async (problemId) => {
    try {
      const res = await fetch(`/api/problems/${problemId}`);
      const data = await res.json();
      setSelectedProblem(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-excel', { method: 'POST', body: formData });
      const data = await res.json();
      alert(data.message);
      setTimeout(() => fetchProblems(), 3000);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
/**
 * POST /api/analyze-all - Trigger analysis untuk semua problem
 */
app.post('/api/analyze-all', async (req, res) => {
  try {
    console.log('\n🔍 Triggering analysis for all problems...');

    db.all(
      'SELECT DISTINCT id FROM problems',
      async (err, problems) => {
        if (err || !problems) {
          return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch problems',
          });
        }

        console.log(`Found ${problems.length} problems to analyze`);

        let analyzed = 0;
        for (const p of problems) {
          try {
            await analyzeOptimalApproach(p.id);
            analyzed++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (analyzeErr) {
            console.error(`Error analyzing ${p.id}:`, analyzeErr);
          }
        }

        console.log(`✅ Analysis complete for ${analyzed} problems\n`);

        res.json({
          status: 'success',
          message: `✅ Analysis triggered for ${analyzed} problems. Please refresh in 30 seconds.`,
          analyzed: analyzed,
          total: problems.length,
        });
      }
    );
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Analysis failed: ' + error.message,
    });
  }
});  const triggerAnalysis = async () => {
    try {
      alert('🔍 Triggering analysis for all problems...');
      const res = await fetch('/api/analyze-all', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Analysis triggered');
      setTimeout(() => fetchProblems(), 5000);
    } catch (error) {
      alert('Analysis trigger failed: ' + error.message);
    }
  };
  const handleResetDB = async () => {
    if (window.confirm('⚠️ Yakin reset SEMUA data?')) {
      try {
        setLoading(true);
        const res = await fetch('/api/reset-database', { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        setProblems([]);
        setSelectedProblem(null);
        fetchProblems();
      } catch (error) {
        alert('Reset failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  if (loading && problems.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><h2>⏳ Loading...</h2></div>;
  }

  return (
    <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '30px', background: '#667eea', padding: '30px', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>🔧 Prodigy</h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.9 }}>AI-Powered Production Problem Detection v3.0</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ padding: '12px 24px', background: '#10b981', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}>
            {uploading ? '⏳ Uploading...' : '📤 Upload Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={handleUploadExcel} disabled={uploading} style={{ display: 'none' }} />
          </label>
          <button onClick={() => triggerAnalysis()} style={{ padding: '12px 24px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🤖 Analyze</button>
          <button onClick={handleResetDB} style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Reset</button>
          <button onClick={() => fetchProblems()} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
        </div>
      </div>

      {/* INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <Card title="Total" value={insights.total_problems || 0} icon="📊" color="#667eea" />
        <Card title="Critical" value={insights.by_severity?.Critical || 0} icon="🚨" color="#dc2626" />
        <Card title="High" value={insights.by_severity?.High || 0} icon="🟠" color="#f59e0b" />
        <Card title="Resolution" value={`${(insights.resolution_rate * 100).toFixed(0)}%`} icon="✅" color="#10b981" />
      </div>

      {/* PROBLEMS LIST */}
      <h2 style={{ marginBottom: '20px' }}>📋 Production Problems</h2>

      {problems.length === 0 ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '18px', margin: 0 }}>No problems found</p>
          <p style={{ fontSize: '14px', margin: '10px 0 0 0', color: '#999' }}>Upload an Excel file to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(750px, 1fr))', gap: '20px' }}>
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

      {/* DETAIL */}
      {selectedProblem && <DetailPanel data={selectedProblem} />}
    </div>
  );
}

function Card({ title, value, icon, color }) {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}>{title}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '32px', color, fontWeight: 'bold' }}>{value}</h3>
        <div style={{ fontSize: '40px' }}>{icon}</div>
      </div>
    </div>
  );
}

function ProblemCard({ problem, isSelected, onSelect }) {
  const colors = { 
    Critical: { border: '#dc2626', icon: '🔴' }, 
    High: { border: '#f59e0b', icon: '🟠' }, 
    Medium: { border: '#3b82f6', icon: '🟡' }, 
    Low: { border: '#16a34a', icon: '🟢' } 
  };
  const color = colors[problem.severity] || colors.Medium;

  return (
    <div onClick={onSelect} style={{ background: 'white', border: `2px solid ${color.border}`, borderRadius: '12px', padding: '20px', cursor: 'pointer', boxShadow: isSelected ? '0 10px 25px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)', transform: isSelected ? 'translateY(-5px)' : 'translateY(0)', transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>{color.icon} {problem.id}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{problem.equipment} • {problem.location}</p>
        </div>
        <span style={{ background: '#f3f4f6', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{problem.severity}</span>
      </div>
      <p style={{ margin: '12px 0', color: '#374151', fontSize: '14px' }}>📝 {problem.description.substring(0, 100)}...</p>
      <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>📊 {problem.approach_count || 0} approaches | {problem.step_count || 0} steps</p>
      </div>
      <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', fontWeight: 'bold' }}>{isSelected ? '▲ Close' : '▼ Click for Details'}</div>
    </div>
  );
}

function DetailPanel({ data }) {
  // Safety check - jika data undefined, loading state
  if (!data) {
    return (
      <div style={{ marginTop: '40px', background: '#f3f4f6', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#666' }}>
        <p>⏳ Loading analysis...</p>
      </div>
    );
  }

  const problem = data.problem || {};
  const steps = data.optimal_steps || [];
  const analysis = data.analysis || null;
  const rca = data.rca_analysis || null;
  const why = data.why_why_analysis || null;

  // Jika semua kosong
  const hasData = (analysis?.sentiment) || (rca?.root_causes) || (why?.why_1) || (steps?.length > 0);

  return (
    <div style={{ marginTop: '40px', paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '20px' }}>📊 Analysis for {problem.id || 'Unknown'}</h2>

      {/* STEP 1: SENTIMENT */}
      {analysis && analysis.sentiment && (
        <div style={{ background: '#e0e7ff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px solid #c7d2fe' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#3730a3', fontSize: '16px', fontWeight: 'bold' }}>📊 STEP 1: Sentiment Analysis</h3>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Sentiment:</strong> {analysis.sentiment || 'N/A'}</p>
            <p style={{ margin: 0 }}><strong>Confidence:</strong> {analysis.confidence ? (analysis.confidence * 100).toFixed(0) : 'N/A'}%</p>
          </div>
        </div>
      )}

      {/* STEP 2: RCA */}
      {rca && rca.root_causes && (
        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px solid #fcd34d' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#92400e', fontSize: '16px', fontWeight: 'bold' }}>🔍 STEP 2: Root Cause Analysis</h3>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px', margin: '0 0 8px 0' }}>🎯 Root Causes:</p>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#78350f' }}>
              {rca.root_causes ? rca.root_causes.split(' | ').map((c, i) => <li key={i}>{c}</li>) : <li>No data</li>}
            </ul>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px', margin: '0 0 8px 0' }}>⚠️ Contributing Factors:</p>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#78350f' }}>
              {rca.contributing_factors ? rca.contributing_factors.split(' | ').map((f, i) => <li key={i}>{f}</li>) : <li>No data</li>}
            </ul>
          </div>
        </div>
      )}

      {/* STEP 3: 5 WHY */}
      {why && why.why_1 && (
        <div style={{ background: '#dbeafe', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px solid #7dd3fc' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0c4a6e', fontSize: '16px', fontWeight: 'bold' }}>🔄 STEP 3: 5 Why Analysis</h3>
          <div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.8' }}>
            {why.why_1 && <p style={{ margin: '8px 0' }}><strong>❓ Why 1:</strong> {why.why_1}</p>}
            {why.why_2 && <p style={{ margin: '8px 0' }}><strong>❓ Why 2:</strong> {why.why_2}</p>}
            {why.why_3 && <p style={{ margin: '8px 0' }}><strong>❓ Why 3:</strong> {why.why_3}</p>}
            {why.why_4 && <p style={{ margin: '8px 0' }}><strong>❓ Why 4:</strong> {why.why_4}</p>}
            {why.why_5 && <p style={{ margin: '8px 0', background: '#e0f7ff', padding: '10px', borderRadius: '4px' }}><strong>✅ Why 5 (ROOT CAUSE):</strong> {why.why_5}</p>}
          </div>
        </div>
      )}

      {/* STEP 4: OPTIMIZED WORKFLOW */}
      {steps && steps.length > 0 && (
        <div style={{ background: '#f3e8ff', padding: '20px', borderRadius: '12px', border: '2px solid #d8b4fe' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#6b21a8', fontSize: '16px', fontWeight: 'bold' }}>🚀 STEP 4: Optimized Workflow ({steps.length} Steps)</h3>
          <div style={{ background: '#faf5ff', padding: '12px', borderRadius: '6px', marginBottom: '15px', borderLeft: '4px solid #a855f7' }}>
            <p style={{ fontSize: '12px', color: '#6b21a8', margin: 0, lineHeight: '1.6' }}>
              💡 ML telah menganalisis 20 berbeda approaches dan memilih urutan step yang paling optimal untuk efisiensi maksimal.
            </p>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ marginBottom: idx < steps.length - 1 ? '15px' : 0, paddingBottom: idx < steps.length - 1 ? '15px' : 0, borderBottom: idx < steps.length - 1 ? '1px solid #e9d5ff' : 'none' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ background: '#a855f7', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '18px' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px', color: '#6b21a8' }}>
                      {step.step_name || `Step ${String.fromCharCode(65 + idx)}`}
                    </p>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ display: 'inline-block', background: step.step_type === 'ACTION' ? '#fecaca' : step.step_type === 'VERIFY' ? '#dcfce7' : '#fef3c7', color: step.step_type === 'ACTION' ? '#991b1b' : step.step_type === 'VERIFY' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' }}>
                        {step.step_type || 'N/A'}
                      </span>
                      <span style={{ display: 'inline-block', background: step.step_risk === 'HIGH' ? '#fecaca' : step.step_risk === 'MEDIUM' ? '#fef3c7' : '#dcfce7', color: step.step_risk === 'HIGH' ? '#991b1b' : step.step_risk === 'MEDIUM' ? '#92400e' : '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        Risk: {step.step_risk || 'N/A'}
                      </span>
                    </div>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#4c1d95', lineHeight: '1.5' }}>
                      {step.step_description || 'No description'}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '11px', color: '#9333ea' }}>
                      Priority: {step.priority || 0}/5 | Impact: {step.impact || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NO DATA STATE */}
      {!hasData && (
        <div style={{ background: '#f3f4f6', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '16px', margin: 0 }}>⏳ Analysis in progress...</p>
          <p style={{ fontSize: '13px', margin: '10px 0 0 0', color: '#999' }}>Please refresh or wait a moment for the analysis to complete.</p>
        </div>
      )}
    </div>
  );
}