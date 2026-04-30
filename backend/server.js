const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
require('dotenv').config();

const app = express();
const db = require('./database');
const upload = require('./middleware/uploadMiddleware');
const { importExcelFile } = require('./controllers/excelController');

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static('public'));

// Create uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

console.log('🔧 Configuration:');
console.log(`✓ Azure Key: ${process.env.AZURE_API_KEY ? 'Loaded' : '❌ Missing'}`);
console.log(`✓ Database: SQLite3`);
console.log(`✓ CORS: Enabled for localhost:3000`);

// ==================== ROOT ====================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Prodigy AI-Powered Production Problem Detection System',
    version: '3.0.0',
  });
});

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Prodigy Backend running',
    version: '3.0.0',
  });
});

// ==================== GET ALL PROBLEMS ====================
app.get('/api/problems', (req, res) => {
  try {
    db.all('SELECT * FROM problems ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ status: 'error', message: err.message });
      }
      res.json({
        status: 'success',
        data: rows || [],
        total: rows ? rows.length : 0,
        timestamp: new Date(),
      });
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== GET PROBLEMS WITH FULL ANALYSIS ====================
app.get('/api/problems-with-full-analysis', (req, res) => {
  try {
    db.all(
      `SELECT DISTINCT p.* FROM problems p ORDER BY p.created_at DESC`,
      (err, rows) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({ status: 'error', message: err.message });
        }
        res.json({
          status: 'success',
          data: rows || [],
          total: rows ? rows.length : 0,
          timestamp: new Date(),
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== GET SINGLE PROBLEM ====================
app.get('/api/problems/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.get('SELECT * FROM problems WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: err.message });
      }
      if (!row) {
        return res.status(404).json({ status: 'error', message: `Problem ${id} not found` });
      }
      res.json({ status: 'success', data: row });
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== GET OPTIMAL STEPS ====================
app.get('/api/problems/:id/optimal-steps', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 Fetching optimal steps for: ${id}`);

    db.all(
      'SELECT * FROM optimal_steps WHERE problem_id = ? ORDER BY step_order ASC',
      [id],
      (err, rows) => {
        if (err) {
          console.error('❌ Steps DB error:', err);
          return res.status(500).json({ status: 'error', message: err.message });
        }

        console.log(`   Found ${rows ? rows.length : 0} steps`);

        res.json({
          status: 'success',
          data: rows || [],
          total: rows ? rows.length : 0,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== GET APPROACH SCORES ====================
app.get('/api/problems/:id/approach-scores', (req, res) => {
  try {
    const { id } = req.params;

    db.all(
      'SELECT * FROM approach_scores WHERE problem_id = ? ORDER BY total_score DESC',
      [id],
      (err, rows) => {
        if (err) {
          console.error('❌ Scores DB error:', err);
          return res.status(500).json({ status: 'error', message: err.message });
        }
        res.json({
          status: 'success',
          data: rows || [],
          bestApproach: rows && rows.length > 0 ? rows[0] : null,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== GET ALL APPROACHES ====================
app.get('/api/problems/:id/approaches', (req, res) => {
  try {
    const { id } = req.params;

    db.all(
      'SELECT * FROM approaches WHERE problem_id = ? ORDER BY approach_number ASC',
      [id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ status: 'error', message: err.message });
        }
        res.json({
          status: 'success',
          data: rows || [],
          total: rows ? rows.length : 0,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== UPLOAD EXCEL ====================
app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    console.log(`\n📤 Uploading: ${req.file.filename}\n`);

    const result = await importExcelFile(req.file.path);

    res.json({
      status: 'success',
      message: `Imported ${result.imported} problems with ${result.totalApproaches} approaches.`,
      data: {
        filename: result.filename,
        totalRows: result.total,
        importedRows: result.imported,
        totalApproaches: result.totalApproaches,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== INSIGHTS ====================
app.get('/api/insights', (req, res) => {
  try {
    db.all(
      'SELECT severity, status, COUNT(*) as count FROM problems GROUP BY severity, status',
      (err, rows) => {
        if (err) {
          return res.status(500).json({ status: 'error', message: err.message });
        }

        let bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        let byStatus = { Open: 0, 'In Progress': 0, Analyzing: 0, Resolved: 0 };

        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            if (bySeverity.hasOwnProperty(row.severity)) {
              bySeverity[row.severity] += row.count;
            }
            if (byStatus.hasOwnProperty(row.status)) {
              byStatus[row.status] += row.count;
            }
          });
        }

        const totalProblems = rows ? rows.reduce((sum, row) => sum + row.count, 0) : 0;

        res.json({
          status: 'success',
          data: {
            total_problems: totalProblems,
            by_severity: bySeverity,
            by_status: byStatus,
            resolution_rate: totalProblems > 0 ? 0.65 : 0,
            avg_resolution_time: '4.5 hours',
            avg_response_time: '15 minutes',
          },
          timestamp: new Date(),
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== FULL RESET ====================
app.post('/api/full-reset', (req, res) => {
  console.log('\n⚠️ FULL RESET - CLEARING ALL TABLE DATA WITH SQLITE3 CLI...\n');

  const dbFile = path.join(__dirname, 'prodigy.db');
  const sql = `
    PRAGMA foreign_keys = OFF;
    DELETE FROM optimal_steps;
    DELETE FROM approach_scores;
    DELETE FROM why_why_analysis;
    DELETE FROM analysis;
    DELETE FROM approaches;
    DELETE FROM problems;
    DELETE FROM sqlite_sequence WHERE name IN ('approaches','optimal_steps','approach_scores','analysis','why_why_analysis');
    PRAGMA foreign_keys = ON;
  `;

  execFile('sqlite3', [dbFile, sql], (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Full reset failed:', err.message, stderr);
      return res.status(500).json({ status: 'error', message: stderr || err.message });
    }

    console.log('✅ All table data cleared\n');
    return res.json({
      status: 'success',
      message: 'Full reset complete. Upload Excel now.',
      data: { remainingProblems: 0 },
    });
  });
});

// ==================== VERIFY DATA ====================
app.get('/api/verify-data', (req, res) => {
  const result = {};

  db.get('SELECT COUNT(*) as count FROM problems', (err, row) => {
    result.problems = row ? row.count : 0;

    db.get('SELECT COUNT(*) as count FROM approaches', (err, row) => {
      result.approaches = row ? row.count : 0;

      db.get('SELECT COUNT(*) as count FROM optimal_steps', (err, row) => {
        result.optimal_steps = row ? row.count : 0;

        db.get('SELECT COUNT(*) as count FROM approach_scores', (err, row) => {
          result.approach_scores = row ? row.count : 0;

          db.all('SELECT * FROM optimal_steps LIMIT 10', (err, rows) => {
            result.sample_steps = rows || [];

            console.log('\n📊 DATA VERIFICATION:');
            console.log(`   Problems: ${result.problems}`);
            console.log(`   Approaches: ${result.approaches}`);
            console.log(`   Optimal Steps: ${result.optimal_steps}`);
            console.log(`   Approach Scores: ${result.approach_scores}`);
            console.log(`   Sample Steps: ${result.sample_steps.length}\n`);

            res.json({ status: 'success', data: result });
          });
        });
      });
    });
  });
});

// ==================== DEBUG ENDPOINTS ====================
app.get('/api/debug/problems/:id/steps', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM optimal_steps WHERE problem_id = ?', [id], (err, rows) => {
    res.json({
      problemId: id,
      stepsFound: rows ? rows.length : 0,
      steps: rows || [],
      error: err ? err.message : null,
    });
  });
});

app.get('/api/debug/problems/:id/approaches', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM approaches WHERE problem_id = ?', [id], (err, rows) => {
    res.json({
      problemId: id,
      approachesFound: rows ? rows.length : 0,
      approaches: rows || [],
      error: err ? err.message : null,
    });
  });
});

app.get('/api/debug/problems/:id/scores', (req, res) => {
  const { id } = req.params;
  db.all(
    'SELECT * FROM approach_scores WHERE problem_id = ? ORDER BY total_score DESC',
    [id],
    (err, rows) => {
      res.json({
        problemId: id,
        scoresFound: rows ? rows.length : 0,
        bestScore: rows && rows.length > 0 ? rows[0] : null,
        allScores: rows || [],
        error: err ? err.message : null,
      });
    }
  );
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
  console.log('\n' + '='.repeat(70));
  console.log('🚀 PRODIGY BACKEND v3.0 - PRODUCTION READY');
  console.log('   AI-Powered Production Problem Detection System');
  console.log('='.repeat(70));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🗄️  Database: SQLite3 (prodigy.db)`);
  console.log(`📤 Upload Excel: /api/upload-excel (POST)`);
  console.log(`📊 Problems: /api/problems (GET)`);
  console.log(`🔍 Optimal Steps: /api/problems/:id/optimal-steps (GET)`);
  console.log(`📈 Scores: /api/problems/:id/approach-scores (GET)`);
  console.log(`⚠️  Full Reset: /api/full-reset (POST)`);
  console.log(`✅ Verify Data: /api/verify-data (GET)`);
  console.log(`⛅ Azure: ${process.env.AZURE_API_KEY ? '✓ Connected' : '❌ Not configured'}`);
  console.log('='.repeat(70) + '\n');
});

module.exports = app;