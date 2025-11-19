import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricsGrid from '../MetricsGrid';

describe('MetricsGrid', () => {
  const mockCompanyMetrics = {
    engagementRate: 85,
    messageStats: {
      total: 100,
      read: 75,
      sent: 100,
      scheduled: 0,
      failed: 0
    },
    employeeCount: 50
  };

  const mockEmployees = [{ id: 1 }, { id: 2 }, { id: 3 }];

  test('renders all 4 metric cards', () => {
    render(<MetricsGrid companyMetrics={mockCompanyMetrics} employees={mockEmployees} selectedCompany="test-company" />);
    
    expect(screen.getByText('Engagement Real')).toBeInTheDocument();
    expect(screen.getByText('Tasa de Lectura Real')).toBeInTheDocument();
    expect(screen.getByText('Mensajes Enviados Reales')).toBeInTheDocument();
    expect(screen.getByText('Empleados Reales')).toBeInTheDocument();
  });

  test('displays correct metric values', () => {
    render(<MetricsGrid companyMetrics={mockCompanyMetrics} employees={mockEmployees} selectedCompany="test-company" />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  test('handles missing metrics gracefully', () => {
    render(<MetricsGrid companyMetrics={null} employees={mockEmployees} selectedCompany="all" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // employees.length
  });
});