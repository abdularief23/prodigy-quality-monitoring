import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api';

export default function Dashboard({ problems = [], insights = null, loading, error, onRefresh }) {
  const criticalCount = insights?.by_severity?.Critical || problems.filter((problem) => String(problem.severity || '').toLowerCase() === 'critical').length;
  const openCount = problems.filter((problem) => String(problem.status || '').toLowerCase() === 'open').length;
  const closedCount = problems.filter((problem) => String(problem.status || '').toLowerCase() === 'closed').length;
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [optimalSteps, setOptimalSteps] = useState({});
  const [approachScores, setApproachScores] = useState({});
  const [loadingSteps, setLoadingSteps] = useState({});

  const handleProblemClick = async (problem) => {
    if (!problem?.id) return;
    if (selectedProblemId === problem.id) {
      setSelectedProblemId(null);
      return;
    }

    setSelectedProblemId(problem.id);

    if (!optimalSteps[problem.id]) {
      setLoadingSteps((prev) => ({ ...prev, [problem.id]: true }));
      try {
        const [stepsRes, scoresRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/problems/${problem.id}/optimal-steps`),
          axios.get(`${API_BASE_URL}/problems/${problem.id}/approach-scores`),
        ]);

        if (stepsRes.data.status === 'success') {
          setOptimalSteps((prev) => ({ ...prev, [problem.id]: stepsRes.data.data || [] }));
        }
        if (scoresRes.data.status === 'success') {
          setApproachScores((prev) => ({ ...prev, [problem.id]: scoresRes.data.bestApproach || null }));
        }
      } catch (err) {
        setOptimalSteps((prev) => ({ ...prev, [problem.id]: [] }));
      } finally {
        setLoadingSteps((prev) => ({ ...prev, [problem.id]: false }));
      }
    }
  };

  const severityClass = {
    Critical: 'danger',
    High: 'warning',
    Medium: 'info',
    Low: 'success',
  };

  const riskClass = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
  };

  if (loading && problems.length === 0) {
    return <div className="alert alert-info text-center">Loading dashboard...</div>;
  }

  if (error && problems.length === 0) {
    return (
      <div className="alert alert-danger text-center">
        <h4 className="alert-heading">Error</h4>
        <p className="mb-3">{error}</p>
        <button onClick={onRefresh} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="card border-primary shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small text-uppercase">Total Problem</div>
                <div className="display-6 text-primary fw-bold">{problems.length}</div>
              </div>
              <div className="fs-1">📊</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="card border-danger shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small text-uppercase">Jumlah Critical Issue</div>
                <div className="display-6 text-danger fw-bold">{criticalCount}</div>
              </div>
              <div className="fs-1">🚨</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="card border-warning shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small text-uppercase">Status Problem Open</div>
                <div className="display-6 text-warning fw-bold">{openCount}</div>
              </div>
              <div className="fs-1">🟠</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="card border-success shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small text-uppercase">Status Problem Closed</div>
                <div className="display-6 text-success fw-bold">{closedCount}</div>
              </div>
              <div className="fs-1">✅</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1">Production Problems</h2>
          <p className="text-muted mb-0">Click a problem card to load its optimal 6-step solution.</p>
        </div>
      </div>

      {problems.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-muted">No problems found. Upload Excel to get started.</div>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {problems.map((problem) => {
            const sev = severityClass[problem.severity] || 'secondary';
            const isSelected = selectedProblemId === problem.id;
            const steps = optimalSteps[problem.id] || [];
            const bestScore = approachScores[problem.id];
            const isLoadingSteps = loadingSteps[problem.id] || false;

            return (
              <div
                key={problem.id}
                className={`card shadow-sm card-hover cursor-pointer border-${sev}`}
                onClick={() => handleProblemClick(problem)}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between gap-3 flex-wrap mb-3">
                    <div>
                      <h5 className="card-title mb-1">{problem.id}</h5>
                      <div className="text-muted small">{problem.equipment || 'Unknown'} • {problem.location || 'Unknown'}</div>
                    </div>
                    <span className={`badge text-bg-${sev} align-self-start`}>{problem.severity || 'Unknown'}</span>
                  </div>

                  <p className="card-text">{problem.description || 'No description'}</p>

                  {bestScore && (
                    <div className="alert alert-info py-2 mb-3 small">
                      <strong>Optimal Score:</strong> {bestScore.total_score?.toFixed(2)}/10, Safety {bestScore.safety_score?.toFixed(1)}, Efficiency {bestScore.efficiency_score?.toFixed(1)}, Time {bestScore.time_score?.toFixed(1)}, Risk {bestScore.risk_score?.toFixed(1)}
                    </div>
                  )}

                  {isSelected && (
                    <div className="border-top pt-3 mt-3" onClick={(e) => e.stopPropagation()}>
                      {isLoadingSteps ? (
                        <div className="alert alert-secondary mb-0">Loading steps...</div>
                      ) : steps.length > 0 ? (
                        <>
                          <h6 className="mb-3">Optimal 6-Step Solution</h6>
                          <div className="d-grid gap-3">
                            {steps.map((step, idx) => (
                              <div className="d-flex gap-3" key={step.id || idx}>
                                <div className="step-badge bg-primary text-white">{idx + 1}</div>
                                <div className="flex-grow-1">
                                  <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                                    <strong>{step.step_name || `Step ${idx + 1}`}</strong>
                                    <span className="badge text-bg-light border">{step.step_type}</span>
                                    <span className={`badge text-bg-${riskClass[step.step_risk] || 'secondary'}`}>Risk: {step.step_risk}</span>
                                  </div>
                                  <div className="text-muted small mb-1">{step.step_description || step.step_name}</div>
                                  <div className="small text-muted">Priority: {step.priority}/5 • Impact: {step.impact}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="alert alert-warning mb-0">No optimal steps found. Try re-uploading the Excel file.</div>
                      )}
                    </div>
                  )}

                  <div className="text-center small text-muted mt-3">
                    {isSelected ? 'Close solution' : 'View 6-step optimal solution'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
