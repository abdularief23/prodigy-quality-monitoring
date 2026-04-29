const db = require('../database');

/**
 * Perform Root Cause Analysis (RCA)
 */
async function performRCA(problemId, description) {
  return new Promise((resolve, reject) => {
    try {
      const descLower = description.toLowerCase();

      // ==================== ROOT CAUSES ====================
      const rootCauses = [];
      const contributingFactors = [];
      const correctiveActions = [];
      const preventiveMeasures = [];
      let rcaScore = 0.5;

      // Equipment Malfunction
      if (
        descLower.includes('error') ||
        descLower.includes('tidak bisa') ||
        descLower.includes('rusak')
      ) {
        rootCauses.push('Equipment malfunction or failure');
        rootCauses.push('Power supply issue');
        rootCauses.push('Internal component failure');

        contributingFactors.push('Lack of maintenance');
        contributingFactors.push('Component wear and tear');
        contributingFactors.push('Poor operating conditions');

        correctiveActions.push('Repair/Replace faulty components');
        correctiveActions.push('Verify power supply');
        correctiveActions.push('Test equipment functionality');

        preventiveMeasures.push('Regular maintenance schedule');
        preventiveMeasures.push('Condition monitoring');
        preventiveMeasures.push('Spare parts inventory');

        rcaScore = 0.85;
      }

      // Performance Degradation
      if (
        descLower.includes('lambat') ||
        descLower.includes('turun') ||
        descLower.includes('drop')
      ) {
        rootCauses.push('Performance degradation');
        rootCauses.push('Lubrication issues');
        rootCauses.push('Operating parameter drift');

        contributingFactors.push('Inadequate lubrication');
        contributingFactors.push('Misalignment');
        contributingFactors.push('Load exceeding capacity');

        correctiveActions.push('Check and top-up lubricants');
        correctiveActions.push('Inspect alignment and balance');
        correctiveActions.push('Verify operating parameters');

        preventiveMeasures.push('Lubrication schedule');
        preventiveMeasures.push('Regular alignment checks');
        preventiveMeasures.push('Parameter monitoring');

        rcaScore = 0.75;
      }

      // Quality Issue
      if (
        descLower.includes('reject') ||
        descLower.includes('quality') ||
        descLower.includes('defect')
      ) {
        rootCauses.push('Quality control failure');
        rootCauses.push('Raw material issue');
        rootCauses.push('Process deviation');

        contributingFactors.push('Insufficient inspection');
        contributingFactors.push('Poor material sourcing');
        contributingFactors.push('Process variation');

        correctiveActions.push('Enhanced inspection procedures');
        correctiveActions.push('Material supplier review');
        correctiveActions.push('Process standardization');

        preventiveMeasures.push('Statistical process control');
        preventiveMeasures.push('Supplier qualification');
        preventiveMeasures.push('Operator training');

        rcaScore = 0.8;
      }

      const rcaData = {
        problemId,
        rootCauses: rootCauses.join(' | '),
        contributingFactors: contributingFactors.join(' | '),
        correctiveActions: correctiveActions.join(' | '),
        preventiveMeasures: preventiveMeasures.join(' | '),
        rcaScore,
      };

      // Save to database
      db.run(
        `INSERT INTO rca_analysis 
         (problem_id, root_causes, contributing_factors, corrective_actions, preventive_measures, rca_score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          rcaData.problemId,
          rcaData.rootCauses,
          rcaData.contributingFactors,
          rcaData.correctiveActions,
          rcaData.preventiveMeasures,
          rcaData.rcaScore,
        ],
        (err) => {
          if (err) reject(err);
          else resolve(rcaData);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  performRCA,
};