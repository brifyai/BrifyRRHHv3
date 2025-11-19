import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  XMarkIcon,
  SparklesIcon,
  FireIcon,
  RocketLaunchIcon,
  StarIcon,
  CheckCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import gamificationService from '../../services/gamificationService.js';

const AchievementNotification = ({ user, employeeId, onDismiss }) => {
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user && employeeId) {
      loadUnreadEvents();
      // Verificar eventos nuevos cada 30 segundos
      const interval = setInterval(loadUnreadEvents, 30000);
      return () => clearInterval(interval);
    }
  }, [user, employeeId]);

  const loadUnreadEvents = async () => {
    try {
      const result = await gamificationService.getGamificationEvents(user.id, employeeId, 10);
      if (result.success) {
        const unreadEvents = result.data.filter(event => !event.notification_sent);
        if (unreadEvents.length > 0) {
          setEvents(unreadEvents);
          setCurrentEvent(unreadEvents[0]);
          setIsVisible(true);
          
          // Marcar como leído después de mostrar
          setTimeout(() => {
            markEventAsRead(unreadEvents[0].id);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error loading unread events:', error);
    }
  };

  const markEventAsRead = async (eventId) => {
    try {
      await gamificationService.markEventNotified(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      // Mostrar siguiente evento si hay
      const remainingEvents = events.filter(e => e.id !== eventId);
      if (remainingEvents.length > 0) {
        setCurrentEvent(remainingEvents[0]);
        setTimeout(() => {
          markEventAsRead(remainingEvents[0].id);
        }, 1000);
      } else {
        setIsVisible(false);
        setCurrentEvent(null);
      }
    } catch (error) {
      console.error('Error marking event as read:', error);
    }
  };

  const handleDismiss = () => {
    if (currentEvent) {
      markEventAsRead(currentEvent.id);
    } else {
      setIsVisible(false);
      onDismiss?.();
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'level_up':
        return <RocketLaunchIcon className="h-8 w-8 text-white" />;
      case 'achievement_unlocked':
        return <TrophyIcon className="h-8 w-8 text-white" />;
      case 'streak_milestone':
        return <FireIcon className="h-8 w-8 text-white" />;
      default:
        return <StarIcon className="h-8 w-8 text-white" />;
    }
  };

  const getEventTitle = (eventType, eventData) => {
    switch (eventType) {
      case 'level_up':
        return `¡Nivel ${eventData?.new_level || 'Nuevo'} Alcanzado!`;
      case 'achievement_unlocked':
        return `¡Logro Desbloqueado!`;
      case 'streak_milestone':
        return `¡Hito de Racha Alcanzado!`;
      default:
        return '¡Felicidades!';
    }
  };

  const getEventDescription = (eventType, eventData) => {
    switch (eventType) {
      case 'level_up':
        return `Has alcanzado el nivel ${eventData?.new_level || 'superior'} con ${eventData?.total_points || 0} puntos totales.`;
      case 'achievement_unlocked':
        return `Has desbloqueado: ${eventData?.achievement_name || 'Nuevo logro'} y ganado ${eventData?.points_reward || 0} puntos.`;
      case 'streak_milestone':
        return `¡Increíble racha de actividad! Sigue así.`;
      default:
        return 'Sigue así, vas por excelente camino.';
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'level_up':
        return 'from-purple-600 to-indigo-600';
      case 'achievement_unlocked':
        return 'from-yellow-500 to-orange-600';
      case 'streak_milestone':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-blue-500 to-cyan-600';
    }
  };

  if (!isVisible || !currentEvent) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-pulse">
      <div className={`bg-gradient-to-r ${getEventColor(currentEvent.event_type)} rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                {getEventIcon(currentEvent.event_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {getEventTitle(currentEvent.event_type, currentEvent.event_data)}
                </h3>
                <p className="text-sm text-white/90">
                  {new Date(currentEvent.created_at).toLocaleDateString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-white/95 mb-4">
            {getEventDescription(currentEvent.event_type, currentEvent.event_data)}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">
                {currentEvent.event_type === 'achievement_unlocked' && 
                  `+${currentEvent.event_data?.points_reward || 0} puntos`}
                {currentEvent.event_type === 'level_up' && 
                  `Nivel ${currentEvent.event_data?.new_level || 'Superior'}`}
                {currentEvent.event_type === 'streak_milestone' && 
                  '¡Racha mantenido!'}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              ¡Genial!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar notificaciones de puntos
export  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'message_sent':
        return <GiftIcon className="h-5 w-5 text-green-600" />;
      case 'message_read':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'file_uploaded':
        return <StarIcon className="h-5 w-5 text-purple-600" />;
      case 'daily_login':
        return <FireIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-indigo-600" />;
    }
  };

  const getActivityText = (activityType) => {
    switch (activityType) {
      case 'message_sent':
        return 'Mensaje enviado';
      case 'message_read':
        return 'Mensaje leído';
      case 'file_uploaded':
        return 'Archivo subido';
      case 'daily_login':
        return 'Inicio de sesión diario';
      default:
        return 'Actividad completada';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-bounce">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-green-200 flex items-center space-x-3">
        <div className="bg-green-100 p-2 rounded-xl">
          {getActivityIcon(activity)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            +{points} puntos - {getActivityText(activity)}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Hook personalizado para manejar notificaciones de gamificación
export  const showPointsNotification = (points, activity) => {
    setPointsNotification({
      isVisible: true,
      points,
      activity
    });

    // Auto ocultar después de 3 segundos
    setTimeout(() => {
      setPointsNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const hidePointsNotification = () => {
    setPointsNotification(prev => ({ ...prev, isVisible: false }));
  };

  return {
    pointsNotification,
    showPointsNotification,
    hidePointsNotification
  };
};

export default AchievementNotification;