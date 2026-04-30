import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header component', () => {
  const defaultProps = {
    onRefresh: jest.fn(),
    onExcelUpload: jest.fn(),
    uploading: false,
    analyzing: false,
  };

  afterEach(() => jest.clearAllMocks());

  test('renders Prodigy title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/Prodigy/i)).toBeInTheDocument();
  });

  test('renders AI-Powered subtitle', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/AI-Powered Production Problem Detection System/i)).toBeInTheDocument();
  });

  test('renders Upload Excel button when idle', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/Upload Excel/i)).toBeInTheDocument();
  });

  test('shows uploading state text when uploading=true', () => {
    render(<Header {...defaultProps} uploading={true} />);
    expect(screen.getByText(/Uploading/i)).toBeInTheDocument();
  });

  test('shows analyzing state text when analyzing=true', () => {
    render(<Header {...defaultProps} analyzing={true} />);
    expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
  });

  test('upload button is disabled when uploading', () => {
    render(<Header {...defaultProps} uploading={true} />);
    const btn = screen.getByRole('button', { name: /Uploading/i });
    expect(btn).toBeDisabled();
  });

  test('upload button is disabled when analyzing', () => {
    render(<Header {...defaultProps} analyzing={true} />);
    const btn = screen.getByRole('button', { name: /Analyzing/i });
    expect(btn).toBeDisabled();
  });

  test('upload button is enabled when idle', () => {
    render(<Header {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Upload Excel/i });
    expect(btn).not.toBeDisabled();
  });

  test('hidden file input accepts .xlsx and .xls', () => {
    render(<Header {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
  });
});
