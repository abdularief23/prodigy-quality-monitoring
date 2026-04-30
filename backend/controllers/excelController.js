const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const xlsx = require('xlsx');

function generateProblemId(index = 0) {
  const timestamp = Date.now();
  return `PRB-${timestamp}-${index + 1}`;
}

function buildProblemsMap(data) {
  const problemsMap = {};

  data.forEach((row, index) => {
    const rawId = row.problem_id || row.problem_code || row.id || '';
    const problemId = String(rawId).trim() || generateProblemId(index);
    const approachNumber = parseInt(row.approach_number, 10) || 1;

    if (!problemsMap[problemId]) {
      const name = row.problem_name || row.title || '';
      const description = row.problem_description || row.description || '';
      const symptoms = row.symptoms || '';
      const impact = row.impact || '';

      let fullDesc = description;
      if (name) fullDesc = `${name}: ${description}`;
      if (symptoms) fullDesc += ` | Symptoms: ${symptoms}`;
      if (impact) fullDesc += ` | Impact: ${impact}`;
      if (!fullDesc.trim()) fullDesc = `Imported problem ${problemId}`;

      problemsMap[problemId] = {
        id: problemId,
        description: fullDesc,
        location: row.location || 'Unknown',
        equipment: row.equipment || 'Unknown',
        severity: row.severity || 'Medium',
        status: row.status || 'Open',
        approaches: {},
      };
    }

    if (!problemsMap[problemId].approaches[approachNumber]) {
      const steps = [];
      for (let i = 1; i <= 10; i++) {
        const stepValue = row[`step_sequence${i}`] || row[`step_sequence_${i}`] || row[`step${i}`] || row[`step_${i}`];
        if (stepValue && String(stepValue).trim()) steps.push(String(stepValue).trim());
      }

      const typeByPosition = ['DIAGNOSE', 'ACTION', 'ACTION', 'ACTION', 'VERIFY', 'VERIFY'];
      const riskLevels = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'LOW', 'LOW'];
      const priorities = [1, 2, 2, 3, 4, 5];

      problemsMap[problemId].approaches[approachNumber] = {
        number: approachNumber,
        engineer_name: row.engineer_name || 'Unknown',
        steps: steps.map((name, idx) => ({
          name,
          order: idx + 1,
          type: typeByPosition[idx] || 'ACTION',
          risk: riskLevels[idx] || 'MEDIUM',
          priority: priorities[idx] || 3,
          impact: row.impact || 'Moderate',
        })),
      };
    }
  });

  return problemsMap;
}

function escapeCsv(value) {
  const str = String(value ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return `"${str}"`;
}

function scoreApproach(steps) {
  const highRisk = steps.filter((s) => s.risk === 'HIGH').length;
  const medRisk = steps.filter((s) => s.risk === 'MEDIUM').length;
  const safetyScore = Math.max(0, Math.min(10, 10 - highRisk * 2 - medRisk * 0.5));
  const efficiencyScore = Math.max(0, Math.min(10, (steps.length / 6) * 10));
  const avgPriority = steps.length ? steps.reduce((sum, s) => sum + (s.priority || 3), 0) / steps.length : 3;
  const timeScore = Math.max(0, Math.min(10, 10 - (avgPriority - 1) * 2));
  const criticalImpact = steps.filter((s) => (s.impact || '').toLowerCase().includes('tidak bisa') || (s.impact || '').toLowerCase().includes('terhenti')).length;
  const riskScore = Math.max(0, Math.min(10, 10 - criticalImpact * 1.5));
  const totalScore = Math.max(0, Math.min(10, (safetyScore + efficiencyScore + timeScore + riskScore) / 4));
  return { safetyScore, efficiencyScore, timeScore, riskScore, totalScore };
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
      const problemsMap = buildProblemsMap(data);
      const problems = Object.values(problemsMap);

      const approachRows = [];
      const scoreRows = [];
      const optimalStepRows = [];

      for (const problem of problems) {
        const approaches = Object.values(problem.approaches);
        let best = null;
        for (const approach of approaches) {
          const metrics = scoreApproach(approach.steps);
          scoreRows.push({ problemId: problem.id, approachNumber: approach.number, ...metrics });
          approachRows.push({
            problemId: problem.id,
            approachNumber: approach.number,
            engineerName: approach.engineer_name,
            stepSequence: approach.steps.map((s) => s.name).join(' | '),
            isOptimal: 0,
          });
          if (!best || metrics.totalScore > best.metrics.totalScore) {
            best = { approach, metrics };
          }
        }

        if (best) {
          const bestApproach = approachRows.find((a) => a.problemId === problem.id && a.approachNumber === best.approach.number);
          if (bestApproach) bestApproach.isOptimal = 1;
          best.approach.steps.slice(0, 6).forEach((step, idx) => {
            optimalStepRows.push({
              problemId: problem.id,
              stepOrder: idx + 1,
              stepName: step.name,
              stepDescription: `Step ${idx + 1}: ${step.name}`,
              stepType: step.type,
              stepRisk: step.risk,
              priority: step.priority,
              impact: step.impact,
            });
          });
        }
      }

      console.log(`📊 Total rows in Excel: ${data.length}`);
      console.log(`📄 Sheet name: ${sheetName}`);
      console.log(`🧩 Unique problems detected: ${problems.length}`);
      console.log(`🛠️ Approaches detected: ${approachRows.length}`);
      console.log(`🪜 Optimal steps to save: ${optimalStepRows.length}`);

      const baseDir = path.join(__dirname, '..');
      const dbFile = path.join(baseDir, 'prodigy.db');
      const tempDir = path.join(baseDir, 'tmp');
      const stamp = Date.now();
      fs.mkdirSync(tempDir, { recursive: true });

      const writeCsv = (name, header, rows) => {
        const file = path.join(tempDir, `${name}-${stamp}.csv`);
        const lines = [header, ...rows];
        fs.writeFileSync(file, lines.join('\n'));
        return file;
      };

      const problemsCsv = writeCsv('problems', 'id,description,location,equipment,severity,status,source', problems.map((p) => [escapeCsv(p.id), escapeCsv(p.description), escapeCsv(p.location), escapeCsv(p.equipment), escapeCsv(p.severity), escapeCsv(p.status), escapeCsv('excel')].join(',')));
      const approachesCsv = writeCsv('approaches', 'problem_id,approach_number,engineer_name,step_sequence,is_optimal', approachRows.map((a) => [escapeCsv(a.problemId), escapeCsv(a.approachNumber), escapeCsv(a.engineerName), escapeCsv(a.stepSequence), escapeCsv(a.isOptimal)].join(',')));
      const scoresCsv = writeCsv('scores', 'problem_id,approach_number,safety_score,efficiency_score,time_score,risk_score,total_score', scoreRows.map((s) => [escapeCsv(s.problemId), escapeCsv(s.approachNumber), escapeCsv(s.safetyScore), escapeCsv(s.efficiencyScore), escapeCsv(s.timeScore), escapeCsv(s.riskScore), escapeCsv(s.totalScore)].join(',')));
      const stepsCsv = writeCsv('steps', 'problem_id,step_order,step_name,step_description,step_type,step_risk,priority,impact', optimalStepRows.map((s) => [escapeCsv(s.problemId), escapeCsv(s.stepOrder), escapeCsv(s.stepName), escapeCsv(s.stepDescription), escapeCsv(s.stepType), escapeCsv(s.stepRisk), escapeCsv(s.priority), escapeCsv(s.impact)].join(',')));
      const sqlFile = path.join(tempDir, `import-${stamp}.sql`);

      const sql = `
PRAGMA foreign_keys = OFF;
DELETE FROM optimal_steps;
DELETE FROM approach_scores;
DELETE FROM approaches;
DELETE FROM problems;
DELETE FROM sqlite_sequence WHERE name IN ('approaches','optimal_steps','approach_scores');
DROP TABLE IF EXISTS import_problems;
DROP TABLE IF EXISTS import_approaches;
DROP TABLE IF EXISTS import_scores;
DROP TABLE IF EXISTS import_steps;
CREATE TABLE import_problems (id TEXT, description TEXT, location TEXT, equipment TEXT, severity TEXT, status TEXT, source TEXT);
CREATE TABLE import_approaches (problem_id TEXT, approach_number INTEGER, engineer_name TEXT, step_sequence TEXT, is_optimal INTEGER);
CREATE TABLE import_scores (problem_id TEXT, approach_number INTEGER, safety_score REAL, efficiency_score REAL, time_score REAL, risk_score REAL, total_score REAL);
CREATE TABLE import_steps (problem_id TEXT, step_order INTEGER, step_name TEXT, step_description TEXT, step_type TEXT, step_risk TEXT, priority INTEGER, impact TEXT);
.mode csv
.import '${problemsCsv}' import_problems
.import '${approachesCsv}' import_approaches
.import '${scoresCsv}' import_scores
.import '${stepsCsv}' import_steps
INSERT INTO problems (id, description, location, equipment, severity, status, source)
SELECT id, description, location, equipment, severity, status, source FROM import_problems WHERE id <> 'id';
INSERT INTO approaches (problem_id, approach_number, engineer_name, step_sequence, is_optimal)
SELECT problem_id, CAST(approach_number AS INTEGER), engineer_name, step_sequence, CAST(is_optimal AS INTEGER) FROM import_approaches WHERE problem_id <> 'problem_id';
INSERT INTO approach_scores (problem_id, approach_number, safety_score, efficiency_score, time_score, risk_score, total_score)
SELECT problem_id, CAST(approach_number AS INTEGER), CAST(safety_score AS REAL), CAST(efficiency_score AS REAL), CAST(time_score AS REAL), CAST(risk_score AS REAL), CAST(total_score AS REAL) FROM import_scores WHERE problem_id <> 'problem_id';
INSERT INTO optimal_steps (problem_id, step_order, step_name, step_description, step_type, step_risk, priority, impact)
SELECT problem_id, CAST(step_order AS INTEGER), step_name, step_description, step_type, step_risk, CAST(priority AS INTEGER), impact FROM import_steps WHERE problem_id <> 'problem_id';
DROP TABLE import_problems;
DROP TABLE import_approaches;
DROP TABLE import_scores;
DROP TABLE import_steps;
PRAGMA foreign_keys = ON;
`;
      fs.writeFileSync(sqlFile, sql);

      exec(`sqlite3 '${dbFile}' < '${sqlFile}'`, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
        for (const f of [problemsCsv, approachesCsv, scoresCsv, stepsCsv, sqlFile]) {
          try { fs.unlinkSync(f); } catch {}
        }
        if (err) {
          console.error('❌ SQLite CLI import failed:', err.message, stderr);
          return reject(new Error(stderr || err.message));
        }

        console.log(`✅ EXCEL IMPORT COMPLETED, saved ${problems.length} problems\n`);
        return resolve({
          total: data.length,
          imported: problems.length,
          totalApproaches: approachRows.length,
          filename: path.basename(filePath),
        });
      });
    } catch (error) {
      console.error('❌ Excel parsing error:', error);
      reject(error);
    }
  });
}

module.exports = {
  importExcelFile,
};
