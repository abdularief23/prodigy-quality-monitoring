const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prodigy.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // ==================== PROBLEMS TABLE ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      location TEXT,
      equipment TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Open',
      severity TEXT,
      image_url TEXT,
      source TEXT DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==================== APPROACHES TABLE (NEW) ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS approaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      approach_number INTEGER,
      engineer_name TEXT,
      step_sequence TEXT,
      approach_description TEXT,
      is_optimal INTEGER DEFAULT 0,
      optimization_score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id),
      UNIQUE(problem_id, approach_number)
    )
  `);

  // ==================== OPTIMAL STEPS TABLE (NEW) ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS optimal_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL UNIQUE,
      approach_number INTEGER,
      step_order INTEGER,
      step_name TEXT,
      step_description TEXT,
      step_type TEXT,
      step_risk TEXT,
      priority INTEGER,
      impact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    )
  `);

  // ==================== ANALYSIS TABLE ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      category TEXT,
      sentiment TEXT,
      confidence REAL,
      severity TEXT,
      rca_findings TEXT,
      ml_insights TEXT,
      azure_result TEXT,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    )
  `);

  // ==================== RCA TABLE ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS rca_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      approach_number INTEGER,
      root_causes TEXT,
      contributing_factors TEXT,
      corrective_actions TEXT,
      preventive_measures TEXT,
      rca_score REAL,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    )
  `);

  // ==================== WHY-WHY ANALYSIS TABLE ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS why_why_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      approach_number INTEGER,
      why_1 TEXT,
      why_2 TEXT,
      why_3 TEXT,
      why_4 TEXT,
      why_5 TEXT,
      root_cause TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    )
  `);

  // ==================== APPROACH SCORING TABLE (NEW) ====================
  db.run(`
    CREATE TABLE IF NOT EXISTS approach_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      approach_number INTEGER,
      safety_score REAL,
      efficiency_score REAL,
      time_score REAL,
      risk_score REAL,
      total_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id),
      UNIQUE(problem_id, approach_number)
    )
  `);

  console.log('✅ All database tables initialized');
}

module.exports = db;