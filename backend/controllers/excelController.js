const path = require('path');
const xlsx = require('xlsx');
const db = require('../database');
const { selectBestApproach } = require('./approachOptimizer');
const { analyzeSteps } = require('./stepAnalyzer');

function generateProblemId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PRB-${Date.now()}-${random}`;
}

async function importExcelFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📥 IMPORTING EXCEL FILE`);
      console.log(`${'='.repeat(70)}`);
      console.log(`📂 File: ${filePath}`);

      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      console.log(`📊 Found ${data.length} rows (5 problems × 20 approaches)`);

      if (data.length === 0) {
        return reject(new Error('Excel file is empty'));
      }

      // ==================== STEP 1: GROUP BY PROBLEM ====================
      const problemGroups = {};

      data.forEach((row, idx) => {
        const problemId = row.problem_id;

        if (!problemGroups[problemId]) {
          problemGroups[problemId] = {
            info: {
              id: row.problem_id,
              name: row.problem_name,
              description: row.problem_description,
              symptoms: row.symptoms || '',
              impact: row.impact || '',
              equipment: row.equipment || '',
              location: row.location || '',
              severity: row.severity || 'Medium',
              status: row.status || 'Open',
            },
            approaches: [],
          };
        }

        problemGroups[problemId].approaches.push({
          approach_number: parseInt(row.approach_number) || 0,
          engineer_name: row.engineer_name || 'Unknown',
          step_sequence: row.step_sequence || '',
          approach_description: row.approach_description || '',
        });
      });

      const problemIds = Object.keys(problemGroups);
      console.log(`\n📋 Grouped into ${problemIds.length} problems:`);
      problemIds.forEach((id) => {
        console.log(
          `   • ${id}: ${problemGroups[id].approaches.length} approaches`
        );
      });

      let processedCount = 0;

      // ==================== STEP 2: PROCESS EACH PROBLEM ====================
      problemIds.forEach((problemId) => {
        const group = problemGroups[problemId];

        // 1. Save problem info
        db.run(
          `INSERT OR REPLACE INTO problems 
           (id, description, location, equipment, severity, status, source) 
           VALUES (?, ?, ?, ?, ?, ?, 'excel')`,
          [
            group.info.id,
            `${group.info.name}: ${group.info.description} | Symptoms: ${group.info.symptoms} | Impact: ${group.info.impact}`,
            group.info.location,
            group.info.equipment,
            group.info.severity,
            group.info.status,
          ],
          (err) => {
            if (err) {
              console.error(`❌ Error saving problem ${problemId}:`, err);
            } else {
              console.log(`\n✅ Problem saved: ${problemId}`);

              // 2. Save all 20 approaches
              let approachSaved = 0;
              group.approaches.forEach((approach) => {
                db.run(
                  `INSERT INTO approaches 
                   (problem_id, approach_number, engineer_name, step_sequence, approach_description)
                   VALUES (?, ?, ?, ?, ?)`,
                  [
                    problemId,
                    approach.approach_number,
                    approach.engineer_name,
                    approach.step_sequence,
                    approach.approach_description,
                  ],
                  (err) => {
                    if (!err) {
                      approachSaved++;
                    }

                    // All approaches saved, now optimize
                    if (approachSaved === group.approaches.length) {
                      console.log(
                        `   ✅ ${approachSaved} approaches saved`
                      );

                      // 3. Select best approach & extract steps
                      selectBestApproachAndSteps(problemId, group.approaches);
                    }
                  }
                );
              });
            }
          }
        );

        processedCount++;
      });

      // ==================== RESOLVE ====================
      setTimeout(() => {
        resolve({
          total: data.length,
          imported: problemIds.length,
          filename: path.basename(filePath),
          message: `Imported ${problemIds.length} problems with ${data.length} total approaches`,
        });
      }, 3000);
    } catch (error) {
      console.error('❌ Excel parsing error:', error.message);
      reject(error);
    }
  });
}

/**
 * Select Best Approach & Extract Optimal Steps
 */
async function selectBestApproachAndSteps(problemId, approaches) {
  try {
    console.log(`\n🧠 Analyzing ${approaches.length} approaches for ${problemId}...`);

    // Score setiap approach
    const scoredApproaches = approaches.map((approach, idx) => {
      const score = calculateApproachScore(approach, idx);
      const stepCount = approach.step_sequence.split(' | ').length;

      return {
        ...approach,
        score: score,
        stepCount: stepCount,
      };
    });

    // Sort by score (highest first)
    scoredApproaches.sort((a, b) => b.score - a.score);

    // Get best 3 approaches untuk reference
    const top3 = scoredApproaches.slice(0, 3);

    console.log(`   📊 Top 3 approaches:`);
    top3.forEach((app, idx) => {
      console.log(
        `      ${idx + 1}. ${app.engineer_name} (Approach ${app.approach_number}): Score ${app.score.toFixed(2)} - ${app.stepCount} steps`
      );
    });

    const bestApproach = scoredApproaches[0];

    console.log(
      `   ✅ Best approach selected: #${bestApproach.approach_number} by ${bestApproach.engineer_name}`
    );

    // Save approach scores
    for (const approach of scoredApproaches) {
      db.run(
        `INSERT OR REPLACE INTO approach_scores 
         (problem_id, approach_number, safety_score, efficiency_score, time_score, risk_score, total_score)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          problemId,
          approach.approach_number,
          getScoreComponent(approach, 'safety'),
          getScoreComponent(approach, 'efficiency'),
          getScoreComponent(approach, 'time'),
          getScoreComponent(approach, 'risk'),
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

    // Extract & Score 6 steps dari best approach
    const steps = analyzeSteps(bestApproach.step_sequence);

    console.log(`   📝 Extracted ${steps.length} steps:`);
    steps.forEach((step) => {
      console.log(
        `      • ${step.name}: ${step.type} (Risk: ${step.risk}, Priority: ${step.priority}/5)`
      );
    });

    // Save optimal steps ke DB
    steps.forEach((step) => {
      db.run(
        `INSERT OR REPLACE INTO optimal_steps 
         (problem_id, approach_number, step_order, step_name, step_description, step_type, step_risk, priority, impact)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          problemId,
          bestApproach.approach_number,
          step.order,
          step.name,
          step.description,
          step.type,
          step.risk,
          step.priority,
          step.impact,
        ]
      );
    });

    console.log(`   ✅ Steps saved to database\n`);
  } catch (error) {
    console.error(`❌ Analysis error for ${problemId}:`, error);
  }
}

/**
 * Calculate Approach Score (0-100)
 */
function calculateApproachScore(approach, index) {
  let score = 50; // Base score

  // Factor 1: Engineer diversity (different engineer = bonus)
  const engineerBonus = (5 - (index % 5)) * 3;
  score += engineerBonus;

  // Factor 2: Step efficiency (fewer steps = better)
  const stepCount = approach.step_sequence.split(' | ').length;
  const stepScore = Math.max(0, 20 - stepCount * 2);
  score += stepScore;

  // Factor 3: Logical flow (diagnose first = better)
  const stepsLower = approach.step_sequence.toLowerCase();
  const startsWithDiagnose =
    stepsLower.startsWith('cek') ||
    stepsLower.startsWith('check') ||
    stepsLower.startsWith('periksa') ||
    stepsLower.startsWith('inspect');
  const logicScore = startsWithDiagnose ? 15 : 5;
  score += logicScore;

  // Factor 4: Risk minimization (avoid excessive replacements)
  const replacementCount = (stepsLower.match(/ganti|replace/g) || []).length;
  const riskScore = replacementCount <= 1 ? 10 : Math.max(0, 10 - replacementCount * 3);
  score += riskScore;

  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get score component value
 */
function getScoreComponent(approach, component) {
  const stepsLower = approach.step_sequence.toLowerCase();
  const stepCount = approach.step_sequence.split(' | ').length;

  switch (component) {
    case 'safety':
      // Higher safety = fewer replacements
      const replacements = (stepsLower.match(/ganti|replace/g) || []).length;
      return Math.max(0, 100 - replacements * 20);

    case 'efficiency':
      // Higher efficiency = fewer steps
      return Math.max(0, 100 - stepCount * 5);

    case 'time':
      // Higher time score = faster (fewer steps)
      return Math.max(0, 100 - stepCount * 3);

    case 'risk':
      // Lower risk = better
      const hasDiagnosticFirst =
        stepsLower.startsWith('cek') ||
        stepsLower.startsWith('check') ||
        stepsLower.startsWith('periksa');
      return hasDiagnosticFirst ? 85 : 60;

    default:
      return 50;
  }
}

module.exports = {
  importExcelFile,
};