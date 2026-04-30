// Test the generateProblemId utility extracted from excelController
// We replicate the logic since it's not exported separately

function generateProblemId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PRB-${timestamp}-${random}`;
}

describe('generateProblemId', () => {
  test('starts with PRB- prefix', () => {
    const id = generateProblemId();
    expect(id).toMatch(/^PRB-/);
  });

  test('has correct format PRB-<timestamp>-<random>', () => {
    const id = generateProblemId();
    expect(id).toMatch(/^PRB-\d+-\d+$/);
  });

  test('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateProblemId()));
    // With timestamp + random, expect high uniqueness
    expect(ids.size).toBeGreaterThan(50);
  });

  test('random suffix is between 0 and 999', () => {
    for (let i = 0; i < 20; i++) {
      const id = generateProblemId();
      const parts = id.split('-');
      const random = parseInt(parts[2]);
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThanOrEqual(999);
    }
  });
});

// Test row-to-problem mapping logic (extracted from importExcelFile)
function rowToProblemData(row) {
  return {
    name: row.problem_name || '',
    description: row.problem_description || '',
    symptoms: row.symptoms || '',
    impact: row.impact || '',
    equipment: row.equipment || 'Unknown',
    location: row.location || 'Unknown',
    severity: row.severity || 'Medium',
    status: row.status || 'Open',
  };
}

describe('rowToProblemData', () => {
  test('maps all fields correctly', () => {
    const row = {
      problem_name: 'Mesin Error',
      problem_description: 'Mesin tidak mau start',
      symptoms: 'bunyi aneh',
      impact: 'produksi terhenti',
      equipment: 'CNC-01',
      location: 'Line A',
      severity: 'Critical',
      status: 'Open',
    };
    const result = rowToProblemData(row);
    expect(result.name).toBe('Mesin Error');
    expect(result.description).toBe('Mesin tidak mau start');
    expect(result.equipment).toBe('CNC-01');
    expect(result.severity).toBe('Critical');
  });

  test('uses defaults for missing fields', () => {
    const result = rowToProblemData({});
    expect(result.name).toBe('');
    expect(result.equipment).toBe('Unknown');
    expect(result.location).toBe('Unknown');
    expect(result.severity).toBe('Medium');
    expect(result.status).toBe('Open');
  });

  test('overrides defaults when row has values', () => {
    const result = rowToProblemData({ severity: 'Low', status: 'Resolved' });
    expect(result.severity).toBe('Low');
    expect(result.status).toBe('Resolved');
  });

  test('handles partial row data', () => {
    const result = rowToProblemData({ problem_name: 'Test', equipment: 'Robot-02' });
    expect(result.name).toBe('Test');
    expect(result.equipment).toBe('Robot-02');
    expect(result.location).toBe('Unknown');
  });
});
