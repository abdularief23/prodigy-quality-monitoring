import { render, screen, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

const mockProblemsResponse = {
  data: {
    status: 'success',
    data: [
      {
        id: 'PRB-001',
        name: 'Mesin Error',
        description: 'Mesin tidak bisa start',
        severity: 'Critical',
        status: 'Open',
        equipment: 'CNC-01',
        location: 'Line A',
      },
    ],
  },
};

const mockInsightsResponse = {
  data: {
    status: 'success',
    data: {
      total_problems: 1,
      by_severity: { Critical: 1, High: 0, Medium: 0, Low: 0 },
      resolution_rate: 0.5,
      avg_response_time: '2h',
    },
  },
};

beforeEach(() => {
  axios.get.mockImplementation((url) => {
    if (url.includes('problems-with-full-analysis')) return Promise.resolve(mockProblemsResponse);
    if (url.includes('insights')) return Promise.resolve(mockInsightsResponse);
    return Promise.reject(new Error('Unknown URL'));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

async function renderApp() {
  let result;
  await act(async () => {
    result = render(<App />);
    // Allow all pending promises/state updates to settle
    await Promise.resolve();
  });
  return result;
}

describe('App component', () => {
  test('renders Prodigy title in header', async () => {
    await renderApp();
    expect(screen.getByRole('heading', { name: /Prodigy/i })).toBeInTheDocument();
  });

  test('renders Upload Excel button', async () => {
    await renderApp();
    expect(screen.getByText(/Upload Excel/i)).toBeInTheDocument();
  });

  test('renders Refresh button', async () => {
    await renderApp();
    expect(screen.getByText(/Refresh/i)).toBeInTheDocument();
  });

  test('renders Reset button', async () => {
    await renderApp();
    expect(screen.getByText(/Reset/i)).toBeInTheDocument();
  });

  test('renders footer with version info', async () => {
    await renderApp();
    expect(screen.getByText(/Prodigy v3.0/i)).toBeInTheDocument();
  });

  test('calls fetchProblems and fetchInsights on mount', async () => {
    await renderApp();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('problems-with-full-analysis'));
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('insights'));
  });

  test('file input accepts .xlsx and .xls only', async () => {
    await renderApp();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
  });

  test('shows error message when fetch fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    await act(async () => {
      render(<App />);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText(/Failed to load problems/i)).toBeInTheDocument();
    });
  });
});
