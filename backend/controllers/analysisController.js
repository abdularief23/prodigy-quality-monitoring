const axios = require('axios');
const db = require('../database');

async function analyzeWithAzure(text) {
  try {
    const response = await axios.post(
      `${process.env.AZURE_ENDPOINT}text/analytics/v3.1/sentiment?model-version=latest`,
      {
        documents: [
          {
            id: '1',
            language: 'id',
            text: text,
          },
        ],
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      sentiment: response.data.documents[0].sentiment,
      confidence: Math.max(
        ...Object.values(response.data.documents[0].confidenceScores)
      ),
      scores: response.data.documents[0].confidenceScores,
      source: 'azure',
    };
  } catch (error) {
    console.warn('⚠️ Azure error, using fallback');
    return generateFallbackAnalysis(text);
  }
}

function generateFallbackAnalysis(text) {
  const textLower = text.toLowerCase();
  let sentiment = 'neutral';
  let confidence = 0.75;

  if (
    textLower.match(/rusak|error|tidak bisa|problem|gagal|NG|scratch|corrupt/)
  ) {
    sentiment = 'negative';
    confidence = 0.85;
  } else if (textLower.match(/baik|normal|lancar|bagus|OK/)) {
    sentiment = 'positive';
    confidence = 0.72;
  }

  return {
    sentiment,
    confidence,
    scores: {
      negative: sentiment === 'negative' ? confidence : 1 - confidence,
      neutral: 0.1,
      positive: sentiment === 'positive' ? confidence : 1 - confidence,
    },
    source: 'fallback',
  };
}

// ==================== STEP 1: AZURE ANALYSIS ====================
async function step1_AzureAnalysis(description) {
  console.log('📊 STEP 1: Azure Sentiment Analysis');
  const azureResult = await analyzeWithAzure(description);
  console.log(`   ✅ Sentiment: ${azureResult.sentiment} (${(azureResult.confidence * 100).toFixed(0)}%)`);
  return azureResult;
}

// ==================== STEP 2: RCA ANALYSIS ====================
function step2_RCAAnalysis(description) {
  console.log('🔍 STEP 2: Root Cause Analysis');
  
  const descLower = description.toLowerCase();
  
  let rootCauses = [];
  let contributingFactors = [];
  let rcaScore = 0.5;

  // Pattern matching untuk mendeteksi tipe problem
  if (descLower.match(/scratch|defect|damage|rusak|error|tidak bisa/)) {
    rootCauses = [
      'Equipment component failure atau damage',
      'Wear and tear dari penggunaan berkelanjutan',
      'Maintenance tidak terpenuhi dengan baik'
    ];
    contributingFactors = [
      'Lack of preventive maintenance schedule',
      'Component age dan lifecycle management',
      'Operator handling atau error'
    ];
    rcaScore = 0.85;
  } else if (descLower.match(/lambat|slow|performance|degrade|turun/)) {
    rootCauses = [
      'Performance degradation dari equipment',
      'Lubrication atau fluid levels tidak optimal',
      'Operating parameters drift dari ideal'
    ];
    contributingFactors = [
      'Inadequate lubrication schedule',
      'Misalignment atau calibration issue',
      'Load exceeding capacity'
    ];
    rcaScore = 0.75;
  } else if (descLower.match(/ng|reject|quality|defect|cacat|tidak sesuai/)) {
    rootCauses = [
      'Quality control process failure',
      'Raw material specification tidak terpenuhi',
      'Process deviation dari standard'
    ];
    contributingFactors = [
      'Insufficient inspection procedures',
      'Poor material sourcing atau supplier',
      'Process variation dan inconsistency'
    ];
    rcaScore = 0.8;
  } else {
    rootCauses = [
      'Unidentified root cause - requires deeper investigation',
      'Multiple potential factors contributing',
      'Need more data untuk root cause confirmation'
    ];
    contributingFactors = [
      'Insufficient information provided',
      'Need equipment logs dan historical data',
      'Operator input sangat penting'
    ];
    rcaScore = 0.5;
  }

  console.log(`   ✅ Root Causes identified: ${rootCauses.length}`);
  console.log(`   ✅ RCA Score: ${rcaScore.toFixed(2)}`);

  return {
    rootCauses,
    contributingFactors,
    rcaScore,
  };
}

// ==================== STEP 3: ML PATTERN DETECTION ====================
function step3_MLPatternDetection(description, azureResult) {
  console.log('🤖 STEP 3: ML Pattern Detection');

  const descLower = description.toLowerCase();
  let category = 'Other';
  let patternDetected = 'Unknown pattern';
  let estimatedResolutionTime = '4-6 hours';
  let anomalyScore = 0.5;

  if (
    descLower.match(
      /mesin|equipment|motor|hydraulic|bearing|drive|press|conveyor|sensor|aces/i
    )
  ) {
    category = 'Equipment Malfunction';
    patternDetected = 'Mechanical/Electronic failure pattern detected';
    estimatedResolutionTime = '2-4 hours';
    anomalyScore = 0.85;
  } else if (descLower.match(/lambat|turun|drop|performance|degradation|slow/i)) {
    category = 'Performance Degradation';
    patternDetected = 'Gradual performance decline pattern';
    estimatedResolutionTime = '1-3 hours';
    anomalyScore = 0.65;
  } else if (descLower.match(/reject|quality|defect|cacat|tidak sesuai|ng/i)) {
    category = 'Quality Issue';
    patternDetected = 'Quality control deviation pattern';
    estimatedResolutionTime = '3-5 hours';
    anomalyScore = 0.75;
  } else if (descLower.match(/bahaya|safety|danger|risk|hazard/i)) {
    category = 'Safety Concern';
    patternDetected = 'Potential safety hazard pattern';
    estimatedResolutionTime = 'Immediate - 1 hour';
    anomalyScore = 0.95;
  }

  console.log(`   ✅ Category: ${category}`);
  console.log(`   ✅ Pattern: ${patternDetected}`);
  console.log(`   ✅ Anomaly Score: ${anomalyScore.toFixed(2)}`);

  return {
    category,
    patternDetected,
    estimatedResolutionTime,
    anomalyScore,
    mlConfidence: parseFloat((azureResult.confidence * 100).toFixed(2)),
  };
}

// ==================== STEP 4: AUTO-GENERATE WHY-WHY (5 WHY) ====================
function step4_WhyWhyAnalysis(description, rootCauses, category) {
  console.log('🔄 STEP 4: Why-Why Analysis (5 Why Framework)');

  const descLower = description.toLowerCase();
  
  let why = {
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
  };

  if (category === 'Equipment Malfunction') {
    why = {
      why1: 'Equipment menunjukkan tanda malfunction atau failure?',
      why2: 'Apakah ada damage pada komponen internal?',
      why3: 'Apakah maintenance schedule tidak diikuti?',
      why4: 'Apakah spare parts berkualitas atau asli?',
      why5: 'Apakah operator terlatih dengan baik untuk operasi equipment ini?',
    };
  } else if (category === 'Performance Degradation') {
    why = {
      why1: 'Apakah performance degradation terjadi secara gradual?',
      why2: 'Apakah ada issue dengan lubrication atau fluid levels?',
      why3: 'Apakah equipment mengalami wear and tear?',
      why4: 'Apakah ada alignment atau calibration problems?',
      why5: 'Apakah load pada equipment melebihi kapasitas design?',
    };
  } else if (category === 'Quality Issue') {
    why = {
      why1: 'Apakah quality control process berjalan dengan baik?',
      why2: 'Apakah raw material sesuai specification?',
      why3: 'Apakah ada deviation dari standard process?',
      why4: 'Apakah inspection equipment terkalibrasi dengan benar?',
      why5: 'Apakah operator mengikuti SOP dengan ketat?',
    };
  } else {
    why = {
      why1: 'Apa yang exactly terjadi dengan equipment/process?',
      why2: 'Kapan pertama kali issue ini terdeteksi?',
      why3: 'Apakah ada pattern atau trigger khusus?',
      why4: 'Apa yang sudah dicoba untuk perbaikan?',
      why5: 'Apa informasi tambahan yang diperlukan?',
    };
  }

  console.log('   ✅ Why-Why analysis generated');

  return why;
}

// ==================== STEP 5: AUTO-GENERATE RECOMMENDATIONS ====================
function step5_GenerateRecommendations(category, rootCauses) {
  console.log('✅ STEP 5: Generate Recommendations');

  const recommendations = {
    correctiveAction: '',
    preventiveAction: '',
  };

  if (category === 'Equipment Malfunction') {
    recommendations.correctiveAction =
      '1) Stop equipment immediately\n' +
      '2) Inspect all connectors dan power supply\n' +
      '3) Check error codes dan diagnostic logs\n' +
      '4) Replace faulty components if identified\n' +
      '5) Perform full equipment test sebelum restart';

    recommendations.preventiveAction =
      '1) Establish regular maintenance schedule (weekly/monthly)\n' +
      '2) Implement condition monitoring system\n' +
      '3) Keep spare parts inventory updated\n' +
      '4) Provide operator training program\n' +
      '5) Document semua maintenance activities';
  } else if (category === 'Performance Degradation') {
    recommendations.correctiveAction =
      '1) Check dan top-up lubricants immediately\n' +
      '2) Inspect equipment alignment dan balance\n' +
      '3) Verify semua operating parameters\n' +
      '4) Clean atau replace air filters if applicable\n' +
      '5) Monitor performance recovery';

    recommendations.preventiveAction =
      '1) Create lubrication schedule based on manual\n' +
      '2) Regular alignment checks (monthly)\n' +
      '3) Parameter monitoring dashboard\n' +
      '4) Predictive maintenance using vibration analysis\n' +
      '5) Train operators untuk early warning signs';
  } else if (category === 'Quality Issue') {
    recommendations.correctiveAction =
      '1) Stop production immediately\n' +
      '2) Quarantine affected products\n' +
      '3) Conduct root cause analysis\n' +
      '4) Recalibrate inspection equipment\n' +
      '5) Resume dengan enhanced QC checks';

    recommendations.preventiveAction =
      '1) Implement Statistical Process Control (SPC)\n' +
      '2) Supplier quality audit dan certification\n' +
      '3) Enhanced inspection procedures\n' +
      '4) Operator training dan certification\n' +
      '5) Regular equipment calibration schedule';
  } else {
    recommendations.correctiveAction =
      '1) Gather more detailed information\n' +
      '2) Conduct thorough investigation\n' +
      '3) Involve technical experts\n' +
      '4) Test potential solutions\n' +
      '5) Document findings';

    recommendations.preventiveAction =
      '1) Monitor equipment closely\n' +
      '2) Increase inspection frequency\n' +
      '3) Prepare contingency plan\n' +
      '4) Enhance training program\n' +
      '5) Regular review meetings';
  }

  console.log('   ✅ Recommendations generated');

  return recommendations;
}

// ==================== FULL ANALYSIS PIPELINE ====================
async function fullAnalysis(problemId, description) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔍 FULL ANALYSIS PIPELINE: ${problemId}`);
      console.log(`${'='.repeat(70)}`);

      // STEP 1: Azure Analysis
      const azureAnalysis = await step1_AzureAnalysis(description);

      // STEP 2: RCA Analysis
      const rcaAnalysis = step2_RCAAnalysis(description);

      // STEP 3: ML Pattern Detection
      const mlAnalysis = step3_MLPatternDetection(description, azureAnalysis);

      // STEP 4: Why-Why Analysis
      const whyWhyAnalysis = step4_WhyWhyAnalysis(
        description,
        rcaAnalysis.rootCauses,
        mlAnalysis.category
      );

      // STEP 5: Generate Recommendations
      const recommendations = step5_GenerateRecommendations(
        mlAnalysis.category,
        rcaAnalysis.rootCauses
      );

      // ==================== SAVE TO DATABASE ====================
      console.log('\n💾 Saving analysis results to database...');

      db.run(
        `INSERT INTO analysis 
         (problem_id, category, sentiment, confidence, rca_findings, ml_insights, azure_result)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          problemId,
          mlAnalysis.category,
          azureAnalysis.sentiment,
          azureAnalysis.confidence,
          JSON.stringify(rcaAnalysis),
          JSON.stringify(mlAnalysis),
          JSON.stringify(azureAnalysis),
        ],
        (err) => {
          if (err) console.error('❌ Error saving analysis:', err);
          else console.log(`✅ Analysis saved for ${problemId}`);
        }
      );

      db.run(
        `INSERT INTO rca_analysis 
         (problem_id, root_causes, contributing_factors, corrective_actions, preventive_measures, rca_score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          problemId,
          rcaAnalysis.rootCauses.join(' | '),
          rcaAnalysis.contributingFactors.join(' | '),
          recommendations.correctiveAction,
          recommendations.preventiveAction,
          rcaAnalysis.rcaScore,
        ],
        (err) => {
          if (err) console.error('❌ Error saving RCA:', err);
          else console.log(`✅ RCA saved for ${problemId}`);
        }
      );

      db.run(
        `INSERT INTO why_why_analysis 
         (problem_id, why_1, why_2, why_3, why_4, why_5, root_cause, corrective_action, preventive_action, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
        [
          problemId,
          whyWhyAnalysis.why1,
          whyWhyAnalysis.why2,
          whyWhyAnalysis.why3,
          whyWhyAnalysis.why4,
          whyWhyAnalysis.why5,
          rcaAnalysis.rootCauses[0] || 'Root cause pending investigation',
          recommendations.correctiveAction,
          recommendations.preventiveAction,
        ],
        (err) => {
          if (err) console.error('❌ Error saving Why-Why:', err);
          else console.log(`✅ Why-Why saved for ${problemId}`);
        }
      );

      console.log(`${'='.repeat(70)}\n`);

      resolve({
        problemId,
        step1_azure: azureAnalysis,
        step2_rca: rcaAnalysis,
        step3_ml: mlAnalysis,
        step4_whywhy: whyWhyAnalysis,
        step5_recommendations: recommendations,
      });
    } catch (error) {
      console.error('❌ Analysis error:', error);
      reject(error);
    }
  });
}

module.exports = {
  fullAnalysis,
  analyzeWithAzure,
};