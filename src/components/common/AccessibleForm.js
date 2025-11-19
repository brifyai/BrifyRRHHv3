import React, { useState, useRef, useEffect } from 'react';

/**
 * Componente de formulario accesible con validación y manejo de errores
 */
const AccessibleForm = ({
  children,
  onSubmit,
  validationSchema,
  initialValues = {},
  submitButtonText = 'Enviar',
  cancelButtonText = 'Cancelar',
  onCancel,
  loading = false,
  className = '',
  ariaLabel = 'Formulario',
  ...props
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const firstErrorRef = useRef(null);

  // Validar un campo específico
  const validateField = (name, value) => {
    if (!validationSchema) return null;
    
    try {
      // Validación simple basada en el schema
      const fieldSchema = validationSchema[name];
      if (fieldSchema) {
        if (fieldSchema.required && (!value || value.toString().trim() === '')) {
          return `${fieldSchema.label || name} es requerido`;
        }
        
        if (fieldSchema.minLength && value && value.length < fieldSchema.minLength) {
          return `${fieldSchema.label || name} debe tener al menos ${fieldSchema.minLength} caracteres`;
        }
        
        if (fieldSchema.pattern && value && !fieldSchema.pattern.test(value)) {
          return fieldSchema.message || `${fieldSchema.label || name} tiene un formato inválido`;
        }
        
        if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
          const result = fieldSchema.validate(value);
          if (result !== true) {
            return result;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error validando campo:', error);
      return 'Error de validación';
    }
  };

  // Validar todo el formulario
  const validateForm = () => {
    if (!validationSchema) return {};
    
    const newErrors = {};
    let hasErrors = false;
    
    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });
    
    return { errors: newErrors, hasErrors };
  };

  // Manejar cambio de campo
  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar en tiempo real si el campo ya fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Manejar blur de campo
  const handleFieldBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Manejar submit del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Marcar todos los campos como tocados
    const allTouched = Object.keys(validationSchema || {}).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Validar formulario
    const { errors: validationErrors, hasErrors } = validateForm();
    setErrors(validationErrors);
    
    if (hasErrors) {
      // Enfocar primer campo con error
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField && firstErrorRef.current) {
        firstErrorRef.current.focus();
      }
      
      // Anunciar errores para lectores de pantalla
      const errorCount = Object.keys(validationErrors).length;
      const announcement = `Formulario tiene ${errorCount} error${errorCount !== 1 ? 'es' : ''}. ${Object.values(validationErrors).join('. ')}`;
      
      const liveRegion = document.getElementById('form-announcements');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
      
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error en submit del formulario:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: error.message || 'Error al enviar el formulario' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cancelación
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Manejar navegación por teclado
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && onCancel) {
      handleCancel();
    }
  };

  // Enfocar primer campo al montar
  useEffect(() => {
    if (formRef.current) {
      const firstInput = formRef.current.querySelector('input, select, textarea, button');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, []);

  // Clonar children con props adicionales
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props.name) {
      const fieldName = child.props.name;
      const fieldError = errors[fieldName];
      const isTouched = touched[fieldName];
      const hasError = fieldError && isTouched;
      
      return React.cloneElement(child, {
        value: formData[fieldName] || '',
        onChange: (e) => {
          const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          handleFieldChange(fieldName, value);
          if (child.props.onChange) {
            child.props.onChange(e);
          }
        },
        onBlur: (e) => {
          handleFieldBlur(fieldName);
          if (child.props.onBlur) {
            child.props.onBlur(e);
          }
        },
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-describedby': hasError ? `${fieldName}-error` : child.props['aria-describedby'],
        ref: hasError && !firstErrorRef.current ? firstErrorRef : child.ref,
        className: `${child.props.className || ''} ${hasError ? 'error' : ''}`.trim(),
        ...child.props
      });
    }
    return child;
  });

  return (
    <>
      {/* Región live para anuncios de accesibilidad */}
      <div
        id="form-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className={`accessible-form ${className}`}
        aria-label={ariaLabel}
        noValidate
        {...props}
      >
        {childrenWithProps}
        
        {/* Mensajes de error de campo */}
        {Object.entries(errors).map(([fieldName, error]) => (
          touched[fieldName] && error && (
            <div
              key={fieldName}
              id={`${fieldName}-error`}
              className="field-error"
              role="alert"
              aria-live="polite"
              style={{
                color: '#dc3545',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              {error}
            </div>
          )
        ))}
        
        {/* Error general del formulario */}
        {errors.submit && (
          <div
            className="form-error"
            role="alert"
            aria-live="assertive"
            style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '0.75rem',
              borderRadius: '0.25rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            {errors.submit}
          </div>
        )}
        
        {/* Botones de acción */}
        <div 
          className="form-actions"
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            justifyContent: 'flex-end'
          }}
        >
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting || loading}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #6c757d',
                backgroundColor: '#6c757d',
                color: '#ffffff',
                borderRadius: '0.25rem',
                cursor: isSubmitting || loading ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || loading ? 0.6 : 1,
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              aria-label={cancelButtonText}
            >
              {cancelButtonText}
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #007bff',
              backgroundColor: '#007bff',
              color: '#ffffff',
              borderRadius: '0.25rem',
              cursor: isSubmitting || loading ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || loading ? 0.6 : 1,
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            aria-label={loading ? 'Enviando formulario...' : submitButtonText}
            aria-describedby={Object.keys(errors).some(key => errors[key] && touched[key]) ? 'form-errors' : undefined}
          >
            {loading || isSubmitting ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="animate-spin"
                >
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
                Enviando...
              </>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
      
      {/* Estilos para accesibilidad */}
      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .accessible-form :focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
        
        .accessible-form .error:focus {
          outline: 2px solid #dc3545;
          outline-offset: 2px;
        }
        
        .accessible-form input.error,
        .accessible-form select.error,
        .accessible-form textarea.error {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-spin {
            animation: none;
          }
          
          .accessible-form * {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

/**
 * Componente de campo de formulario accesible
 */
export  return (
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
          {required && (
            <span 
              className="required-indicator"
              style={{
                color: '#dc3545',
                marginLeft: '0.25rem'
              }}
              aria-label="requerido"
            >
              *
            </span>
          )}
        </label>
      )}
      
      <input
        id={fieldId}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        className={`form-input ${className}`}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
        {...props}
      />
    </div>
  );
};

/**
 * Componente de select accesible
 */
export  return (
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
          {required && (
            <span 
              className="required-indicator"
              style={{
                color: '#dc3545',
                marginLeft: '0.25rem'
              }}
              aria-label="requerido"
            >
              *
            </span>
          )}
        </label>
      )}
      
      <select
        id={fieldId}
        name={name}
        required={required}
        aria-label={ariaLabel}
        aria-required={required}
        className={`form-select ${className}`}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          backgroundColor: '#ffffff',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Componente de textarea accesible
 */
export  const characterCountId = `${name}-char-count`;
  
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
          {required && (
            <span 
              className="required-indicator"
              style={{
                color: '#dc3545',
                marginLeft: '0.25rem'
              }}
              aria-label="requerido"
            >
              *
            </span>
          )}
        </label>
      )}
      
      <textarea
        id={fieldId}
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-required={required}
        aria-describedby={maxLength ? characterCountId : undefined}
        className={`form-textarea ${className}`}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          resize: 'vertical',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
        {...props}
      />
      
      {maxLength && (
        <div 
          id={characterCountId}
          className="character-count"
          style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'right',
            marginTop: '0.25rem'
          }}
          aria-live="polite"
        >
          <span id={`${name}-current-count`}>0</span> / {maxLength} caracteres
        </div>
      )}
    </div>
  );
};

export default AccessibleForm;