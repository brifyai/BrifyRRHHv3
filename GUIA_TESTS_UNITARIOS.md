# 🧪 GUÍA DE TESTS UNITARIOS - STAFFHUB

## 🎯 OBJETIVO
Establecer una estrategia de testing para funciones críticas de StaffHub.

---

## 📊 PRIORIDADES DE TESTING

### **Prioridad Alta (Crítico):**
1. ✅ Autenticación (customAuthService)
2. ✅ Gestión de empresas y empleados
3. ✅ Cumplimiento WhatsApp (whatsappComplianceService)
4. ✅ Configuración (configurationService)

### **Prioridad Media (Importante):**
5. ⚠️ Servicios de WhatsApp
6. ⚠️ Servicios de Google Drive
7. ⚠️ Base de conocimiento

### **Prioridad Baja (Opcional):**
8. ℹ️ Servicios de UI
9. ℹ️ Utilidades
10. ℹ️ Helpers

---

## 🛠️ SETUP DE TESTING

### **Instalación de dependencias:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev jest-environment-jsdom
```

### **Configuración de Jest:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

---

## 📝 EJEMPLOS DE TESTS

### **1. Test de Autenticación (customAuthService)**

```javascript
// src/services/__tests__/customAuthService.test.js
import customAuth from '../customAuthService'
import { supabase } from '../../lib/supabase'

// Mock de Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}))

describe('customAuthService', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('signIn', () => {
    it('debe iniciar sesión exitosamente con credenciales válidas', async () => {
      // Arrange
      const mockUser = {
        user_id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        is_active: true,
      }

      supabase.rpc.mockResolvedValue({
        data: [mockUser],
        error: null,
      })

      // Act
      const result = await customAuth.signIn('test@example.com', 'password123')

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user.email).toBe('test@example.com')
      expect(localStorage.getItem('custom_auth_session')).toBeTruthy()
    })

    it('debe retornar error con credenciales inválidas', async () => {
      // Arrange
      supabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      // Act
      const result = await customAuth.signIn('test@example.com', 'wrongpassword')

      // Assert
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('Email o contraseña incorrectos')
      expect(result.data).toBeNull()
    })

    it('debe manejar errores de red', async () => {
      // Arrange
      supabase.rpc.mockRejectedValue(new Error('Network error'))

      // Act
      const result = await customAuth.signIn('test@example.com', 'password123')

      // Assert
      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  describe('signOut', () => {
    it('debe cerrar sesión correctamente', async () => {
      // Arrange
      localStorage.setItem('custom_auth_session', JSON.stringify({ user: {} }))

      // Act
      const result = await customAuth.signOut()

      // Assert
      expect(result.error).toBeNull()
      expect(localStorage.getItem('custom_auth_session')).toBeNull()
    })
  })

  describe('getSession', () => {
    it('debe retornar sesión válida', () => {
      // Arrange
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
        expires_at: Date.now() + 10000,
      }
      localStorage.setItem('custom_auth_session', JSON.stringify(mockSession))

      // Act
      const result = customAuth.getSession()

      // Assert
      expect(result.data.session).toBeTruthy()
      expect(result.data.session.user.email).toBe('test@example.com')
    })

    it('debe retornar null si la sesión expiró', () => {
      // Arrange
      const mockSession = {
        user: { id: '123' },
        expires_at: Date.now() - 10000, // Expirada
      }
      localStorage.setItem('custom_auth_session', JSON.stringify(mockSession))

      // Act
      const result = customAuth.getSession()

      // Assert
      expect(result.data.session).toBeNull()
      expect(localStorage.getItem('custom_auth_session')).toBeNull()
    })
  })
})
```

### **2. Test de WhatsApp Compliance**

```javascript
// src/services/__tests__/whatsappComplianceService.test.js
import whatsappComplianceService from '../whatsappComplianceService'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase')

describe('whatsappComplianceService', () => {
  describe('hasActiveConsent', () => {
    it('debe retornar true si hay consentimiento activo', async () => {
      // Arrange
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { consent_status: 'active' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await whatsappComplianceService.hasActiveConsent(
        'company-123',
        '+56912345678'
      )

      // Assert
      expect(result).toBe(true)
    })

    it('debe retornar false si no hay consentimiento', async () => {
      // Arrange
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await whatsappComplianceService.hasActiveConsent(
        'company-123',
        '+56912345678'
      )

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('validateMessageContent', () => {
    it('debe validar contenido de texto correctamente', async () => {
      // Act
      const result = await whatsappComplianceService.validateMessageContent(
        'Hola, ¿cómo estás?',
        'text'
      )

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('debe detectar contenido prohibido', async () => {
      // Act
      const result = await whatsappComplianceService.validateMessageContent(
        'Compra ahora con descuento!!!',
        'text'
      )

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
    })
  })
})
```

### **3. Test de Componente React**

```javascript
// src/components/__tests__/Dashboard.test.js
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../dashboard/Dashboard'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock de servicios
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

const MockedDashboard = () => (
  <BrowserRouter>
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  </BrowserRouter>
)

describe('Dashboard Component', () => {
  it('debe renderizar el dashboard correctamente', async () => {
    // Act
    render(<MockedDashboard />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument()
    })
  })

  it('debe mostrar estadísticas', async () => {
    // Act
    render(<MockedDashboard />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Carpetas/i)).toBeInTheDocument()
      expect(screen.getByText(/Archivos/i)).toBeInTheDocument()
    })
  })
})
```

---

## 🎯 ESTRATEGIA DE TESTING

### **Fase 1: Tests Críticos (Semana 1)**
```bash
# Crear tests para:
- customAuthService.test.js
- whatsappComplianceService.test.js
- configurationService.test.js
- organizedDatabaseService.test.js
```

### **Fase 2: Tests Importantes (Semana 2)**
```bash
# Crear tests para:
- multiWhatsAppService.test.js
- googleDriveSyncService.test.js
- companyKnowledgeService.test.js
```

### **Fase 3: Tests de Componentes (Semana 3)**
```bash
# Crear tests para:
- Dashboard.test.js
- Login.test.js
- Settings.test.js
```

---

## 📊 COBERTURA DE CÓDIGO

### **Objetivo de cobertura:**
- **Funciones críticas:** 90%+
- **Servicios principales:** 80%+
- **Componentes:** 70%+
- **Utilidades:** 60%+

### **Comandos útiles:**
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm test -- --coverage

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar un test específico
npm test -- Dashboard.test.js
```

---

## 🔧 UTILIDADES DE TESTING

### **Mocks comunes:**

```javascript
// Mock de Supabase
export const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
}

// Mock de localStorage
export const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Mock de fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
)
```

---

## 📝 CHECKLIST DE TESTING

### **Antes de escribir tests:**
- [ ] Identificar función/componente a testear
- [ ] Listar casos de uso principales
- [ ] Identificar casos edge
- [ ] Preparar mocks necesarios

### **Al escribir tests:**
- [ ] Usar patrón AAA (Arrange, Act, Assert)
- [ ] Nombres descriptivos de tests
- [ ] Un concepto por test
- [ ] Tests independientes
- [ ] Limpiar después de cada test

### **Después de escribir tests:**
- [ ] Verificar cobertura
- [ ] Ejecutar todos los tests
- [ ] Revisar falsos positivos
- [ ] Documentar casos complejos

---

## 🚀 PRÓXIMOS PASOS

1. **Crear carpeta `__tests__`** en cada directorio de servicios
2. **Escribir tests para customAuthService** (más crítico)
3. **Configurar CI/CD** para ejecutar tests automáticamente
4. **Establecer umbral de cobertura** mínimo
5. **Documentar casos edge** importantes

---

**Última actualización:** 2026-01-28
**Estado:** Guía completa
**Próxima acción:** Implementar tests críticos
