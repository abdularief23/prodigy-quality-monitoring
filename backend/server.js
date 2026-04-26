const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== AZURE CONFIG ====================
const AZURE_KEY = process.env.AZURE_API_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;

console.log('🔧 Configuration:');
console.log(`✓ Azure Key: ${AZURE_KEY ? 'Loaded' : '❌ Missing'}`);
console.log(`✓ Azure Endpoint: ${AZURE_ENDPOINT ? 'Loaded' : '❌ Missing'}`);

// ==================== DUMMY DATA ====================
const dummyProblems = [
  {
    id: 'PRB-001',
    description: 'Mesin CNC 5 tidak bisa start, error code E404 muncul terus di layar',
    location: 'Assembly Line A',
    equipment: 'CNC Machine 5',
    timestamp: '2026-04-25 08:30:00',
    status: 'Open',
    severity: 'High',
    image_url: 'https://via.placeholder.com/400x300?text=CNC+Machine+Error',
  },
  {
    id: 'PRB-002',
    description: 'Conveyor belt bergerak lambat, production rate turun 30 persen dari normal',
    location: 'Warehouse B',
    equipment: 'Conveyor System B',
    timestamp: '2026-04-25 09:15:00',
    status: 'In Progress',
    severity: 'Medium',
    image_url: 'https://via.placeholder.com/400x300?text=Conveyor+Belt',
  },
  {
    id: 'PRB-003',
    description: 'Quality issue terdeteksi di final inspection stage, reject rate naik signifikan',
    location: 'QC Area',
    equipment: 'Inspection Machine',
    timestamp: '2026-04-25 10:00:00',
    status: 'Analyzing',
    severity: 'High',
    image_url: 'https://via.placeholder.com/400x300?text=Quality+Check',
  },
  {
    id: 'PRB-004',
    description: 'Hydraulic pressure system drop yang tidak normal, perlu inspection',
    location: 'Production Floor C',
    equipment: 'Hydraulic Press Unit',
    timestamp: '2026-04-25 10:45:00',
    status: 'Open',
    severity: 'Critical',
    image_url: 'https://via.placeholder.com/400x300?text=Hydraulic+System',
  },
  {
    id: 'PRB-005',
    description: 'Motor bearing noise increase, vibration level exceed threshold',
    location: 'Assembly Line B',
    equipment: 'Drive Motor Unit',
    timestamp: '2026-04-25 11:20:00',
    status: 'Open',
    severity: 'Medium',
    image_url: 'https://via.placeholder.com/400x300?text=Motor+Unit',
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Analyze problem description menggunakan Azure
 */
async function analyzeProblemWithAzure(text) {
  try {
    console.log(`📊 Analyzing problem with Azure...`);

    const response = await axios.post(
      `${AZURE_ENDPOINT}text/analytics/v3.1/sentiment?model-version=latest`,
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
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const sentiment = response.data.documents[0];

    console.log(`✅ Azure analysis complete`);

    return {
      sentiment: sentiment.sentiment,
      confidence: Math.max(...Object.values(sentiment.confidenceScores)),
      scores: sentiment.confidenceScores,
    };
  } catch (error) {
    console.error(`⚠️ Azure error, using fallback: ${error.message}`);
    return generateFallbackAnalysis(text);
  }
}

/**
 * Fallback analysis (jika Azure fail)
 */
function generateFallbackAnalysis(text) {
  const textLower = text.toLowerCase();

  let sentiment = 'neutral';
  let confidence = 0.75;

  if (
    textLower.includes('rusak') ||
    textLower.includes('error') ||
    textLower.includes('tidak bisa') ||
    textLower.includes('problem')
  ) {
    sentiment = 'negative';
    confidence = 0.85;
  } else if (
    textLower.includes('baik') ||
    textLower.includes('normal') ||
    textLower.includes('lancar')
  ) {
    sentiment = 'positive';
    confidence = 0.72;
  }

  return {
    sentiment: sentiment,
    confidence: confidence,
    scores: {
      negative: sentiment === 'negative' ? confidence : 1 - confidence,
      neutral: 0.1,
      positive: sentiment === 'positive' ? confidence : 1 - confidence,
    },
    source: 'fallback',
  };
}

/**
 * Categorize problem berdasarkan keywords
 */
function categorizeProblem(description) {
  const descLower = description.toLowerCase();

  const keywords = {
    'Equipment Malfunction': [
      'tidak bisa',
      'error',
      'rusak',
      'break',
      'fail',
      'malfunction',
      'tidak bekerja',
      'berhenti',
    ],
    'Performance Degradation': [
      'lambat',
      'turun',
      'decrease',
      'slow',
      'drop',
      'menurun',
      'reduce',
    ],
    'Quality Issue': [
      'reject',
      'quality',
      'defect',
      'cacat',
      'tidak sesuai',
      'buruk',
      'issue',
    ],
    'Safety Concern': [
      'bahaya',
      'safety',
      'danger',
      'risk',
      'hazard',
    ],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => descLower.includes(word))) {
      return category;
    }
  }

  return 'Other';
}

/**
 * Generate suggested actions
 */
function getSuggestedActions(category) {
  const actions = {
    'Equipment Malfunction': [
      'Check power supply and connections',
      'Inspect error codes dan error logs',
      'Restart equipment jika diperlukan',
      'Contact maintenance team immediately',
    ],
    'Performance Degradation': [
      'Check lubrication dan fluid levels',
      'Inspect wear and tear components',
      'Verify operating parameters dan settings',
      'Schedule preventive maintenance',
    ],
    'Quality Issue': [
      'Inspect equipment calibration',
      'Review quality control procedures',
      'Check raw material specifications',
      'Run quality test dan verification',
    ],
    'Safety Concern': [
      'Stop operations immediately',
      'Evacuate affected area jika perlu',
      'Conduct safety inspection',
      'Report to safety officer',
    ],
    'Other': [
      'Investigate further details',
      'Collect more data dan information',
      'Consult with engineering team',
      'Document observations carefully',
    ],
  };

  return actions[category] || actions['Other'];
}

/**
 * Calculate severity
 */
function calculateSeverity(sentiment, description) {
  const descLower = description.toLowerCase();

  if (
    descLower.includes('critical') ||
    descLower.includes('urgent') ||
    descLower.includes('bahaya')
  ) {
    return 'Critical';
  }

  if (sentiment === 'negative') {
    if (
      descLower.includes('tidak bisa') ||
      descLower.includes('error') ||
      descLower.includes('rusak')
    ) {
      return 'High';
    }
    return 'Medium';
  } else if (sentiment === 'neutral') {
    return 'Medium';
  } else {
    return 'Low';
  }
}

// ==================== API ROUTES ====================

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Prodigy Backend is running',
  });
});

/**
 * GET /api/problems
 */
app.get('/api/problems', (req, res) => {
  try {
    console.log('📥 GET /api/problems');

    res.json({
      status: 'success',
      data: dummyProblems,
      total: dummyProblems.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /api/problems/:id
 */
app.get('/api/problems/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 GET /api/problems/${id}`);

    const problem = dummyProblems.find((p) => p.id === id);

    if (!problem) {
      return res.status(404).json({
        status: 'error',
        message: `Problem ${id} not found`,
      });
    }

    res.json({
      status: 'success',
      data: problem,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * POST /api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { description, problem_id } = req.body;

    if (!description) {
      return res.status(400).json({
        status: 'error',
        message: 'Description is required',
      });
    }

    console.log(`📥 POST /api/analyze - ${problem_id}`);

    // Call Azure
    const analysis = await analyzeProblemWithAzure(description);

    // Categorize
    const category = categorizeProblem(description);

    // Calculate severity
    const severity = calculateSeverity(analysis.sentiment, description);

    // Get actions
    const actions = getSuggestedActions(category);

    const result = {
      status: 'success',
      data: {
        problem_id,
        description: description.substring(0, 100) + '...',
        category,
        sentiment: analysis.sentiment,
        confidence: parseFloat((analysis.confidence * 100).toFixed(2)),
        severity,
        suggested_actions: actions,
        azure_used: !analysis.source,
        timestamp: new Date(),
      },
    };

    console.log(`✅ Analysis complete for ${problem_id}`);

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /api/insights
 */
app.get('/api/insights', (req, res) => {
  try {
    console.log('📥 GET /api/insights');

    const insights = {
      status: 'success',
      data: {
        total_problems: dummyProblems.length,
        by_severity: {
          Critical: dummyProblems.filter((p) => p.severity === 'Critical').length,
          High: dummyProblems.filter((p) => p.severity === 'High').length,
          Medium: dummyProblems.filter((p) => p.severity === 'Medium').length,
          Low: dummyProblems.filter((p) => p.severity === 'Low').length,
        },
        by_status: {
          Open: dummyProblems.filter((p) => p.status === 'Open').length,
          'In Progress': dummyProblems.filter((p) => p.status === 'In Progress')
            .length,
          'Analyzing': dummyProblems.filter((p) => p.status === 'Analyzing').length,
          Resolved: dummyProblems.filter((p) => p.status === 'Resolved').length,
        },
        resolution_rate: 0.65,
        avg_resolution_time: '4.5 hours',
        avg_response_time: '15 minutes',
      },
      timestamp: new Date(),
    };

    res.json(insights);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * POST /api/chat
 */
app.post('/api/chat', (req, res) => {
  try {
    const { message, problem_id } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required',
      });
    }

    console.log(`📥 POST /api/chat - ${problem_id}`);

    const problem = dummyProblems.find((p) => p.id === problem_id);

    let response = '';

    const msgLower = message.toLowerCase();

    if (
      msgLower.includes('apa') &&
      (msgLower.includes('masalah') || msgLower.includes('problem'))
    ) {
      response = `Based on analysis, ${problem?.description || 'the problem'} seems to be related to ${problem?.equipment || 'equipment'}. I recommend checking the equipment first.`;
    } else if (
      msgLower.includes('apa') &&
      (msgLower.includes('harus') || msgLower.includes('should'))
    ) {
      response = `You should: 1) Check power supply, 2) Inspect connections, 3) Review error logs, 4) Contact maintenance if needed.`;
    } else if (
      msgLower.includes('berapa') &&
      (msgLower.includes('lama') || msgLower.includes('waktu'))
    ) {
      response = `Based on historical data, similar issues typically take 4-6 hours to resolve. Your case might be faster if it's a simple fix.`;
    } else if (
      msgLower.includes('risiko') ||
      msgLower.includes('berbahaya') ||
      msgLower.includes('danger')
    ) {
      response = `This ${problem?.severity || 'issue'} severity problem could impact production. I recommend prioritizing it and involving maintenance team immediately.`;
    } else {
      response = `For problem ${problem?.id || 'this issue'}, the suggested actions are: Check the equipment status, review logs, verify all connections, and contact your maintenance team if needed. Is there anything specific you'd like to know?`;
    }

    const chatResponse = {
      status: 'success',
      data: {
        question: message,
        answer: response,
        problem_id,
        confidence: 0.82,
        timestamp: new Date(),
      },
    };

    console.log(`✅ Chat response sent`);

    res.json(chatResponse);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Prodigy Backend - Production Monitoring System');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⛅ Azure configured: ${AZURE_KEY ? '✓' : '❌'}`);
  console.log('='.repeat(50) + '\n');
});

module.exports = app;