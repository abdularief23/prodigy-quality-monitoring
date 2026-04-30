const db = require('../database');

async function analyzeApproaches(problemId, approaches) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 ANALYZING APPROACHES FOR ${problemId}`);
  console.log(`${'='.repeat(70)}\n`);

  if (!approaches || Object.keys(approaches).length === 0) {
    console.error(`❌ ERROR: No approaches provided for ${problemId}!`);
    return;
  }

  const approachKeys = Object.keys(approaches);
  console.log(`📊 Total approaches: ${approachKeys.length}\n`);

  let bestApproachNumber = approachKeys[0];
  let bestScore = -1;
  let bestApproach = null;
  let scoreSaveCount = 0;

  // ==================== SCORE EACH APPROACH ====================
  approachKeys.forEach((approachNum) => {
    const approach = approaches[approachNum];
    const steps = approach.steps || [];

    console.log(`🔢 Approach ${approachNum} (${approach.engineer_name}):`);
    console.log(`   Steps: ${steps.length}`);

    let safetyScore = 5;
    let efficiencyScore = 5;
    let timeScore = 5;
    let riskScore = 5;

    if (steps.length > 0) {
      // Safety: fewer HIGH risk = better
      const highRisk = steps.filter((s) => s.risk === 'HIGH').length;
      const medRisk = steps.filter((s) => s.risk === 'MEDIUM').length;
      safetyScore = Math.max(0, Math.min(10, 10 - highRisk * 2 - medRisk * 0.5));

      // Efficiency: more steps covered = better (up to 6)
      efficiencyScore = Math.max(0, Math.min(10, (steps.length / 6) * 10));

      // Time: lower avg priority = faster
      const avgPriority = steps.reduce((sum, s) => sum + (s.priority || 3), 0) / steps.length;
      timeScore = Math.max(0, Math.min(10, 10 - (avgPriority - 1) * 2));

      // Risk: fewer critical impact = lower risk
      const criticalImpact = steps.filter((s) => (s.impact || '').toLowerCase().includes('tidak bisa') || (s.impact || '').toLowerCase().includes('terhenti')).length;
      riskScore = Math.max(0, Math.min(10, 10 - criticalImpact * 1.5));
    }

    // Add randomness so approaches have different scores
    const randomBonus = Math.random() * 2 - 1; // -1 to +1
    const totalScore = Math.max(0, Math.min(10, (safetyScore + efficiencyScore + timeScore + riskScore) / 4 + randomBonus));

    console.log(`   Safety: ${safetyScore.toFixed(1)} | Efficiency: ${efficiencyScore.toFixed(1)} | Time: ${timeScore.toFixed(1)} | Risk: ${riskScore.toFixed(1)}`);
    console.log(`   TOTAL: ${totalScore.toFixed(2)}/10\n`);

    // Save score
    db.run(
      `INSERT INTO approach_scores 
       (problem_id, approach_number, safety_score, efficiency_score, time_score, risk_score, total_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [problemId, parseInt(approachNum), safetyScore, efficiencyScore, timeScore, riskScore, totalScore],
      (err) => {
        scoreSaveCount++;
        if (err) {
          console.error(`   ❌ Score save failed for approach ${approachNum}: ${err.message}`);
        } else {
          console.log(`   ✅ Score saved for approach ${approachNum}`);
        }
      }
    );

    // Track best
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestApproachNumber = approachNum;
      bestApproach = approach;
    }
  });

  // ==================== WAIT THEN SAVE OPTIMAL ====================
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!bestApproach) {
        bestApproach = approaches[approachKeys[0]];
        bestApproachNumber = approachKeys[0];
      }

      console.log(`\n${'='.repeat(70)}`);
      console.log(`⭐ BEST APPROACH FOR ${problemId}`);
      console.log(`${'='.repeat(70)}`);
      console.log(`   Approach #: ${bestApproachNumber}`);
      console.log(`   Engineer: ${bestApproach.engineer_name}`);
      console.log(`   Score: ${bestScore.toFixed(2)}/10`);
      console.log(`   Steps: ${bestApproach.steps.length}\n`);

      // Mark as optimal
      db.run(
        `UPDATE approaches SET is_optimal = 1 WHERE problem_id = ? AND approach_number = ?`,
        [problemId, parseInt(bestApproachNumber)],
        (err) => {
          if (err) console.error(`❌ Mark optimal failed: ${err.message}`);
          else console.log(`✅ Marked approach ${bestApproachNumber} as optimal`);
        }
      );

      // ==================== EXTRACT & SAVE 6 STEPS ====================
      const steps = bestApproach.steps || [];

      if (steps.length === 0) {
        console.error(`❌ No steps in best approach! Cannot extract.`);
        console.log(`\n⚠️ FALLBACK: Creating default 6 steps from step_sequence string...\n`);

        // Fallback: parse step_sequence string
        const seqStr = bestApproach.step_sequence || '';
        let fallbackSteps = [];

        if (seqStr) {
          fallbackSteps = seqStr.split('|').map((s, idx) => ({
            name: s.trim(),
            type: idx === 0 ? 'DIAGNOSE' : idx <= 3 ? 'ACTION' : 'VERIFY',
            risk: idx <= 1 ? 'LOW' : idx <= 3 ? 'MEDIUM' : 'LOW',
            priority: idx + 1,
            impact: 'Moderate',
          }));
        }

        if (fallbackSteps.length > 0) {
          saveStepsToDB(problemId, fallbackSteps);
        } else {
          console.error(`❌ No fallback data available for ${problemId}`);
        }
      } else {
        // Sort by priority, take 6
        const sorted = [...steps]
          .sort((a, b) => (a.priority || 3) - (b.priority || 3))
          .slice(0, 6);

        saveStepsToDB(problemId, sorted);
      }

      resolve({
        problemId,
        bestApproachNumber,
        bestScore,
      });
    }, 1500);
  });
}

function saveStepsToDB(problemId, steps) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`💾 SAVING ${steps.length} STEPS FOR ${problemId}`);
  console.log(`${'='.repeat(70)}\n`);

  let savedCount = 0;
  let errorCount = 0;

  steps.forEach((step, index) => {
    const stepName = step.name || `Step ${index + 1}`;
    const stepType = step.type || 'ACTION';
    const stepRisk = step.risk || 'MEDIUM';
    const stepPriority = step.priority || (index + 1);
    const stepImpact = step.impact || 'Moderate';

    console.log(`📝 Step ${index + 1}: ${stepName}`);
    console.log(`   Type: ${stepType} | Risk: ${stepRisk} | Priority: ${stepPriority}`);

    db.run(
      `INSERT INTO optimal_steps 
       (problem_id, step_order, step_name, step_description, step_type, step_risk, priority, impact) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        problemId,
        index + 1,
        stepName,
        `Step ${index + 1}: ${stepName}`,
        stepType,
        stepRisk,
        stepPriority,
        stepImpact,
      ],
      function (err) {
        if (err) {
          errorCount++;
          console.error(`   ❌ FAILED: ${err.message}`);
        } else {
          savedCount++;
          console.log(`   ✅ SAVED (id: ${this.lastID})`);
        }

        if (savedCount + errorCount === steps.length) {
          console.log(`\n${'='.repeat(70)}`);
          console.log(`✅ STEP SAVE COMPLETE FOR ${problemId}`);
          console.log(`   Saved: ${savedCount}/${steps.length}`);
          if (errorCount > 0) console.log(`   Errors: ${errorCount}`);
          console.log(`${'='.repeat(70)}\n`);
        }
      }
    );
  });
}

module.exports = {
  analyzeApproaches,
};