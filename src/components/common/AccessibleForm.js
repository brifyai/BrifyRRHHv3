/**
 * Componentes de formulario accesibles para mejorar la usabilidad
 * Incluye validaciones, manejo de errores y navegación por teclado
 */

import React from 'react';

/**
 * Componente principal de formulario accesible
 */
export const AccessibleForm = ({ children, onSubmit, noValidate = false, ...props }) => {
  const handleSubmit = (e) => {
    if (!noValidate) {
      e.preventDefault();
    }
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      noValidate={noValidate}
      role="form"
      aria-label="Formulario accesible"
      {...props}
    >
      {children}
    </form>
  );
};

/**
 * Componente de campo de formulario accesible
 */
export default function AccessibleFormField({
  label,
  fieldId,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = '',
  children,
  ...props
}) {
  const hasError = Boolean(error);
  const errorId = `${fieldId}-error`;
  const describedBy = hasError ? errorId : undefined;

  return (
    <div className="form-field" style={{ marginBottom: '1rem' }}>
      {label && (
        <label 
          htmlFor={fieldId}
          className="field-label"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151',
            fontSize: '0.875rem'
          }}
        >
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      
      <div className="field-wrapper">
        {children || (
          <input
            id={fieldId}
            name={fieldId}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.15s ease-in-out'
            }}
            {...props}
          />
        )}
        
        {hasError && (
          <div
            id={errorId}
            role="alert"
            style={{
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#dc2626'
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de select accesible
 */
export function AccessibleFormSelect({
  label,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  children,
  ...props
}) {
  const hasError = Boolean(error);
  const errorId = `${fieldId}-error`;
  const describedBy = hasError ? errorId : undefined;

  return (
    <div className="form-field" style={{ marginBottom: '1rem' }}>
      {label && (
        <label 
          htmlFor={fieldId}
          className="field-label"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151',
            fontSize: '0.875rem'
          }}
        >
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      
      <select
        id={fieldId}
        name={fieldId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          outline: 'none',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        {...props}
      >
        {children}
      </select>
      
      {hasError && (
        <div
          id={errorId}
          role="alert"
          style={{
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: '#dc2626'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Componente de textarea accesible
 */
export function AccessibleFormTextarea({
  label,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = '',
  rows = 3,
  ...props
}) {
  const hasError = Boolean(error);
  const errorId = `${fieldId}-error`;
  const describedBy = hasError ? errorId : undefined;

  return (
    <div className="form-field" style={{ marginBottom: '1rem' }}>
      {label && (
        <label 
          htmlFor={fieldId}
          className="field-label"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151',
            fontSize: '0.875rem'
          }}
        >
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      
      <textarea
        id={fieldId}
        name={fieldId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          outline: 'none',
          resize: 'vertical',
          minHeight: '2.5rem'
        }}
        {...props}
      />
      
      {hasError && (
        <div
          id={errorId}
          role="alert"
          style={{
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: '#dc2626'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Hook para manejo de formularios accesibles
 */
export const useAccessibleForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return '';

    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.message || `${name} es requerido`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `${name} no es válido`;
    }

    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `${name} debe tener al menos ${rule.minLength} caracteres`;
    }

    return '';
  };

  const handleChange = (name) => (e) => {
    const value = e.target.value;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues,
    setErrors
  };
};