/**
 * Approach Optimizer - Select Best Approach dari 20 Alternatives
 */

const db = require('../database');

async function selectBestApproach(problemId, approaches) {
  try {
    console.log(`\n🧠 Optimizing 20 approaches for ${problemId}...`);

    // Score setiap approach
    const scoredApproaches = approaches.map((approach, idx) => {
      const score = calculateApproachScore(approach, idx);
      return {
        ...approach,
        score: score,
      };
    });

    // Sort by score (highest first)
    scoredApproaches.sort((a, b) => b.score - a.score);

    // Get best approach
    const bestApproach = scoredApproaches[0];

    console.log(`✅ Best approach selected: ${bestApproach.approach_number}`);
    console.log(`   Engineer: ${bestApproach.engineer_name}`);
    console.log(`   Score: ${bestApproach.score.toFixed(2)}`);
    console.log(`   Steps: ${bestApproach.step_sequence.substring(0, 50)}...`);

    // Save semua scores ke DB
    for (const approach of scoredApproaches) {
      db.run(
        `INSERT OR REPLACE INTO approach_scores 
         (problem_id, approach_number, safety_score, efficiency_score, time_score, risk_score, total_score)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          problemId,
          approach.approach_number,
          approach.safetyScore || 0,
          approach.efficiencyScore || 0,
          approach.timeScore || 0,
          approach.riskScore || 0,
          approach.score,
        ]
      );
    }

    // Mark best approach
    db.run(
      `UPDATE approaches SET is_optimal = 1, optimization_score = ? 
       WHERE problem_id = ? AND approach_number = ?`,
      [bestApproach.score, problemId, bestApproach.approach_number]
    );

    return bestApproach;
  } catch (error) {
    console.error(`❌ Optimization error for ${problemId}:`, error);
    throw error;
  }
}

function calculateApproachScore(approach, index) {
  // Scoring algorithm
  let score = 50; // Base score

  // Factor 1: Engineer experience (distributed)
  const engineerScore = (5 - (index % 5)) * 3; // Engineers berbeda
  score += engineerScore;

  // Factor 2: Step count (prefer less steps)
  const stepCount = approach.step_sequence.split(' | ').length;
  const stepScore = Math.max(0, 20 - stepCount * 2);
  score += stepScore;

  // Factor 3: Approach logic (prefer diagnostic first)
  const stepsLower = approach.step_sequence.toLowerCase();
  const hasDiagnosticFirst = stepsLower.startsWith('cek') || 
                             stepsLower.startsWith('check') || 
                             stepsLower.startsWith('periksa');
  const diagnosticScore = hasDiagnosticFirst ? 15 : 5;
  score += diagnosticScore;

  // Factor 4: Risk minimization
  const hasMinimalReplacement = (stepsLower.match(/ganti|replace/g) || []).length <= 1;
  const riskScore = hasMinimalReplacement ? 10 : 0;
  score += riskScore;

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  selectBestApproach,
};