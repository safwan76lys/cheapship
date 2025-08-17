const AnalyticsService = require('../services/analyticsService');

// Middleware pour tracker automatiquement les événements
const trackEvent = (eventType) => {
  return async (req, res, next) => {
    // Stocker l'info pour tracking après la réponse
    res.locals.trackEvent = {
      eventType,
      userId: req.user?.id,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    };
    
    next();
  };
};

// Middleware qui exécute le tracking après la réponse
const executeTracking = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Envoyer la réponse d'abord
    originalSend.call(this, data);
    
    // Puis tracker de manière asynchrone
    if (res.locals.trackEvent && res.statusCode < 400) {
      setImmediate(async () => {
        try {
          await AnalyticsService.logUserEvent({
            ...res.locals.trackEvent,
            timestamp: new Date(),
            success: res.statusCode < 400,
            responseTime: Date.now() - req.startTime
          });
        } catch (error) {
          console.error('❌ Erreur tracking événement:', error);
        }
      });
    }
  };
  
  req.startTime = Date.now();
  next();
};

module.exports = {
  trackEvent,
  executeTracking
};
