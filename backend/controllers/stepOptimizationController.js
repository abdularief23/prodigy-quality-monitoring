const axios = require('axios');
const db = require('../database');

// ==================== EXTRACT STEPS FROM EXCEL ====================
function extractStepsFromExcel(problemData) {
  const steps = [];
  const stepRegex = /^step_([a-z])_description$/i;

  Object.keys(problemData).forEach((key) => {
    const match = key.match(stepRegex);
    if (match) {
      const stepLabel = match[1].toUpperCase();
      const stepDescription = problemData[key];

      if (stepDescription && stepDescription.toString().trim() !== '') {
        steps.push({
          label: stepLabel,
          description: stepDescription.toString().trim(),
          order: stepLabel.charCodeAt(0) - 65, // A=0, B=1, C=2, etc
        });
      }
    }
  });

  return steps;
}

// ==================== ANALYZE STEPS WITH ML ====================
async function optimizeStepOrder(problemId, description, steps) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔄 STEP OPTIMIZATION ENGINE: ${problemId}`);
  console.log(`${'='.repeat(70)}`);

  try {
    if (!steps || steps.length === 0) {
      console.log('⚠️ No steps found for optimization');
      return null;
    }

    // ==================== STEP 1: CATEGORIZE ====================
    console.log('\n📊 STEP 1: Categorize Problem');
    const category = categorizeProblem(description);
    console.log(`   ✅ Category: ${category}`);

    // ==================== STEP 2: ANALYZE EACH STEP ====================
    console.log('\n🔍 STEP 2: Analyze Each Step');
    const analyzedSteps = steps.map((step) => {
      const analysis = analyzeStep(step.description, category);
      console.log(`   ✅ Step ${step.label}: ${analysis.type}`);
      return {
        ...step,
        type: analysis.type,
        priority: analysis.priority,
        risk: analysis.risk,
        impact: analysis.impact,
      };
    });

    // ==================== STEP 3: DETERMINE OPTIMAL ORDER ====================
    console.log('\n✅ STEP 3: Determine Optimal Order');
    const orderedSteps = optimizeOrder(analyzedSteps);

    orderedSteps.forEach((step, idx) => {
      console.log(`   ${idx + 1}. Step ${step.label} (${step.type})`);
    });

    // ==================== STEP 4: IDENTIFY CRITICAL PATH ====================
    console.log('\n🎯 STEP 4: Identify Critical Path');
    const criticalPath = identifyCriticalPath(orderedSteps);
    console.log(`   ✅ Critical Path: ${criticalPath.map((s) => s.label).join(' → ')}`);

    // ==================== STEP 5: SAVE OPTIMIZATION ====================
    console.log('\n💾 STEP 5: Save Optimization');
    saveStepOptimization(problemId, orderedSteps, criticalPath);

    console.log(`${'='.repeat(70)}\n`);

    return {
      originalSteps: steps,
      analyzedSteps,
      optimizedOrder: orderedSteps,
      criticalPath,
      category,
    };
  } catch (error) {
    console.error('❌ Optimization error:', error);
    throw error;
  }
}

// ==================== CATEGORIZE PROBLEM ====================
function categorizeProblem(description) {
  const descLower = description.toLowerCase();

  if (descLower.match(/tidak nyala|tidak hidup|mati|no power|powerless/i)) {
    return 'Power Supply Issue';
  } else if (descLower.match(/rusak|damage|broken|fail|defect/i)) {
    return 'Component Failure';
  } else if (descLower.match(/tidak bisa|stuck|tidak responsif|error|hang/i)) {
    return 'Functional Issue';
  } else if (descLower.match(/loose|longgar|jatuh|goyang/i)) {
    return 'Assembly Issue';
  } else if (descLower.match(/warna|color|tidak sesuai|mismatch|shade/i)) {
    return 'Quality Issue';
  } else if (descLower.match(/lambat|slow|performance|degrade/i)) {
    return 'Performance Degradation';
  } else if (descLower.match(/overclock|panas|overheat|temperature/i)) {
    return 'Thermal Issue';
  }

  return 'General Problem';
}

// ==================== ANALYZE INDIVIDUAL STEP ====================
function analyzeStep(stepDescription, category) {
  const desc = stepDescription.toLowerCase();

  let type = 'VERIFY';
  let priority = 3;
  let risk = 'LOW';
  let impact = 'Minor';

  // ==================== CHECK STEPS ====================
  if (
    desc.match(
      /check|inspect|verify|test|look at|lihat|periksa|cek|visual|observ/i
    )
  ) {
    type = 'CHECK';
    priority = 1;
    risk = 'LOW';
    impact = 'Minor';
  }

  // ==================== DIAGNOSE STEPS ====================
  if (
    desc.match(
      /diagnose|measure|voltage|multimeter|signal|test dengan|dengan meter|dengan alat|resistance|ohm|ampere|datalogger|thermal|temperature/i
    )
  ) {
    type = 'DIAGNOSE';
    priority = 2;
    risk = 'MEDIUM';
    impact = 'Moderate';
  }

  // ==================== ACTION STEPS ====================
  if (
    desc.match(
      /replace|ganti|repair|rework|clean|bersihkan|install|pasang|remove|lepas|solder|rewiring|recalibrate|adjustment|adjust|torque|tighten/i
    )
  ) {
    type = 'ACTION';
    priority = 4;
    risk = 'HIGH';
    impact = 'Critical';
  }

  // ==================== VERIFY STEPS ====================
  if (
    desc.match(
      /confirm|validate|verify|ensure|pastikan|yakin|ok|normal|pattern|test result|confirm fix|validate solution/i
    )
  ) {
    type = 'VERIFY';
    priority = 5;
    risk = 'LOW';
    impact = 'Moderate';
  }

  return { type, priority, risk, impact };
}

// ==================== OPTIMIZE STEP ORDER ====================
function optimizeOrder(steps) {
  const priority1 = steps.filter((s) => s.priority === 1);
  const priority2 = steps.filter((s) => s.priority === 2);
  const priority3 = steps.filter((s) => s.priority === 3);
  const priority4 = steps.filter((s) => s.priority === 4);
  const priority5 = steps.filter((s) => s.priority === 5);

  return [...priority1, ...priority2, ...priority3, ...priority4, ...priority5];
}

// ==================== IDENTIFY CRITICAL PATH ====================
function identifyCriticalPath(orderedSteps) {
  const criticalSequence = [];

  // Cari first CHECK
  const firstCheck = orderedSteps.find((s) => s.type === 'CHECK');
  if (firstCheck) criticalSequence.push(firstCheck);

  // Cari first DIAGNOSE
  const firstDiagnose = orderedSteps.find((s) => s.type === 'DIAGNOSE');
  if (firstDiagnose) criticalSequence.push(firstDiagnose);

  // Cari first ACTION
  const firstAction = orderedSteps.find((s) => s.type === 'ACTION');
  if (firstAction) criticalSequence.push(firstAction);

  // Cari first VERIFY
  const firstVerify = orderedSteps.find((s) => s.type === 'VERIFY');
  if (firstVerify) criticalSequence.push(firstVerify);

  return criticalSequence.length > 0 ? criticalSequence : orderedSteps.slice(0, 3);
}

// ==================== SAVE OPTIMIZATION ====================
function saveStepOptimization(problemId, orderedSteps, criticalPath) {
  const stepsJson = JSON.stringify(orderedSteps);
  const criticalPathJson = JSON.stringify(criticalPath);

  db.run(
    `INSERT OR REPLACE INTO step_optimization 
     (problem_id, optimized_steps, critical_path, optimized_at)
     VALUES (?, ?, ?, datetime('now'))`,
    [problemId, stepsJson, criticalPathJson],
    (err) => {
      if (err) {
        console.error('❌ Error saving optimization:', err);
      } else {
        console.log(`✅ Step optimization saved for ${problemId}`);
      }
    }
  );
}

module.exports = {
  extractStepsFromExcel,
  optimizeStepOrder,
};