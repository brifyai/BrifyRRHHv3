# Configuración de n8n para WhatsApp con Conocimiento del Empleado

## 📋 WORKFLOWS DE N8N

### **Workflow 1: Procesamiento de Mensajes de WhatsApp**

```json
{
  "name": "WhatsApp AI con Conocimiento del Empleado",
  "nodes": [
    {
      "parameters": {
        "path": "whatsapp-message",
        "httpMethod": "POST",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-whatsapp",
      "name": "Webhook WhatsApp",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://tu-app.com/api/whatsapp/identify-employee",
        "method": "POST",
        "body": {
          "whatsapp_number": "={{ $json.from }}",
          "company_id": "={{ $json.company_id }}"
        },
        "options": {}
      },
      "id": "identify-employee",
      "name": "Identificar Empleado",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.found }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equal"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "check-employee-found",
      "name": "¿Empleado Encontrado?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "url": "https://tu-app.com/api/whatsapp/ai-response",
        "method": "POST",
        "body": {
          "message": "={{ $('Webhook WhatsApp').item.json.message }}",
          "employee_email": "={{ $json.employee.email }}",
          "company_id": "={{ $('Webhook WhatsApp').item.json.company_id }}"
        },
        "options": {}
      },
      "id": "generate-ai-response",
      "name": "Generar Respuesta IA",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [900, 200]
    },
    {
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "whatsAppApi",
        "method": "POST",
        "body": {
          "to": "={{ $('Webhook WhatsApp').item.json.from }}",
          "message": "={{ $json.response }}"
        },
        "options": {}
      },
      "id": "send-whatsapp-response",
      "name": "Enviar Respuesta WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "body": {
          "to": "={{ $('Webhook WhatsApp').item.json.from }}",
          "message": "Lo siento, no pude identificarte. Contacta a tu administrador."
        },
        "options": {}
      },
      "id": "send-not-found-response",
      "name": "Respuesta No Encontrado",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [900, 400]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "id": "webhook-response",
      "name": "Respuesta Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1340, 200]
    }
  ],
  "connections": {
    "Webhook WhatsApp": {
      "main": [
        [
          {
            "node": "Identificar Empleado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Identificar Empleado": {
      "main": [
        [
          {
            "node": "¿Empleado Encontrado?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "¿Empleado Encontrado?": {
      "main": [
        [
          {
            "node": "Generar Respuesta IA",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Respuesta No Encontrado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generar Respuesta IA": {
      "main": [
        [
          {
            "node": "Enviar Respuesta WhatsApp",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enviar Respuesta WhatsApp": {
      "main": [
        [
          {
            "node": "Respuesta Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Respuesta No Encontrado": {
      "main": [
        [
          {
            "node": "Respuesta Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["whatsapp", "ai", "employee-knowledge"],
  "triggerCount": 1,
  "updatedAt": "2025-11-23T17:23:00.000Z",
  "versionId": "1"
}
```

### **Workflow 2: Sincronización Periódica de Conocimiento**

```json
{
  "name": "Sincronización de Bases de Conocimiento",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "cronExpression": "0 */6 * * *"
            }
          ]
        }
      },
      "id": "schedule-sync",
      "name": "Programar Sincronización",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://tu-app.com/api/knowledge/sync-all",
        "method": "POST",
        "body": {
          "force_sync": false
        },
        "options": {}
      },
      "id": "trigger-sync",
      "name": "Iniciar Sincronización",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.success }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equal"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "check-sync-success",
      "name": "¿Sincronización Exitosa?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "subject": "Sincronización de Conocimiento Completada",
        "body": "={{ $json.message }}",
        "options": {}
      },
      "id": "send-success-notification",
      "name": "Notificación Éxito",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [900, 200]
    },
    {
      "parameters": {
        "subject": "Error en Sincronización de Conocimiento",
        "body": "Error: {{ $json.error }}",
        "options": {}
      },
      "id": "send-error-notification",
      "name": "Notificación Error",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [900, 400]
    }
  ],
  "connections": {
    "Programar Sincronización": {
      "main": [
        [
          {
            "node": "Iniciar Sincronización",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Iniciar Sincronización": {
      "main": [
        [
          {
            "node": "¿Sincronización Exitosa?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "¿Sincronización Exitosa?": {
      "main": [
        [
          {
            "node": "Notificación Éxito",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Notificación Error",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### **Workflow 3: Monitoreo y Alertas**

```json
{
  "name": "Monitoreo de Bases de Conocimiento",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "cronExpression": "0 */4 * * *"
            }
          ]
        }
      },
      "id": "schedule-monitoring",
      "name": "Monitoreo Programado",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://tu-app.com/api/knowledge/health-check",
        "method": "GET",
        "options": {}
      },
      "id": "health-check",
      "name": "Verificar Salud",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.healthy }}",
              "rightValue": false,
              "operator": {
                "type": "boolean",
                "operation": "equal"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "check-health-status",
      "name": "¿Sistema Saludable?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "subject": "⚠️ Alerta: Problema en Bases de Conocimiento",
        "body": "Problemas detectados:\n\n{{ $json.issues.join('\\n') }}",
        "options": {}
      },
      "id": "send-alert",
      "name": "Enviar Alerta",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [900, 400]
    }
  ]
}
```

## 🔧 CONFIGURACIÓN DE CREDENCIALES EN N8N

### **1. Credenciales de WhatsApp Business API**

```json
{
  "name": "WhatsApp Business API",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer YOUR_WHATSAPP_TOKEN"
  }
}
```

### **2. Credenciales de la Aplicación**

```json
{
  "name": "App API Credentials",
  "type": "httpHeaderAuth",
  "data": {
    "name": "X-API-Key",
    "value": "YOUR_APP_API_KEY"
  }
}
```

## 📊 DASHBOARD DE MONITOREO EN N8N

### **Métricas a Trackear:**

1. **Mensajes Procesados por Hora**
2. **Tiempo de Respuesta Promedio**
3. **Tasa de Éxito de Identificación de Empleados**
4. **Precisión de Respuestas de IA**
5. **Bases de Conocimiento Activas**
6. **Errores de Sincronización**

### **Alertas Configuradas:**

1. **Tiempo de Respuesta > 5 segundos**
2. **Tasa de Error > 10%**
3. **Fallo en Sincronización > 30 minutos**
4. **Base de Conocimiento Sin Actualizar > 24 horas**

## 🚀 PASOS DE IMPLEMENTACIÓN EN N8N

### **Paso 1: Instalar n8n**
```bash
npm install n8n -g
n8n start
```

### **Paso 2: Configurar Credenciales**
1. Ir a Settings > Credentials
2. Crear credenciales para WhatsApp API
3. Crear credenciales para la aplicación

### **Paso 3: Importar Workflows**
1. Ir a Workflows > Import from File
2. Importar los 3 workflows JSON
3. Configurar URLs de webhooks

### **Paso 4: Configurar Webhooks**
1. Configurar webhook URL: `https://tu-n8n-instance.com/webhook/whatsapp-message`
2. Configurar en WhatsApp Business Platform
3. Probar con mensaje de prueba

### **Paso 5: Configurar Programaciones**
1. Sincronización cada 6 horas
2. Monitoreo cada 4 horas
3. Alertas automáticas por email

## 🔗 INTEGRACIÓN CON SUPABASE

### **Configuración de Webhooks en Supabase:**

```sql
-- Función para notificar a n8n cuando se actualiza una base de conocimiento
CREATE OR REPLACE FUNCTION notify_knowledge_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tu-n8n-instance.com/webhook/knowledge-updated',
    headers := '{"Content-Type": "application/json"}',
    body := json_build_object(
      'employee_email', NEW.employee_email,
      'knowledge_base_id', NEW.id,
      'action', TG_OP,
      'timestamp', NOW()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función
CREATE TRIGGER knowledge_update_trigger
  AFTER INSERT OR UPDATE ON employee_knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION notify_knowledge_update();
```

## 📈 MÉTRICAS Y REPORTES

### **KPIs Principales:**

1. **Response Time**: < 3 segundos
2. **Accuracy Rate**: > 85%
3. **Employee Coverage**: > 90%
4. **Sync Success Rate**: > 95%
5. **User Satisfaction**: > 4.0/5.0

### **Reportes Automáticos:**

1. **Daily Summary**: Resumen diario de actividad
2. **Weekly Performance**: Análisis semanal de rendimiento
3. **Monthly Insights**: Insights mensuales de uso
4. **Error Analysis**: Análisis de errores y tendencias

Esta configuración de n8n te permitirá tener un sistema completo de automatización para el procesamiento de mensajes de WhatsApp con conocimiento del empleado, sincronización automática y monitoreo en tiempo real.