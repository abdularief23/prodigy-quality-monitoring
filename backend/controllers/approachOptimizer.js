const db = require('../database');

async function analyzeApproaches(problemId, approaches) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 ANALYZING APPROACHES FOR ${problemId}`);
  console.log(`${'='.repeat(70)}\n`);

  if (!approaches || Object.keys(approaches).length === 0) {
    console.error(`❌ ERROR: No approaches provided!`);
    return Promise.reject(new Error('No approaches'));
  }

  console.log(`📊 Total approaches to analyze: ${Object.keys(approaches).length}\n`);

  let bestApproachNumber = 1;
  let bestScore = 0;
  const approachScores = {};

  // ==================== SCORE EACH APPROACH ====================
  Object.keys(approaches).forEach((approachNum) => {
    const approach = approaches[approachNum];
    const steps = approach.steps || [];

    console.log(`\n🔢 Approach ${approachNum} (${approach.engineer_name}):`);
    console.log(`   Total steps: ${steps.length}`);

    if (steps.length === 0) {
      console.warn(`   ⚠️ WARNING: No steps in this approach!`);
      approachScores[approachNum] = 0;
      return;
    }

    const safetyScore = calculateSafetyScore(steps);
    const efficiencyScore = calculateEfficiencyScore(steps);
    const timeScore = calculateTimeScore(steps);
    const riskScore = calculateRiskScore(steps);
    const totalScore = (safetyScore + efficiencyScore + timeScore + riskScore) / 4;

    approachScores[approachNum] = totalScore;

    console.log(`   Safety: ${safetyScore.toFixed(2)}/10`);
    console.log(`   Efficiency: ${efficiencyScore.toFixed(2)}/10`);
    console.log(`   Time: ${timeScore.toFixed(2)}/10`);
    console.log(`   Risk: ${riskScore.toFixed(2)}/10`);
    console.log(`   TOTAL: ${totalScore.toFixed(2)}/10`);

    // Save score to DB
    db.run(
      `INSERT OR REPLACE INTO approach_scores 
       (problem_id, approach_number, safety_score, efficiency_score, time_score, risk_score, total_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [problemId, approachNum, safetyScore, efficiencyScore, timeScore, riskScore, totalScore],
      (err) => {
        if (err) {
          console.error(`   ❌ Score save failed: ${err.message}`);
        } else {
          console.log(`   ✅ Scores saved to DB`);
        }
      }
    );

    // Track best
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestApproachNumber = approachNum;
    }
  });

  // ==================== SELECT BEST APPROACH ====================
  console.log(`\n${'='.repeat(70)}`);
  console.log(`⭐ BEST APPROACH SELECTED`);
  console.log(`${'='.repeat(70)}`);
  
  const bestApproach = approaches[bestApproachNumber];
  console.log(`   Approach #: ${bestApproachNumber}`);
  console.log(`   Engineer: ${bestApproach.engineer_name}`);
  console.log(`   Score: ${bestScore.toFixed(2)}/10`);
  console.log(`   Steps: ${bestApproach.steps.length}\n`);

  // Mark as optimal
  db.run(
    `UPDATE approaches SET is_optimal = 1 WHERE problem_id = ? AND approach_number = ?`,
    [problemId, bestApproachNumber],
    (err) => {
      if (err) {
        console.error(`❌ Update optimal failed: ${err.message}`);
      } else {
        console.log(`✅ Marked as optimal in DB\n`);
      }
    }
  );

  // Extract steps
  console.log(`📝 Extracting 6 optimal steps...\n`);
  extractOptimalSteps(problemId, bestApproachNumber, bestApproach.steps);

  return Promise.resolve({
    problemId,
    bestApproachNumber,
    bestScore,
  });
}

function calculateSafetyScore(steps) {
  const highRiskCount = steps.filter((s) => s.risk === 'HIGH').length;
  const mediumRiskCount = steps.filter((s) => s.risk === 'MEDIUM').length;
  const score = 10 - highRiskCount * 2 - mediumRiskCount * 0.5;
  return Math.max(0, Math.min(10, score));
}

function calculateEfficiencyScore(steps) {
  const totalSteps = steps.length;
  const highPriorityCount = steps.filter((s) => s.priority <= 2).length;
  const score = 10 - (totalSteps - 6) + highPriorityCount;
  return Math.max(0, Math.min(10, score));
}

function calculateTimeScore(steps) {
  const avgPriority = steps.reduce((sum, s) => sum + s.priority, 0) / steps.length;
  const score = 10 - (avgPriority - 1) * 2;
  return Math.max(0, Math.min(10, score));
}

function calculateRiskScore(steps) {
  const criticalCount = steps.filter((s) => s.impact === 'Critical').length;
  const moderateCount = steps.filter((s) => s.impact === 'Moderate').length;
  const score = 10 - criticalCount * 1.5 - moderateCount * 0.5;
  return Math.max(0, Math.min(10, score));
}

function extractOptimalSteps(problemId, bestApproachNumber, allSteps) {
  console.log(`${'='.repeat(70)}`);
  console.log(`✂️  EXTRACTING 6 STEPS FROM ${allSteps.length} TOTAL`);
  console.log(`${'='.repeat(70)}\n`);

  if (!allSteps || allSteps.length === 0) {
    console.error(`❌ ERROR: No steps to extract!`);
    return;
  }

  const sortedSteps = [...allSteps]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const impactOrder = { Critical: 0, Moderate: 1, Minor: 2 };
      return (impactOrder[a.impact] || 1) - (impactOrder[b.impact] || 1);
    })
    .slice(0, 6);

  const stepNames = [
    'Diagnose Problem',
    'Inspect Equipment',
    'Analyze Data',
    'Execute Fix',
    'Verify Solution',
    'Document Results',
  ];
  const stepTypes = ['DIAGNOSE', 'ACTION', 'ACTION', 'ACTION', 'VERIFY', 'VERIFY'];

  let savedCount = 0;

  sortedSteps.forEach((step, index) => {
    console.log(`📝 Step ${index + 1}: ${stepNames[index]}`);
    console.log(`   Type: ${stepTypes[index]} | Risk: ${step.risk} | Priority: ${step.priority} | Impact: ${step.impact}`);

    db.run(
      `INSERT INTO optimal_steps 
       (problem_id, step_order, step_name, step_description, step_type, step_risk, priority, impact) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        problemId,
        index + 1,
        stepNames[index],
        `Step ${index + 1}: ${stepNames[index]}`,
        stepTypes[index],
        step.risk || 'MEDIUM',
        step.priority || 3,
        step.impact || 'Moderate',
      ],
      (err) => {
        if (err) {
          console.error(`   ❌ FAILED: ${err.message}`);
        } else {
          savedCount++;
          console.log(`   ✅ SAVED`);

          if (savedCount === sortedSteps.length) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`✅ ALL 6 STEPS SAVED FOR ${problemId}!`);
            console.log(`${'='.repeat(70)}\n`);
          }
        }
      }
    );
  });
}

module.exports = {
  analyzeApproaches,
};