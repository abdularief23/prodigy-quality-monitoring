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
      console.log(`📄 Sheet name: ${sheetName}`);

      // Log first row columns
      if (data.length > 0) {
        console.log(`\n📋 EXCEL COLUMNS DETECTED:`);
        Object.keys(data[0]).forEach((col) => {
          console.log(`   - ${col}: "${data[0][col]}"`);
        });
      }

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
            symptoms: row.symptoms || '',
            impact: row.impact || '',
            equipment: row.equipment || 'Unknown',
            location: row.location || 'Unknown',
            severity: row.severity || 'Medium',
            status: row.status || 'Open',
            approaches: {},
          };
        }

        if (!problemsMap[problemId].approaches[approachNumber]) {
          // ==================== PARSE 6 STEP COLUMNS ====================
          const steps = [];

          // Method 1: step_sequence1, step_sequence2, ..., step_sequence6
          for (let i = 1; i <= 10; i++) {
            const stepValue = row[`step_sequence${i}`] || row[`step_sequence_${i}`] || row[`step${i}`] || row[`step_${i}`];
            if (stepValue && stepValue.toString().trim() !== '') {
              steps.push({
                name: stepValue.toString().trim(),
                order: i,
              });
            }
          }

          // Method 2: If single step_sequence column with delimiters
          if (steps.length === 0 && row.step_sequence) {
            const seq = row.step_sequence.toString();
            let rawSteps = [];

            if (seq.includes('|')) {
              rawSteps = seq.split('|').map((s) => s.trim()).filter(Boolean);
            } else if (seq.includes(';')) {
              rawSteps = seq.split(';').map((s) => s.trim()).filter(Boolean);
            } else {
              rawSteps = [seq.trim()];
            }

            rawSteps.forEach((s, idx) => {
              steps.push({ name: s, order: idx + 1 });
            });
          }

          // Build step_sequence string for DB
          const stepSequenceStr = steps.map((s) => s.name).join(' | ');

          // Assign types based on position
          const typeByPosition = ['DIAGNOSE', 'ACTION', 'ACTION', 'ACTION', 'VERIFY', 'VERIFY'];
          const riskLevels = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'LOW', 'LOW'];
          const priorities = [1, 2, 2, 3, 4, 5];

          const enrichedSteps = steps.map((step, idx) => ({
            name: step.name,
            order: step.order,
            type: typeByPosition[idx] || 'ACTION',
            risk: riskLevels[idx] || 'MEDIUM',
            priority: priorities[idx] || 3,
            impact: row.impact || 'Moderate',
          }));

          problemsMap[problemId].approaches[approachNumber] = {
            number: approachNumber,
            engineer_name: row.engineer_name || 'Unknown',
            step_sequence: stepSequenceStr,
            steps: enrichedSteps,
          };

          if (index < 5) {
            console.log(`\n   Row ${index + 1}: ${problemId} Approach #${approachNumber}`);
            console.log(`   Engineer: ${row.engineer_name}`);
            console.log(`   Steps found: ${enrichedSteps.length}`);
            enrichedSteps.forEach((s, i) => {
              console.log(`     Step ${i + 1}: ${s.name} (${s.type})`);
            });
          }
        }
      });

      // ==================== LOG GROUPED DATA ====================
      console.log(`\n\n🔍 GROUPED DATA:`);
      console.log(`   Total unique problems: ${Object.keys(problemsMap).length}`);

      let totalApproaches = 0;
      Object.keys(problemsMap).forEach((pId) => {
        const p = problemsMap[pId];
        const numApproaches = Object.keys(p.approaches).length;
        totalApproaches += numApproaches;

        const firstApproachKey = Object.keys(p.approaches)[0];
        const firstApproach = p.approaches[firstApproachKey];
        console.log(`   ${pId}: ${numApproaches} approaches, ${firstApproach.steps.length} steps per approach`);
      });
      console.log(`   Total approaches: ${totalApproaches}\n`);

      // ==================== SAVE TO DATABASE ====================
      let savedProblems = 0;

      Object.keys(problemsMap).forEach((problemId) => {
        const problem = problemsMap[problemId];

        let fullDesc = problem.description;
        if (problem.name) fullDesc = `${problem.name}: ${problem.description}`;
        if (problem.symptoms) fullDesc += ` | Symptoms: ${problem.symptoms}`;
        if (problem.impact) fullDesc += ` | Impact: ${problem.impact}`;

        console.log(`💾 Saving: ${problemId}`);

        db.run(
          `INSERT OR IGNORE INTO problems 
           (id, description, location, equipment, severity, status, source) 
           VALUES (?, ?, ?, ?, ?, ?, 'excel')`,
          [problemId, fullDesc, problem.location, problem.equipment, problem.severity, problem.status],
          (err) => {
            if (err) {
              console.error(`   ❌ Problem save failed: ${err.message}`);
            } else {
              savedProblems++;
              console.log(`   ✅ Problem saved`);

              let savedApproaches = 0;
              const totalApproachCount = Object.keys(problem.approaches).length;

              Object.keys(problem.approaches).forEach((approachNum) => {
                const approach = problem.approaches[approachNum];

                db.run(
                  `INSERT OR IGNORE INTO approaches 
                   (problem_id, approach_number, engineer_name, step_sequence) 
                   VALUES (?, ?, ?, ?)`,
                  [problemId, approach.number, approach.engineer_name, approach.step_sequence],
                  (err) => {
                    savedApproaches++;

                    if (savedApproaches === totalApproachCount) {
                      console.log(`   ✅ All ${savedApproaches} approaches saved`);
                      console.log(`\n🔄 Starting analysis for ${problemId}...\n`);

                      analyzeApproaches(problemId, problem.approaches).catch((err) => {
                        console.error(`❌ Analysis failed for ${problemId}:`, err.message);
                      });
                    }
                  }
                );
              });
            }
          }
        );
      });

      setTimeout(() => {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`✅ EXCEL IMPORT COMPLETED`);
        console.log(`   Problems: ${Object.keys(problemsMap).length}`);
        console.log(`   Total Approaches: ${totalApproaches}`);
        console.log(`${'='.repeat(70)}\n`);

        resolve({
          total: data.length,
          imported: Object.keys(problemsMap).length,
          totalApproaches: totalApproaches,
          filename: path.basename(filePath),
        });
      }, 3000);
    } catch (error) {
      console.error('❌ Excel parsing error:', error);
      reject(error);
    }
  });
}

module.exports = {
  importExcelFile,
};