import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingGame from '@/components/skillcard/game/ReadingGame';

describe('ReadingGame', () => {
  const mockOnMicClick = vi.fn();

  const baseProps = {
    config: { id: 'reading' },
    challenge: { question: 'Read this word' },
    isListening: false,
    displaySpokenText: 'Mic Off',
    onMicClick: mockOnMicClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the question correctly', () => {
    render(<ReadingGame {...baseProps} />);
    expect(screen.getByText('Read this word')).toBeInTheDocument();
  });

  it('displays "Start 🎤" when not listening', () => {
    render(<ReadingGame {...baseProps} />);
    expect(screen.getByRole('button')).toHaveTextContent('Start 🎤');
  });

  it('displays "Stop 🎤" when listening', () => {
    render(<ReadingGame {...baseProps} isListening={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Stop 🎤');
  });

  it('calls onMicClick with correct skill id when clicked', () => {
    render(<ReadingGame {...baseProps} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockOnMicClick).toHaveBeenCalledTimes(1);
    expect(mockOnMicClick).toHaveBeenCalledWith('reading');
  });

  it('displays spoken text correctly', () => {
    render(<ReadingGame {...baseProps} displaySpokenText="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('handles missing challenge gracefully', () => {
    render(<ReadingGame {...baseProps} challenge={null} />);
    expect(screen.queryByText('Read this word')).not.toBeInTheDocument();
  });
});