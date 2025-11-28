#!/usr/bin/env node

/**
 * Analizador de Warnings ESLint
 * Categoriza y prioriza warnings para corrección sistemática
 */

import fs from 'fs';

class ESLintWarningsAnalyzer {
  constructor() {
    this.warnings = [];
    this.categories = {
      'no-unused-vars': { count: 0, severity: 'medium', description: 'Variables definidas pero no utilizadas' },
      'react-hooks/exhaustive-deps': { count: 0, severity: 'high', description: 'Dependencias faltantes en hooks' },
      'import/no-anonymous-default-export': { count: 0, severity: 'medium', description: 'Exportaciones anónimas por defecto' },
      'no-useless-escape': { count: 0, severity: 'low', description: 'Caracteres de escape innecesarios' },
      'default-case': { count: 0, severity: 'medium', description: 'Switch sin caso por defecto' },
      'no-unreachable': { count: 0, severity: 'high', description: 'Código inalcanzable' },
      'no-restricted-globals': { count: 0, severity: 'high', description: 'Uso de globales restringidos' },
      'no-undef': { count: 0, severity: 'high', description: 'Variables no definidas' },
      'no-const-assign': { count: 0, severity: 'high', description: 'Reasignación de constantes' }
    };
    this.files = {};
    this.priorityFixes = [];
  }

  /**
   * Analizar warnings desde output de ESLint
   */
  analyzeWarnings(eslintOutput) {
    console.log('🔍 ANALIZANDO WARNINGS ESLINT');
    console.log('=' .repeat(50));

    // Parsear output de ESLint
    const lines = eslintOutput.split('\n');
    
    lines.forEach(line => {
      if (line.includes('Warning') || line.includes('Error')) {
        this.parseWarningLine(line);
      }
    });

    this.generateAnalysis();
    this.createFixPlan();
    this.saveReport();
  }

  /**
   * Parsear línea de warning individual
   */
  parseWarningLine(line) {
    // Formato: file:line:col: Warning - message (rule)
    const match = line.match(/^(.+?):(\d+),(\d+),\s*(Warning|Error)\s*-\s*(.+?)\s*\((.+?)\)$/);
    
    if (match) {
      const [, file, lineNum, col, severity, message, rule] = match;
      
      const warning = {
        file,
        line: parseInt(lineNum),
        column: parseInt(col),
        severity: severity.toLowerCase(),
        message,
        rule,
        category: this.categorizeRule(rule)
      };

      this.warnings.push(warning);
      this.updateCategoryCount(rule);
      this.updateFileCount(file);
    }
  }

  /**
   * Categorizar regla por tipo
   */
  categorizeRule(rule) {
    if (rule.includes('no-unused-vars')) return 'no-unused-vars';
    if (rule.includes('react-hooks/exhaustive-deps')) return 'react-hooks/exhaustive-deps';
    if (rule.includes('no-anonymous-default-export')) return 'import/no-anonymous-default-export';
    if (rule.includes('no-useless-escape')) return 'no-useless-escape';
    if (rule.includes('default-case')) return 'default-case';
    if (rule.includes('no-unreachable')) return 'no-unreachable';
    if (rule.includes('no-restricted-globals')) return 'no-restricted-globals';
    if (rule.includes('no-undef')) return 'no-undef';
    if (rule.includes('no-const-assign')) return 'no-const-assign';
    return 'other';
  }

  /**
   * Actualizar conteo por categoría
   */
  updateCategoryCount(rule) {
    const category = this.categorizeRule(rule);
    if (this.categories[category]) {
      this.categories[category].count++;
    }
  }

  /**
   * Actualizar conteo por archivo
   */
  updateFileCount(file) {
    if (!this.files[file]) {
      this.files[file] = { count: 0, warnings: [] };
    }
    this.files[file].count++;
  }

  /**
   * Generar análisis completo
   */
  generateAnalysis() {
    console.log(`\n📊 RESUMEN GENERAL`);
    console.log(`Total de warnings: ${this.warnings.length}`);
    console.log(`Archivos afectados: ${Object.keys(this.files).length}`);

    console.log(`\n📋 CATEGORÍAS DE WARNINGS`);
    Object.entries(this.categories)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([category, data]) => {
        const severity = data.severity === 'high' ? '🔴' : 
                        data.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${severity} ${category}: ${data.count} warnings - ${data.description}`);
      });

    console.log(`\n📁 ARCHIVOS MÁS PROBLEMÁTICOS`);
    Object.entries(this.files)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([file, data]) => {
        console.log(`  ${file}: ${data.count} warnings`);
      });
  }

  /**
   * Crear plan de corrección
   */
  createFixPlan() {
    console.log(`\n🛠️ PLAN DE CORRECCIÓN`);

    // Prioridad 1: Errores críticos
    const criticalErrors = this.warnings.filter(w => 
      w.severity === 'error' || 
      ['no-unreachable', 'no-undef', 'no-restricted-globals'].includes(w.category)
    );

    if (criticalErrors.length > 0) {
      console.log(`\n🔴 PRIORIDAD 1 - ERRORES CRÍTICOS (${criticalErrors.length})`);
      criticalErrors.slice(0, 5).forEach(w => {
        console.log(`  ${w.file}:${w.line}:${w.column} - ${w.message}`);
      });
    }

    // Prioridad 2: Warnings de alto impacto
    const highImpactWarnings = this.warnings.filter(w => 
      w.category === 'react-hooks/exhaustive-deps' ||
      w.category === 'no-const-assign'
    );

    if (highImpactWarnings.length > 0) {
      console.log(`\n🟡 PRIORIDAD 2 - WARNINGS DE ALTO IMPACTO (${highImpactWarnings.length})`);
      console.log(`  React Hooks con dependencias faltantes: ${highImpactWarnings.length}`);
    }

    // Prioridad 3: Variables no utilizadas (automáticas)
    const unusedVars = this.warnings.filter(w => w.category === 'no-unused-vars');
    if (unusedVars.length > 0) {
      console.log(`\n🟢 PRIORIDAD 3 - VARIABLES NO UTILIZADAS (${unusedVars.length})`);
      console.log(`  Corrección automática posible con ESLint --fix`);
    }
  }

  /**
   * Guardar reporte detallado
   */
  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalWarnings: this.warnings.length,
        filesAffected: Object.keys(this.files).length,
        categories: this.categories
      },
      topProblematicFiles: Object.entries(this.files)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
        .map(([file, data]) => ({ file, count: data.count })),
      criticalWarnings: this.warnings.filter(w => 
        w.severity === 'error' || 
        ['no-unreachable', 'no-undef', 'no-restricted-globals'].includes(w.category)
      ),
      recommendations: this.getRecommendations()
    };

    fs.writeFileSync('ESLINT_WARNINGS_ANALYSIS.json', JSON.stringify(report, null, 2));
    console.log(`\n💾 Reporte detallado guardado en: ESLINT_WARNINGS_ANALYSIS.json`);
  }

  /**
   * Obtener recomendaciones
   */
  getRecommendations() {
    const recommendations = [];

    const unusedVars = this.categories['no-unused-vars'].count;
    const reactHooks = this.categories['react-hooks/exhaustive-deps'].count;
    const anonymousExports = this.categories['import/no-anonymous-default-export'].count;

    if (unusedVars > 50) {
      recommendations.push('Ejecutar ESLint con --fix para eliminar variables no utilizadas automáticamente');
    }

    if (reactHooks > 20) {
      recommendations.push('Revisar manualmente dependencias de useEffect y useCallback');
    }

    if (anonymousExports > 10) {
      recommendations.push('Refactorizar exportaciones anónimas en servicios');
    }

    recommendations.push('Implementar pre-commit hooks para prevenir nuevos warnings');
    recommendations.push('Configurar ESLint en CI/CD para mantener calidad de código');

    return recommendations;
  }
}

// Simular análisis con datos reales del ESLint
const analyzer = new ESLintWarningsAnalyzer();

// Datos reales del ESLint ejecutado
const realEslintOutput = `c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\api\\webhook\\google-calendar-notifications.js: line 71, col 11, Warning - 'resourceId' is assigned a value but never used. (no-unused-vars)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\api\\webhook\\google-calendar-notifications.js: line 196, col 11, Warning - 'endTime' is assigned a value but never used. (no-unused-vars)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\api\\webhook\\google-calendar-notifications.js: line 331, col 13, Warning - 'data' is assigned a value but never used. (no-unused-vars)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\components\\analytics\\AnalyticsDashboard.js: line 53, col 10, Warning - 'comparativeData' is assigned a value but never used. (no-unused-vars)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\components\\analytics\\AnalyticsDashboard.js: line 77, col 6, Warning - React Hook useEffect has a missing dependency: 'loadAnalyticsData'. Either include it or remove the dependency array. (react-hooks/exhaustive-deps)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\components\\knowledge\\KnowledgeBaseManager.js: line 215, col 10, Error - Unexpected use of 'confirm'. (no-restricted-globals)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\hooks\\useAccessibility.js: line 516, col 41, Error - 'React' is not defined. (no-undef)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\services\\analyticsInsightsService.js: line 422, col 1, Warning - Assign instance to a variable before exporting as module default (import/no-anonymous-default-export)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\services\\brevoService.js: line 622, col 48, Warning - Unnecessary escape character: \\(. (no-useless-escape)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\services\\databaseEmployeeService.js: line 236, col 21, Warning - Unreachable code. (no-unreachable)
c:\\Users\\admin\\Desktop\\AIntelligence\\RRHH Brify\\BrifyRRHHv2-main\\src\\components\\test\\GoogleDriveConnectionVerifier.js: line 36, col 9, Warning - Expected a default case. (default-case)`;

analyzer.analyzeWarnings(realEslintOutput);

export default ESLintWarningsAnalyzer;