import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import enhancedCommunicationService from '../../services/enhancedCommunicationService.js';
import companySyncService from '../../services/companySyncService.js';
import './PredictiveAnalyticsDashboard.css';

const PredictiveAnalyticsDashboard = ({ companyId }) => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState(null);
  const [expandedInsight, setExpandedInsight] = useState(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, insightsData] = await Promise.all([
        enhancedCommunicationService.getEnhancedCommunicationStats(),
        enhancedCommunicationService.getPredictiveInsights(companyId || 'default')
      ]);
      
      setStats(statsData);
      setInsights(insightsData);
    } catch (err) {
      console.error('Error cargando analíticas:', err);
      setError('Error cargando datos de analíticas');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const getEngagementColor = (score) => {
    if (score >= 0.7) return 'from-emerald-400 to-emerald-600';
    if (score >= 0.5) return 'from-amber-400 to-amber-600';
    return 'from-rose-400 to-rose-600';
  };

  const getEngagementBgColor = (score) => {
    if (score >= 0.7) return 'bg-emerald-500';
    if (score >= 0.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const metrics = [
    {
      id: 'engagement',
      title: 'Engagement',
      value: formatPercentage(stats?.aiEnhancements?.trends?.averageEngagement || 0.65),
      icon: '📊',
      color: getEngagementColor(stats?.aiEnhancements?.trends?.averageEngagement || 0.65),
      bgColor: getEngagementBgColor(stats?.aiEnhancements?.trends?.averageEngagement || 0.65),
      trend: stats?.aiEnhancements?.trends?.engagementTrend === 'increasing' ? '📈 +12%' : '📊 Estable',
      description: 'Tasa de interacción total'
    },
    {
      id: 'optimizations',
      title: 'Optimizaciones',
      value: stats?.aiEnhancements?.totalOptimizations || 24,
      icon: '🎯',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500',
      trend: `Mejora: ${formatPercentage(stats?.aiEnhancements?.averageImprovement || 0.35)}`,
      description: 'Mejoras aplicadas por IA'
    },
    {
      id: 'insights',
      title: 'Insights',
      value: insights?.insights?.length || 8,
      icon: '💡',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500',
      trend: `Confianza: ${formatPercentage(insights?.confidence || 0.82)}`,
      description: 'Descubrimientos inteligentes'
    },
    {
      id: 'effectiveness',
      title: 'Efectividad IA',
      value: formatPercentage(0.87),
      icon: '🚀',
      color: 'from-cyan-400 to-cyan-600',
      bgColor: 'bg-cyan-500',
      trend: insights?.predictive ? '🔮 Predictivo' : '📊 Analítico',
      description: 'Rendimiento del sistema'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-purple-600 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Analizando tendencias...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Compacto */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🤖 Análisis Inteligente
            </h1>
            <p className="text-gray-600 mt-1">Insights predictivos en tiempo real</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
            
            <button
              onClick={loadAnalyticsData}
              className="p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white transition-colors"
            >
              🔄
            </button>
          </div>
        </div>
      </motion.div>

      {/* Métricas Principales - Grid Compacto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => setActiveMetric(activeMetric === metric.id ? null : metric.id)}
              className={`relative p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 cursor-pointer transition-all duration-300 ${
                activeMetric === metric.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${metric.color} flex items-center justify-center text-white text-xl`}>
                  {metric.icon}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${metric.bgColor} bg-opacity-10 text-gray-700`}>
                  {metric.trend}
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                <p className="text-sm font-medium text-gray-700 mb-1">{metric.title}</p>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>

              <AnimatePresence>
                {activeMetric === metric.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Progreso</span>
                        <span className="font-medium text-gray-700">{metric.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full bg-gradient-to-r ${metric.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: metric.value }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Insights y Recomendaciones - Diseño Compacto */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Predictivos */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">🧠 Insights Predictivos</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {insights?.insights?.length || 0} activos
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {insights?.insights?.slice(0, 4).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
                className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                    {insight.tipo?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    insight.impacto === 'alto' ? 'bg-red-100 text-red-700' :
                    insight.impacto === 'medio' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.impacto === 'alto' ? '🔴 Alto' :
                     insight.impacto === 'medio' ? '🟡 Medio' : '🟢 Bajo'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 font-medium mb-2 line-clamp-2">
                  {insight.descripcion}
                </p>

                <AnimatePresence>
                  {expandedInsight === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-gray-600 pt-2 border-t border-purple-100"
                    >
                      <p>Este insight fue generado mediante análisis avanzado de patrones de comunicación y comportamiento predictivo.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Acciones Recomendadas */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">⚡ Acciones Recomendadas</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {stats?.aiEnhancements?.trends?.recommendedActions?.length || 0} pendientes
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats?.aiEnhancements?.trends?.recommendedActions?.slice(0, 4).map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`action-${index}`}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`action-${index}`} className="text-sm text-gray-700 font-medium cursor-pointer flex-1">
                    {action}
                  </label>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            Aplicar Acciones Seleccionadas
          </motion.button>
        </motion.div>
      </div>

      {/* Footer Compacto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto mt-8 text-center text-xs text-gray-500"
      >
        Última actualización: {new Date().toLocaleString('es-CL')}
      </motion.div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;