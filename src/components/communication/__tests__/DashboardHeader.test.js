import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardHeader from '../DashboardHeader';

describe('DashboardHeader', () => {
  test('renders header with correct title and description', () => {
    render(<DashboardHeader />);
    
    expect(screen.getByText('Análisis Inteligente de Tendencias')).toBeInTheDocument();
    expect(screen.getByText('Insights generados por IA sobre comunicación y engagement')).toBeInTheDocument();
  });

  test('renders SparklesIcon', () => {
    render(<DashboardHeader />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});