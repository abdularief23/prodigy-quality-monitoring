import { render, screen } from '@testing-library/react';
import KPICards from './KPICards';

describe('KPICards component', () => {
  test('renders Total Problems card', () => {
    render(<KPICards insights={null} />);
    expect(screen.getByText(/Total Problems/i)).toBeInTheDocument();
  });

  test('renders Critical Issues card', () => {
    render(<KPICards insights={null} />);
    expect(screen.getByText(/Critical Issues/i)).toBeInTheDocument();
  });

  test('renders Resolution Rate card', () => {
    render(<KPICards insights={null} />);
    expect(screen.getByText(/Resolution Rate/i)).toBeInTheDocument();
  });

  test('renders Avg Response card', () => {
    render(<KPICards insights={null} />);
    expect(screen.getByText(/Avg Response/i)).toBeInTheDocument();
  });

  test('shows 0 for total problems when insights is null', () => {
    render(<KPICards insights={null} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  test('shows correct total problems from insights', () => {
    const insights = {
      total_problems: 42,
      by_severity: { Critical: 5 },
      resolution_rate: 0.8,
      avg_response_time: '3h',
    };
    render(<KPICards insights={insights} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('shows correct critical count from insights', () => {
    const insights = {
      total_problems: 10,
      by_severity: { Critical: 7 },
      resolution_rate: 0.5,
      avg_response_time: '1h',
    };
    render(<KPICards insights={insights} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('shows resolution rate as percentage', () => {
    const insights = {
      total_problems: 10,
      by_severity: { Critical: 0 },
      resolution_rate: 0.75,
      avg_response_time: '2h',
    };
    render(<KPICards insights={insights} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('shows 0% resolution when insights is null', () => {
    render(<KPICards insights={null} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('shows avg_response_time from insights', () => {
    const insights = {
      total_problems: 5,
      by_severity: { Critical: 1 },
      resolution_rate: 0.4,
      avg_response_time: '4h 30m',
    };
    render(<KPICards insights={insights} />);
    expect(screen.getByText('4h 30m')).toBeInTheDocument();
  });

  test('shows -- when avg_response_time is not provided', () => {
    render(<KPICards insights={null} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
