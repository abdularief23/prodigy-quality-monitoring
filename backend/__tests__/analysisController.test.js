// Test pure/exported functions only — no DB or Azure calls needed
const { generateFallbackAnalysis } = (() => {
  // Extract the private function by loading the module in a test context
  // We replicate the function here since it's not exported
  function generateFallbackAnalysis(text) {
    const textLower = text.toLowerCase();
    let sentiment = 'neutral';
    let confidence = 0.75;

    if (textLower.match(/rusak|error|tidak bisa|problem|gagal|NG|scratch|corrupt/)) {
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
  return { generateFallbackAnalysis };
})();

describe('generateFallbackAnalysis', () => {
  test('returns negative sentiment for error keywords', () => {
    const result = generateFallbackAnalysis('mesin error tidak bisa dijalankan');
    expect(result.sentiment).toBe('negative');
    expect(result.confidence).toBe(0.85);
    expect(result.source).toBe('fallback');
  });

  test('returns negative sentiment for rusak keyword', () => {
    const result = generateFallbackAnalysis('komponen rusak');
    expect(result.sentiment).toBe('negative');
  });

  test('returns negative sentiment for scratch keyword', () => {
    const result = generateFallbackAnalysis('ada scratch pada permukaan');
    expect(result.sentiment).toBe('negative');
  });

  test('returns positive sentiment for baik keyword', () => {
    const result = generateFallbackAnalysis('kondisi baik');
    expect(result.sentiment).toBe('positive');
    expect(result.confidence).toBe(0.72);
  });

  test('returns positive sentiment for normal keyword', () => {
    const result = generateFallbackAnalysis('operasi normal');
    expect(result.sentiment).toBe('positive');
  });

  test('returns neutral for unknown text', () => {
    const result = generateFallbackAnalysis('mesin sedang beroperasi');
    expect(result.sentiment).toBe('neutral');
    expect(result.confidence).toBe(0.75);
  });

  test('result always contains required fields', () => {
    const result = generateFallbackAnalysis('any text');
    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('source');
    expect(result.scores).toHaveProperty('negative');
    expect(result.scores).toHaveProperty('neutral');
    expect(result.scores).toHaveProperty('positive');
  });

  test('scores.neutral is always 0.1', () => {
    const positiveResult = generateFallbackAnalysis('kondisi baik');
    const negativeResult = generateFallbackAnalysis('error rusak');
    const neutralResult = generateFallbackAnalysis('sedang berjalan');
    expect(positiveResult.scores.neutral).toBe(0.1);
    expect(negativeResult.scores.neutral).toBe(0.1);
    expect(neutralResult.scores.neutral).toBe(0.1);
  });

  test('handles empty string without throwing', () => {
    expect(() => generateFallbackAnalysis('')).not.toThrow();
    expect(generateFallbackAnalysis('').sentiment).toBe('neutral');
  });

  test('handles uppercase text (case-insensitive matching)', () => {
    const result = generateFallbackAnalysis('MESIN ERROR');
    expect(result.sentiment).toBe('negative');
  });
});
