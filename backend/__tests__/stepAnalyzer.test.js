const { analyzeSteps } = require('../controllers/stepAnalyzer');

describe('analyzeSteps', () => {
  test('returns empty array for null input', () => {
    expect(analyzeSteps(null)).toEqual([]);
  });

  test('returns empty array for undefined input', () => {
    expect(analyzeSteps(undefined)).toEqual([]);
  });

  test('parses single step correctly', () => {
    const result = analyzeSteps('cek kondisi mesin');
    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(1);
    expect(result[0].name).toBe('Step A');
    expect(result[0].type).toBe('DIAGNOSE');
    expect(result[0].risk).toBe('LOW');
  });

  test('parses multiple steps separated by pipe', () => {
    const result = analyzeSteps('cek kondisi | ganti komponen | test hasil');
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('DIAGNOSE');
    expect(result[1].type).toBe('ACTION');
    expect(result[2].type).toBe('VERIFY');
  });

  test('assigns correct step names A, B, C', () => {
    const result = analyzeSteps('cek A | cek B | cek C');
    expect(result[0].name).toBe('Step A');
    expect(result[1].name).toBe('Step B');
    expect(result[2].name).toBe('Step C');
  });

  test('ACTION type has HIGH risk', () => {
    const result = analyzeSteps('ganti komponen rusak');
    expect(result[0].type).toBe('ACTION');
    expect(result[0].risk).toBe('HIGH');
    expect(result[0].impact).toBe('Critical');
  });

  test('DIAGNOSE type has LOW risk', () => {
    const result = analyzeSteps('periksa sistem');
    expect(result[0].type).toBe('DIAGNOSE');
    expect(result[0].risk).toBe('LOW');
  });

  test('VERIFY type has LOW risk', () => {
    const result = analyzeSteps('test sistem berjalan');
    expect(result[0].type).toBe('VERIFY');
    expect(result[0].risk).toBe('LOW');
  });

  test('unknown step defaults to VERIFY type', () => {
    const result = analyzeSteps('lakukan sesuatu');
    expect(result[0].type).toBe('VERIFY');
  });

  test('priority is between 1 and 5', () => {
    const result = analyzeSteps('step1 | step2 | step3 | step4 | step5 | step6');
    result.forEach((step) => {
      expect(step.priority).toBeGreaterThanOrEqual(1);
      expect(step.priority).toBeLessThanOrEqual(5);
    });
  });

  test('step order is sequential starting from 1', () => {
    const result = analyzeSteps('cek | ganti | test');
    expect(result.map((s) => s.order)).toEqual([1, 2, 3]);
  });

  test('handles english keywords', () => {
    const result = analyzeSteps('check system | replace part | verify output');
    expect(result[0].type).toBe('DIAGNOSE');
    expect(result[1].type).toBe('ACTION');
    expect(result[2].type).toBe('VERIFY');
  });
});
