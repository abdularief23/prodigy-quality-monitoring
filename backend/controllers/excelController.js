const path = require('path');
const xlsx = require('xlsx');
const db = require('../database');
const { analyzeApproaches } = require('./approachOptimizer');

function generateProblemId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PRB-${timestamp}-${random}`;
}

async function importExcelFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📥 STARTING EXCEL IMPORT: ${filePath}`);
      console.log(`${'='.repeat(70)}\n`);

      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      console.log(`📊 Total rows in Excel: ${data.length}`);
      console.log(`📄 Sheet name: ${sheetName}\n`);

      const problemsMap = {};

      // ==================== GROUP BY PROBLEM ====================
      data.forEach((row, index) => {
        const problemId = row.problem_id || generateProblemId();
        const approachNumber = parseInt(row.approach_number) || 1;

        if (!problemsMap[problemId]) {
          problemsMap[problemId] = {
            id: problemId,
            name: row.problem_name || '',
            description: row.problem_description || '',
            equipment: row.equipment || 'Unknown',
            location: row.location || 'Unknown',
            severity: row.severity || 'Medium',
            status: row.status || 'Open',
            approaches: {},
          };
        }

        if (!problemsMap[problemId].approaches[approachNumber]) {
          problemsMap[problemId].approaches[approachNumber] = {
            number: approachNumber,
            engineer_name: row.engineer_name || 'Unknown',
            step_sequence: row.step_sequence || '',
            steps: [],
            analysis: {
              sentiment: row.sentiment || '',
              symptoms: row.symptoms || '',
              impact: row.impact || '',
            },
          };
        }

        const stepType = row.step_type || 'ACTION';
        const stepRisk = row.step_risk || 'MEDIUM';
        const priority = parseInt(row.priority) || 3;
        const impact = row.impact || 'Moderate';

        problemsMap[problemId].approaches[approachNumber].steps.push({
          type: stepType,
          risk: stepRisk,
          priority: priority,
          impact: impact,
        });
      });

      console.log(`\n🔍 GROUPED DATA:`);
      console.log(`   Total problems: ${Object.keys(problemsMap).length}`);
      
      let totalApproaches = 0;
      Object.keys(problemsMap).forEach((pId) => {
        totalApproaches += Object.keys(problemsMap[pId].approaches).length;
        console.log(`   ${pId}: ${Object.keys(problemsMap[pId].approaches).length} approaches`);
      });
      console.log(`   Total approaches: ${totalApproaches}\n`);

      // ==================== SAVE TO DATABASE ====================
      let savedProblems = 0;

      Object.keys(problemsMap).forEach((problemId) => {
        const problem = problemsMap[problemId];

        console.log(`\n💾 Saving problem: ${problemId}`);
        console.log(`   Equipment: ${problem.equipment}`);
        console.log(`   Location: ${problem.location}`);
        console.log(`   Severity: ${problem.severity}`);
        console.log(`   Approaches: ${Object.keys(problem.approaches).length}`);

        db.run(
          `INSERT OR IGNORE INTO problems 
           (id, description, location, equipment, severity, status, source) 
           VALUES (?, ?, ?, ?, ?, ?, 'excel')`,
          [
            problem.id,
            problem.description,
            problem.location,
            problem.equipment,
            problem.severity,
            problem.status,
          ],
          (err) => {
            if (err) {
              console.error(`   ❌ Problem save failed: ${err.message}`);
            } else {
              savedProblems++;
              console.log(`   ✅ Problem saved\n`);

              // ==================== SAVE APPROACHES ====================
              let savedApproaches = 0;
              Object.keys(problem.approaches).forEach((approachNum) => {
                const approach = problem.approaches[approachNum];

                db.run(
                  `INSERT OR IGNORE INTO approaches 
                   (problem_id, approach_number, engineer_name, step_sequence) 
                   VALUES (?, ?, ?, ?)`,
                  [
                    problemId,
                    approach.number,
                    approach.engineer_name,
                    approach.step_sequence,
                  ],
                  (err) => {
                    if (err) {
                      console.error(`      ❌ Approach ${approachNum} failed: ${err.message}`);
                    } else {
                      savedApproaches++;
                      console.log(`      ✅ Approach ${approachNum} (${approach.engineer_name}) - ${approach.steps.length} steps`);

                      // When all approaches for this problem are saved, start analysis
                      if (savedApproaches === Object.keys(problem.approaches).length) {
                        console.log(`\n🔄 All approaches saved for ${problemId}. Starting analysis...\n`);
                        
                        // IMPORTANT: Call analysis with correct data
                        analyzeApproaches(problemId, problem.approaches).catch((err) => {
                          console.error(`❌ Analysis failed for ${problemId}:`, err);
                        });
                      }
                    }
                  }
                );
              });
            }
          }
        );
      });

      // Resolve after delay
      setTimeout(() => {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`✅ EXCEL IMPORT PROCESS COMPLETED`);
        console.log(`${'='.repeat(70)}\n`);
        
        resolve({
          total: data.length,
          totalProblems: Object.keys(problemsMap).length,
          totalApproaches: totalApproaches,
          filename: path.basename(filePath),
        });
      }, 2000);

    } catch (error) {
      console.error(`\n${'='.repeat(70)}`);
      console.error(`❌ EXCEL PARSING ERROR`);
      console.error(`${'='.repeat(70)}`);
      console.error(error);
      reject(error);
    }
  });
}

module.exports = {
  importExcelFile,
};