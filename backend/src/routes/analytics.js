// ================================
// ANALYTICS ROUTES - backend/src/routes/analytics.js
// Routes complètes pour le système d'analytics
// ================================

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');
const AnalyticsService = require('../services/analyticsService');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// ================================
// 📊 DASHBOARD ANALYTICS PRINCIPAL
// ================================

router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;
    
    console.log(`📊 Analytics dashboard requested for user ${userId}, period: ${period}`);
    
    const now = new Date();
    const dateRange = getDateRange(period);
    
    // Calculer toutes les métriques en parallèle pour optimiser les performances
    const [
      basicStats,
      earningsData,
      performanceMetrics,
      trustMetrics,
      predictions,
      insights
    ] = await Promise.all([
      AnalyticsService.calculateBasicStats(userId),
      AnalyticsService.calculateEarnings(userId, dateRange.start, dateRange.end),
      AnalyticsService.calculatePerformanceMetrics(userId, dateRange.start),
      AnalyticsService.calculateTrustMetrics(userId),
      AnalyticsService.calculatePredictions(userId),
      AnalyticsService.generatePersonalizedInsights(userId)
    ]);

    res.json({
      success: true,
      analytics: {
        // Statistiques de base
        basic: basicStats,
        
        // Données financières
        earnings: earningsData,
        
        // Métriques de performance
        performance: performanceMetrics,
        
        // Métriques de confiance
        trust: trustMetrics,
        
        // Prédictions IA
        predictions,
        
        // Insights personnalisés
        insights,
        
        // Métadonnées
        metadata: {
          lastUpdated: now,
          period: period,
          dataQuality: 'high',
          userId: userId
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur analytics dashboard:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ================================
// 📈 HISTORIQUE DÉTAILLÉ DES TRANSACTIONS
// ================================

router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      type,        // 'sent', 'transported', 'all'
      status,      // 'completed', 'cancelled', 'all' 
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`📈 Transactions requested for user ${userId}`);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construction de la requête avec filtres
    const whereConditions = buildTransactionFilters(userId, type, status, dateFrom, dateTo);
    
    // Récupérer les transactions avec détails complets
    const [transactions, totalCount] = await Promise.all([
      prisma.item.findMany({
        where: whereConditions,
        include: {
          trip: {
            include: {
              user: {
                select: {
                  id: true, fullName: true, rating: true, 
                  totalRatings: true, profilePicture: true
                }
              }
            }
          },
          user: {
            select: {
              id: true, fullName: true, rating: true,
              totalRatings: true, profilePicture: true
            }
          },
          reviews: {
            include: {
              author: {
                select: { id: true, fullName: true, profilePicture: true }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip: offset
      }),
      
      prisma.item.count({ where: whereConditions })
    ]);

    // Enrichir avec calculs financiers
    const enrichedTransactions = await enrichTransactionsWithFinancials(transactions);
    const summary = await calculateTransactionsSummary(whereConditions);

    res.json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        },
        summary,
        filters: {
          type, status, dateFrom, dateTo, sortBy, sortOrder
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur transactions:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des transactions' 
    });
  }
});

// ================================
// 💰 WALLET & PORTEFEUILLE DÉTAILLÉ
// ================================

router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    console.log(`💰 Wallet data requested for user ${userId}`);

    const dateRange = getDateRange(period);
    
    // Calculs financiers détaillés
    const [
      balance,
      earnings,
      expenses,
      transactions,
      projections
    ] = await Promise.all([
      AnalyticsService.calculateCurrentBalance(userId),
      AnalyticsService.calculateEarningsBreakdown(userId, dateRange),
      AnalyticsService.calculateExpensesBreakdown(userId, dateRange),
      getRecentFinancialTransactions(userId, 10),
      AnalyticsService.calculateFinancialProjections(userId)
    ]);

    res.json({
      success: true,
      wallet: {
        // Solde actuel
        currentBalance: balance,
        
        // Revenus détaillés
        earnings: {
          total: earnings.total,
          breakdown: earnings.breakdown,
          trends: earnings.trends
        },
        
        // Dépenses détaillées
        expenses: {
          total: expenses.total,
          breakdown: expenses.breakdown,
          trends: expenses.trends
        },
        
        // Transactions récentes
        recentTransactions: transactions,
        
        // Projections
        projections: {
          nextMonth: projections.nextMonth,
          nextQuarter: projections.nextQuarter,
          confidence: projections.confidence
        },
        
        // Métriques financières
        metrics: {
          profitMargin: calculateProfitMargin(earnings.total, expenses.total),
          avgTransactionValue: earnings.avgTransactionValue || 0,
          growthRate: earnings.monthlyGrowthRate || 0
        },
        
        // Métadonnées
        metadata: {
          period,
          lastUpdated: new Date(),
          currency: 'EUR'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur wallet:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul du portefeuille' 
    });
  }
});

// ================================
// 🎯 MÉTRIQUES DE PERFORMANCE PUBLIQUE
// ================================

router.get('/public-stats/:userId?', async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    
    console.log(`🎯 Public stats requested for user ${targetUserId}`);

    // Vérifier si l'utilisateur existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, fullName: true, rating: true, totalRatings: true,
        identityVerified: true, emailVerified: true, createdAt: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Calculer les stats publiques (sans données sensibles)
    const [publicStats, badges, achievements] = await Promise.all([
      AnalyticsService.calculatePublicStats(targetUserId),
      AnalyticsService.calculateUserBadges(targetUserId),
      AnalyticsService.calculateAchievements(targetUserId)
    ]);

    res.json({
      success: true,
      publicProfile: {
        user: targetUser,
        stats: publicStats,
        badges,
        achievements,
        isOwnProfile: targetUserId === req.user.id
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats publiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des statistiques publiques' 
    });
  }
});

// ================================
// 📊 TRACKING D'ÉVÉNEMENTS (Analytics Comportementales)
// ================================

router.post('/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      eventType, 
      eventData = {}, 
      page, 
      timestamp = new Date(),
      sessionId,
      metadata = {}
    } = req.body;

    // Validation des événements autorisés
    const allowedEvents = [
      'page_view', 'click', 'search', 'filter', 'sort',
      'create_trip', 'create_parcel', 'send_message',
      'view_profile', 'bookmark', 'share', 'error',
      'login', 'logout', 'payment', 'review_submit'
    ];

    if (!allowedEvents.includes(eventType)) {
      return res.status(400).json({ 
        error: 'Type d\'événement non autorisé',
        allowedEvents 
      });
    }

    // Stocker l'événement
    const eventRecord = await AnalyticsService.logUserEvent({
      userId,
      eventType,
      eventData,
      page,
      timestamp: new Date(timestamp),
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      metadata
    });

    // Mettre à jour les métriques en temps réel si nécessaire
    await AnalyticsService.updateRealTimeMetrics(userId, eventType, eventData);

    res.json({ 
      success: true, 
      tracked: true,
      eventId: eventRecord.id || 'tracked'
    });

  } catch (error) {
    console.error('❌ Erreur tracking événement:', error);
    // Ne pas faire échouer la requête pour le tracking
    res.json({ 
      success: false, 
      tracked: false,
      error: 'Event tracking failed'
    });
  }
});

// ================================
// 🔍 INSIGHTS & RECOMMANDATIONS IA
// ================================

router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`🔍 Insights requested for user ${userId}`);

    const insights = await AnalyticsService.generatePersonalizedInsights(userId);
    
    res.json({
      success: true,
      insights: {
        // Recommandations de pricing
        pricing: insights.pricing,
        
        // Opportunités de routes
        routes: insights.routes,
        
        // Optimisations temporelles
        timing: insights.timing,
        
        // Améliorations profil
        profile: insights.profile,
        
        // Prédictions marché
        market: insights.market,
        
        // Plan d'action personnalisé
        actionPlan: insights.actionPlan || [],
        
        // Métadonnées
        metadata: {
          generatedAt: new Date(),
          confidence: insights.confidence || 'medium',
          dataPoints: insights.dataPoints || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur insights:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération des insights' 
    });
  }
});

// ================================
// 📱 ANALYTICS OPTIMISÉES MOBILE
// ================================

router.get('/mobile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📱 Mobile analytics requested for user ${userId}`);

    // Version allégée pour mobile
    const mobileAnalytics = await AnalyticsService.getMobileOptimizedAnalytics(userId);

    res.json({
      success: true,
      mobile: true,
      analytics: mobileAnalytics
    });

  } catch (error) {
    console.error('❌ Erreur analytics mobile:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des analytics mobile' 
    });
  }
});

// ================================
// 📊 EXPORT DE DONNÉES
// ================================

router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = 'json', period = '30d' } = req.query;

    console.log(`📊 Data export requested for user ${userId}, format: ${format}`);

    const dateRange = getDateRange(period);
    
    // Récupérer toutes les données pour export
    const exportData = await AnalyticsService.generateExportData(userId, dateRange);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cheapship-analytics-${userId}-${period}.csv"`);
      res.send(convertToCSV(exportData));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="cheapship-analytics-${userId}-${period}.json"`);
      res.json({
        success: true,
        export: exportData,
        metadata: {
          userId,
          period,
          exportedAt: new Date(),
          format
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur export:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'export des données' 
    });
  }
});

// ================================
// 🚀 FONCTIONS UTILITAIRES
// ================================

function getDateRange(period) {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
}

function buildTransactionFilters(userId, type, status, dateFrom, dateTo) {
  const baseCondition = {
    OR: [
      { userId }, // Colis envoyés par l'utilisateur
      { trip: { userId } } // Colis transportés par l'utilisateur
    ]
  };

  // Filtrer par type
  if (type === 'sent') {
    baseCondition.OR = [{ userId }];
  } else if (type === 'transported') {
    baseCondition.OR = [{ trip: { userId } }];
  }

  // Filtrer par statut
  if (status && status !== 'all') {
    baseCondition.status = status.toUpperCase();
  }

  // Filtrer par dates
  if (dateFrom || dateTo) {
    baseCondition.createdAt = {};
    if (dateFrom) {
      baseCondition.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      baseCondition.createdAt.lte = new Date(dateTo);
    }
  }

  return baseCondition;
}

async function enrichTransactionsWithFinancials(transactions) {
  return transactions.map(transaction => ({
    ...transaction,
    financials: {
      revenue: transaction.trip ? 
        (transaction.weight * transaction.trip.pricePerKg) : 0,
      commission: transaction.trip ? 
        (transaction.weight * transaction.trip.pricePerKg * 0.15) : 0,
      net: transaction.trip ? 
        (transaction.weight * transaction.trip.pricePerKg * 0.85) : 0
    }
  }));
}

async function calculateTransactionsSummary(whereConditions) {
  const [total, completed, cancelled] = await Promise.all([
    prisma.item.count({ where: whereConditions }),
    prisma.item.count({ 
      where: { ...whereConditions, status: 'DELIVERED' }
    }),
    prisma.item.count({ 
      where: { ...whereConditions, status: 'CANCELLED' }
    })
  ]);

  return {
    total,
    completed,
    cancelled,
    pending: total - completed - cancelled,
    successRate: total > 0 ? (completed / total) * 100 : 0
  };
}

async function getRecentFinancialTransactions(userId, limit) {
  return await prisma.item.findMany({
    where: {
      OR: [
        { userId },
        { trip: { userId } }
      ],
      status: 'DELIVERED'
    },
    include: {
      trip: {
        select: {
          pricePerKg: true,
          departureCity: true,
          arrivalCity: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: limit
  });
}

function calculateProfitMargin(earnings, expenses) {
  if (earnings === 0) return 0;
  return ((earnings - expenses) / earnings) * 100;
}

function convertToCSV(data) {
  // Fonction simple de conversion JSON vers CSV
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

module.exports = router;