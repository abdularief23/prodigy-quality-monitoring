/**
 * Step Analyzer - Extract & Score 6 Steps dari Optimal Approach
 */

function analyzeSteps(stepSequence) {
  if (!stepSequence) return [];

  // Split by pipe
  const steps = stepSequence.split(' | ').map(s => s.trim());

  // Define step types & risk mapping
  const stepTypeMap = {
    'cek': 'DIAGNOSE',
    'check': 'DIAGNOSE',
    'ukur': 'DIAGNOSE',
    'periksa': 'DIAGNOSE',
    'inspect': 'DIAGNOSE',
    'test': 'VERIFY',
    'verify': 'VERIFY',
    'ganti': 'ACTION',
    'replace': 'ACTION',
    'bersihkan': 'ACTION',
    'clean': 'ACTION',
    'kalibrasi': 'ACTION',
    'calibrate': 'ACTION',
    'jalankan': 'VERIFY',
    'run': 'VERIFY',
  };

  const stepRiskMap = {
    'DIAGNOSE': 'LOW',
    'ACTION': 'HIGH',
    'VERIFY': 'LOW',
  };

  // Score each step
  const scoredSteps = steps.map((step, idx) => {
    // Determine step type
    let stepType = 'VERIFY';
    const lowerStep = step.toLowerCase();
    
    for (const [keyword, type] of Object.entries(stepTypeMap)) {
      if (lowerStep.includes(keyword)) {
        stepType = type;
        break;
      }
    }

    // Determine risk
    const stepRisk = stepRiskMap[stepType];

    // Determine priority (higher index = higher priority)
    const priority = Math.min(5, Math.ceil((idx + 1) / steps.length * 5));

    // Determine impact
    let impact = 'Moderate';
    if (stepType === 'ACTION') impact = 'Critical';
    if (stepType === 'VERIFY') impact = 'Moderate';
    if (stepType === 'DIAGNOSE') impact = 'Moderate';

    return {
      order: idx + 1,
      name: `Step ${String.fromCharCode(65 + idx)}`, // A, B, C, D, E, F
      description: step,
      type: stepType,
      risk: stepRisk,
      priority: priority,
      impact: impact,
    };
  });

  return scoredSteps;
}

module.exports = {
  analyzeSteps,
};