// ================================
// ANALYTICS SERVICE - backend/src/services/analyticsService.js
// Service complet pour toutes les fonctions analytics
// ================================

const prisma = require('../config/database');

class AnalyticsService {
  
  // ================================
  // 📊 CALCULS DE BASE
  // ================================

  static async calculateBasicStats(userId) {
    try {
      const [tripsCount, parcelsCount, totalReviews, user] = await Promise.all([
        prisma.trip.count({ where: { userId } }),
        prisma.item.count({ where: { userId } }),
        prisma.review.count({ where: { receiverId: userId } }),
        prisma.user.findUnique({ 
          where: { id: userId }, 
          select: { createdAt: true } 
        })
      ]);

      return {
        totalTripsPublished: tripsCount,
        totalParcelsSent: parcelsCount,
        totalReviews: totalReviews,
        memberSince: user?.createdAt || new Date(),
        accountAge: this.calculateAccountAge(user?.createdAt),
        joinedDaysAgo: this.calculateDaysAgo(user?.createdAt)
      };
    } catch (error) {
      console.error('❌ Erreur calcul stats de base:', error);
      return this.getDefaultBasicStats();
    }
  }

  static async calculateEarnings(userId, startDate, endDate) {
    try {
      // Récupérer tous les voyages complétés avec des colis
      const completedTrips = await prisma.trip.findMany({
        where: { 
          userId, 
          status: 'COMPLETED',
          items: { some: { status: 'DELIVERED' } },
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { 
          items: {
            where: { status: 'DELIVERED' },
            select: { weight: true, createdAt: true, updatedAt: true }
          }
        }
      });

      let totalEarnings = 0;
      let earningsHistory = [];
      const monthlyEarnings = {};

      completedTrips.forEach(trip => {
        const tripEarnings = trip.items.reduce((sum, item) => 
          sum + (item.weight * trip.pricePerKg), 0
        );
        
        totalEarnings += tripEarnings;
        
        const completionDate = new Date(trip.updatedAt);
        const monthKey = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyEarnings[monthKey]) {
          monthlyEarnings[monthKey] = 0;
        }
        monthlyEarnings[monthKey] += tripEarnings;

        earningsHistory.push({
          date: completionDate,
          amount: tripEarnings,
          tripId: trip.id,
          itemsCount: trip.items.length
        });
      });

      // Calculer la croissance mensuelle
      const monthKeys = Object.keys(monthlyEarnings).sort();
      let monthlyGrowth = 0;
      
      if (monthKeys.length >= 2) {
        const currentMonth = monthlyEarnings[monthKeys[monthKeys.length - 1]];
        const previousMonth = monthlyEarnings[monthKeys[monthKeys.length - 2]];
        
        if (previousMonth > 0) {
          monthlyGrowth = ((currentMonth - previousMonth) / previousMonth) * 100;
        }
      }

      return {
        total: totalEarnings,
        thisMonth: monthlyEarnings[monthKeys[monthKeys.length - 1]] || 0,
        thisYear: Object.values(monthlyEarnings).reduce((sum, val) => sum + val, 0),
        avgPerTrip: completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        earningsHistory: earningsHistory.sort((a, b) => new Date(a.date) - new Date(b.date)),
        avgMonthlyEarnings: monthKeys.length > 0 ? totalEarnings / monthKeys.length : 0,
        monthlyBreakdown: monthlyEarnings
      };
    } catch (error) {
      console.error('❌ Erreur calcul revenus:', error);
      return this.getDefaultEarnings();
    }
  }

  static async calculatePerformanceMetrics(userId, since) {
    try {
      const [
        userTransactions,
        transporterTransactions,
        responseTimeData
      ] = await Promise.all([
        // Colis envoyés par l'utilisateur
        prisma.item.findMany({
          where: { 
            userId,
            createdAt: { gte: since }
          },
          select: { status: true, createdAt: true, updatedAt: true }
        }),
        
        // Colis transportés par l'utilisateur
        prisma.item.findMany({
          where: { 
            trip: { userId },
            createdAt: { gte: since }
          },
          select: { status: true, createdAt: true, updatedAt: true }
        }),
        
        // Données pour temps de réponse
        this.calculateResponseTimeData(userId, since)
      ]);

      const allTransactions = [...userTransactions, ...transporterTransactions];
      const totalTransactions = allTransactions.length;
      
      const successfulTransactions = allTransactions.filter(
        t => t.status === 'DELIVERED'
      ).length;

      const cancelledTransactions = allTransactions.filter(
        t => t.status === 'CANCELLED'
      ).length;

      const successRate = totalTransactions > 0 ? 
        (successfulTransactions / totalTransactions) * 100 : 0;

      const cancelationRate = totalTransactions > 0 ?
        (cancelledTransactions / totalTransactions) * 100 : 0;

      const avgResponseTime = responseTimeData.avgHours || 2;
      const reliabilityScore = this.calculateReliabilityScore(successRate, avgResponseTime);

      // Calculer le taux de livraison à temps
      const onTimeDeliveries = allTransactions.filter(t => {
        if (t.status !== 'DELIVERED') return false;
        // Logique simplifiée - considérer à temps si livré dans les 24h de la mise à jour
        const deliveryTime = new Date(t.updatedAt) - new Date(t.createdAt);
        return deliveryTime <= (24 * 60 * 60 * 1000); // 24 heures en millisecondes
      }).length;

      const onTimeDeliveryRate = successfulTransactions > 0 ? 
        (onTimeDeliveries / successfulTransactions) * 100 : 0;

      return {
        successRate: Math.round(successRate * 10) / 10,
        totalTransactions,
        successfulTransactions,
        cancelledTransactions,
        avgResponseTime: `${Math.round(avgResponseTime)}h`,
        reliability: reliabilityScore,
        cancelationRate: Math.round(cancelationRate * 10) / 10,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
        efficiency: this.calculateEfficiencyScore(successRate, avgResponseTime, onTimeDeliveryRate)
      };
    } catch (error) {
      console.error('❌ Erreur calcul performance:', error);
      return this.getDefaultPerformance();
    }
  }

  static async calculateTrustMetrics(userId) {
    try {
      const [user, recentActivity, verificationData] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { 
            rating: true, 
            totalRatings: true, 
            identityVerified: true, 
            emailVerified: true,
            phoneVerified: true,
            createdAt: true
          }
        }),
        this.hasRecentActivity(userId),
        this.getVerificationDetails(userId)
      ]);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      let trustScore = 0;
      
      // Score basé sur la note (40%)
      if (user.rating > 0) {
        trustScore += (user.rating / 5) * 40;
      }
      
      // Bonus vérifications (30%)
      if (user.identityVerified) trustScore += 15;
      if (user.emailVerified) trustScore += 10;
      if (user.phoneVerified) trustScore += 5;
      
      // Bonus nombre d'avis (20%)
      if (user.totalRatings >= 50) trustScore += 20;
      else if (user.totalRatings >= 20) trustScore += 18;
      else if (user.totalRatings >= 10) trustScore += 15;
      else if (user.totalRatings >= 5) trustScore += 10;
      else if (user.totalRatings >= 1) trustScore += 5;
      
      // Bonus activité récente (10%)
      if (recentActivity) trustScore += 10;

      const verificationLevel = this.calculateVerificationLevel(user);
      const trustBadges = this.calculateTrustBadges(user, trustScore);

      return {
        trustScore: Math.min(100, Math.round(trustScore)),
        verificationLevel,
        ratingQuality: user.totalRatings >= 10 ? 'high' : 
                       user.totalRatings >= 3 ? 'medium' : 'low',
        trustBadges,
        verificationDetails: verificationData,
        accountMaturity: this.calculateAccountMaturity(user.createdAt),
        ratingBreakdown: {
          current: user.rating,
          total: user.totalRatings,
          target: 5.0,
          progress: user.rating / 5 * 100
        }
      };
    } catch (error) {
      console.error('❌ Erreur calcul confiance:', error);
      return this.getDefaultTrust();
    }
  }

  // ================================
  // 🔮 PRÉDICTIONS & IA
  // ================================

  static async calculatePredictions(userId) {
    try {
      const [
        historicalData,
        marketTrends,
        userBehavior,
        seasonalityData
      ] = await Promise.all([
        this.getHistoricalEarnings(userId, 6), // 6 derniers mois
        this.getMarketTrends(),
        this.getUserBehaviorPatterns(userId),
        this.getSeasonalityData()
      ]);

      // Prédiction des revenus (modèle simplifié)
      const nextMonthEarnings = this.predictNextMonthEarnings(
        historicalData, marketTrends, seasonalityData
      );

      // Prédiction de la demande
      const demandGrowth = this.predictDemandGrowth(
        userBehavior, marketTrends
      );

      // Calcul de la confiance du modèle
      const confidence = this.calculatePredictionConfidence(
        historicalData, userBehavior
      );

      return {
        nextMonthEarnings: Math.round(nextMonthEarnings),
        demandGrowth: Math.round(demandGrowth),
        confidence: Math.round(confidence),
        marketTrend: marketTrends.overall,
        bestOpportunities: await this.identifyBestOpportunities(userId),
        riskFactors: this.identifyRiskFactors(historicalData, userBehavior),
        recommendations: this.generatePredictionRecommendations(historicalData, demandGrowth)
      };
    } catch (error) {
      console.error('❌ Erreur calcul prédictions:', error);
      return this.getDefaultPredictions();
    }
  }

  static async generatePersonalizedInsights(userId) {
    try {
      const [
        pricingInsights,
        routeInsights,
        timingInsights,
        profileInsights,
        marketInsights
      ] = await Promise.all([
        this.generatePricingInsights(userId),
        this.generateRouteInsights(userId),
        this.generateTimingInsights(userId),
        this.generateProfileInsights(userId),
        this.generateMarketInsights(userId)
      ]);

      return {
        pricing: pricingInsights,
        routes: routeInsights,
        timing: timingInsights,
        profile: profileInsights,
        market: marketInsights,
        actionPlan: this.generateActionPlan({
          pricing: pricingInsights,
          routes: routeInsights,
          timing: timingInsights,
          profile: profileInsights
        }),
        confidence: this.calculateInsightsConfidence(pricingInsights, routeInsights)
      };
    } catch (error) {
      console.error('❌ Erreur génération insights:', error);
      return this.getDefaultInsights();
    }
  }

  // ================================
  // 💰 CALCULS FINANCIERS DÉTAILLÉS
  // ================================

  static async calculateCurrentBalance(userId) {
    try {
      // Dans un vrai système, vous auriez une table wallet/transactions
      // Pour la démo, on calcule basé sur les revenus moins les frais
      const earnings = await this.getTotalEarnings(userId);
      const fees = await this.getTotalFees(userId);
      const withdrawals = await this.getTotalWithdrawals(userId);

      return {
        available: Math.max(0, earnings - fees - withdrawals),
        pending: await this.getPendingEarnings(userId),
        total: earnings,
        fees: fees,
        withdrawals: withdrawals,
        lastTransaction: await this.getLastTransaction(userId)
      };
    } catch (error) {
      console.error('❌ Erreur calcul balance:', error);
      return { available: 0, pending: 0, total: 0, fees: 0, withdrawals: 0 };
    }
  }

  static async calculateEarningsBreakdown(userId, dateRange) {
    try {
      const completedTrips = await prisma.trip.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          updatedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        include: { items: true }
      });

      const breakdown = {
        transport: 0,
        bonuses: 0,
        tips: 0,
        total: 0
      };

      const trends = [];
      const monthlyData = {};

      completedTrips.forEach(trip => {
        const earnings = trip.items.reduce((sum, item) => 
          sum + (item.weight * trip.pricePerKg), 0
        );
        
        breakdown.transport += earnings;
        breakdown.total += earnings;

        // Grouper par mois pour les tendances
        const month = new Date(trip.updatedAt).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += earnings;
      });

      // Calculer les tendances mensuelles
      Object.keys(monthlyData).sort().forEach(month => {
        trends.push({
          period: month,
          amount: monthlyData[month],
          transactions: completedTrips.filter(trip => 
            trip.updatedAt.toISOString().startsWith(month)
          ).length
        });
      });

      return {
        breakdown,
        trends,
        avgPerTransaction: breakdown.total / completedTrips.length || 0,
        growth: this.calculateGrowthRate(trends)
      };
    } catch (error) {
      console.error('❌ Erreur earnings breakdown:', error);
      return {
        breakdown: { transport: 0, bonuses: 0, tips: 0, total: 0 },
        trends: [],
        avgPerTransaction: 0,
        growth: 0
      };
    }
  }

  static async calculateExpensesBreakdown(userId, dateRange) {
    try {
      // Dans un vrai système, vous auriez une table expenses
      // Pour la démo, on simule avec des calculs
      const trips = await prisma.trip.count({
        where: {
          userId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      });

      const breakdown = {
        platform_fees: trips * 2.5, // 2.5€ par voyage
        fuel: trips * 15, // Estimation carburant
        maintenance: trips * 5, // Estimation entretien
        insurance: trips * 3, // Estimation assurance
        total: 0
      };

      breakdown.total = Object.values(breakdown).reduce((sum, val) => sum + val, 0) - breakdown.total;

      return {
        breakdown,
        trends: this.generateExpenseTrends(dateRange, trips),
        avgPerTrip: breakdown.total / trips || 0
      };
    } catch (error) {
      console.error('❌ Erreur expenses breakdown:', error);
      return {
        breakdown: { platform_fees: 0, fuel: 0, maintenance: 0, insurance: 0, total: 0 },
        trends: [],
        avgPerTrip: 0
      };
    }
  }

  static async calculateFinancialProjections(userId) {
    try {
      const historicalData = await this.getHistoricalEarnings(userId, 6);
      
      if (historicalData.length < 3) {
        return {
          nextMonth: 0,
          nextQuarter: 0,
          confidence: 'low'
        };
      }

      // Modèle de prédiction simple basé sur la tendance
      const trend = this.calculateTrend(historicalData);
      const lastMonth = historicalData[historicalData.length - 1]?.amount || 0;
      
      const nextMonth = Math.max(0, lastMonth + (lastMonth * trend / 100));
      const nextQuarter = nextMonth * 3 * (1 + trend / 100);

      return {
        nextMonth: Math.round(nextMonth),
        nextQuarter: Math.round(nextQuarter),
        confidence: historicalData.length >= 6 ? 'high' : 'medium',
        trend: trend > 0 ? 'growing' : 'declining',
        trendPercentage: Math.round(trend * 10) / 10
      };
    } catch (error) {
      console.error('❌ Erreur projections financières:', error);
      return {
        nextMonth: 0,
        nextQuarter: 0,
        confidence: 'low'
      };
    }
  }

  // ================================
  // 📈 STATISTIQUES PUBLIQUES
  // ================================

  static async calculatePublicStats(userId) {
    try {
      const [
        basicStats,
        publicPerformance,
        achievements,
        recentActivity
      ] = await Promise.all([
        this.calculateBasicStats(userId),
        this.calculatePublicPerformance(userId),
        this.calculateAchievements(userId),
        this.getPublicRecentActivity(userId)
      ]);

      return {
        stats: {
          totalTrips: basicStats.totalTripsPublished,
          totalParcels: basicStats.totalParcelsSent,
          successRate: publicPerformance.successRate,
          avgResponseTime: publicPerformance.avgResponseTime,
          memberSince: basicStats.memberSince
        },
        achievements,
        recentActivity: recentActivity.slice(0, 5) // Limiter à 5 pour public
      };
    } catch (error) {
      console.error('❌ Erreur stats publiques:', error);
      return this.getDefaultPublicStats();
    }
  }

  // ================================
  // 🎯 BADGES & ACHIEVEMENTS
  // ================================

  static async calculateUserBadges(userId) {
    try {
      const [stats, performance, trust] = await Promise.all([
        this.calculateBasicStats(userId),
        this.calculatePublicPerformance(userId),
        this.calculateTrustMetrics(userId)
      ]);

      const badges = [];

      // Badges basés sur l'activité
      if (stats.totalTripsPublished >= 100) {
        badges.push({ type: 'super_transporter', level: 'gold', unlocked: true });
      } else if (stats.totalTripsPublished >= 50) {
        badges.push({ type: 'super_transporter', level: 'silver', unlocked: true });
      } else if (stats.totalTripsPublished >= 10) {
        badges.push({ type: 'super_transporter', level: 'bronze', unlocked: true });
      }

      // Badges basés sur la performance
      if (performance.successRate >= 98) {
        badges.push({ type: 'reliability_expert', level: 'gold', unlocked: true });
      } else if (performance.successRate >= 95) {
        badges.push({ type: 'reliability_expert', level: 'silver', unlocked: true });
      }

      // Badges basés sur la confiance
      if (trust.trustScore >= 90) {
        badges.push({ type: 'trusted_member', level: 'gold', unlocked: true });
      } else if (trust.trustScore >= 70) {
        badges.push({ type: 'trusted_member', level: 'silver', unlocked: true });
      }

      return badges;
    } catch (error) {
      console.error('❌ Erreur calcul badges:', error);
      return [];
    }
  }

  static async calculateAchievements(userId) {
    try {
      const achievements = [];
      
      // Exemples d'achievements
      const stats = await this.calculateBasicStats(userId);
      
      if (stats.totalTripsPublished >= 1) {
        achievements.push({
          id: 'first_trip',
          title: 'Premier voyage',
          description: 'Vous avez publié votre premier voyage',
          icon: '🚀',
          unlockedAt: new Date(),
          rarity: 'common'
        });
      }

      if (stats.totalTripsPublished >= 10) {
        achievements.push({
          id: 'experienced_traveler',
          title: 'Voyageur expérimenté',
          description: '10 voyages publiés',
          icon: '🎯',
          unlockedAt: new Date(),
          rarity: 'uncommon'
        });
      }

      return achievements;
    } catch (error) {
      console.error('❌ Erreur calcul achievements:', error);
      return [];
    }
  }

  // ================================
  // 🎯 INSIGHTS GÉNÉRATION AVANCÉE
  // ================================

  static async generatePricingInsights(userId) {
    try {
      const userTrips = await prisma.trip.findMany({
        where: { userId, status: 'COMPLETED' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      if (userTrips.length === 0) {
        return {
          optimal: 0,
          current: 0,
          recommendation: 'start_pricing',
          confidence: 'low'
        };
      }

      const avgUserPrice = userTrips.reduce((sum, trip) => sum + trip.pricePerKg, 0) / userTrips.length;
      const marketData = await this.getMarketPricingData();
      const marketAverage = marketData.averagePrice;
      
      let optimalPrice = avgUserPrice;
      let recommendation = 'maintain';

      // Algorithme de prix optimal simplifié
      if (avgUserPrice < marketAverage * 0.8) {
        optimalPrice = marketAverage * 0.9;
        recommendation = 'increase';
      } else if (avgUserPrice > marketAverage * 1.2) {
        optimalPrice = marketAverage * 1.1;
        recommendation = 'decrease';
      }

      const potentialIncrease = ((optimalPrice - avgUserPrice) / avgUserPrice) * 100;

      return {
        current: Math.round(avgUserPrice * 100) / 100,
        optimal: Math.round(optimalPrice * 100) / 100,
        marketAverage: Math.round(marketAverage * 100) / 100,
        recommendation,
        potentialIncrease: Math.round(potentialIncrease),
        confidence: userTrips.length >= 10 ? 'high' : 'medium'
      };
    } catch (error) {
      console.error('❌ Erreur pricing insights:', error);
      return this.getDefaultInsights().pricing;
    }
  }

  static async generateRouteInsights(userId) {
    try {
      const [userRoutes, trendingRoutes] = await Promise.all([
        this.getUserRouteHistory(userId),
        this.getTrendingRoutes()
      ]);

      const recommendations = [];
      
      // Analyser les routes tendances vs routes utilisateur
      trendingRoutes.forEach(trendRoute => {
        const userExperience = userRoutes.find(ur => 
          ur.route === `${trendRoute.departure}-${trendRoute.arrival}`
        );

        if (!userExperience) {
          recommendations.push({
            route: trendRoute.route,
            demand: trendRoute.demand,
            avgPrice: trendRoute.avgPrice,
            reason: 'new_opportunity',
            confidence: trendRoute.confidence
          });
        }
      });

      return {
        trending: trendingRoutes.slice(0, 5),
        recommended: recommendations.slice(0, 3),
        userFavorites: userRoutes.slice(0, 3),
        insights: this.generateRouteInsightsText(recommendations)
      };
    } catch (error) {
      console.error('❌ Erreur route insights:', error);
      return this.getDefaultInsights().routes;
    }
  }

  // ================================
  // 📱 OPTIMISATIONS MOBILE
  // ================================

  static async getMobileOptimizedAnalytics(userId) {
    try {
      // Version allégée pour mobile
      const [basicStats, quickMetrics, recentActivity] = await Promise.all([
        this.calculateBasicStats(userId),
        this.getQuickMetrics(userId),
        this.getRecentActivity(userId, 5)
      ]);

      return {
        basic: basicStats,
        quick: quickMetrics,
        recent: recentActivity,
        optimized: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Erreur analytics mobile:', error);
      return this.getMobileDefaults();
    }
  }

  static async getQuickMetrics(userId) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [earnings, performance] = await Promise.all([
      this.calculateEarnings(userId, last30Days, new Date()),
      this.calculatePerformanceMetrics(userId, last30Days)
    ]);

    return {
      monthlyEarnings: earnings.thisMonth,
      successRate: performance.successRate,
      responseTime: performance.avgResponseTime,
      totalTransactions: performance.totalTransactions
    };
  }

  // ================================
  // 🔧 FONCTIONS UTILITAIRES PRIVÉES
  // ================================

  static calculateAccountAge(createdAt) {
    if (!createdAt) return 0;
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // jours
  }

  static calculateDaysAgo(createdAt) {
    if (!createdAt) return 0;
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static calculateVerificationLevel(user) {
    let score = 0;
    if (user.emailVerified) score += 1;
    if (user.phoneVerified) score += 1;
    if (user.identityVerified) score += 2;
    
    if (score >= 4) return 'platinum';
    if (score >= 3) return 'gold';
    if (score >= 2) return 'silver';
    return 'bronze';
  }

  static calculateReliabilityScore(successRate, avgResponseTime) {
    let score = successRate * 0.7; // 70% basé sur le taux de succès
    
    // Bonus/malus basé sur le temps de réponse
    if (avgResponseTime <= 2) score += 15;
    else if (avgResponseTime <= 6) score += 10;
    else if (avgResponseTime <= 12) score += 5;
    else score -= 10;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  static calculateEfficiencyScore(successRate, avgResponseTime, onTimeRate) {
    const efficiency = (successRate * 0.4) + (onTimeRate * 0.4) + 
                      ((avgResponseTime <= 2 ? 100 : 100 - avgResponseTime * 5) * 0.2);
    return Math.min(100, Math.max(0, Math.round(efficiency)));
  }

  static async hasRecentActivity(userId, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const recentCount = await prisma.trip.count({
        where: {
          userId,
          createdAt: { gte: since }
        }
      });

      return recentCount > 0;
    } catch (error) {
      return false;
    }
  }

  // ================================
  // 📊 DONNÉES SIMULÉES (pour la démo)
  // ================================

  static async getMarketTrends() {
    // Simulation de données marché
    return {
      overall: 'growing',
      demandGrowth: 15,
      averagePrice: 1.2,
      opportunities: [
        'Route Paris-Lyon en forte demande',
        'Week-ends +30% de réservations',
        'Colis urgents premium en croissance'
      ],
      threats: [
        'Concurrence accrue sur Lyon-Marseille',
        'Nouveaux entrants avec prix agressifs'
      ],
      predictions: {
        nextMonth: 'stable_growth',
        nextQuarter: 'strong_growth'
      }
    };
  }

  static async getMarketPricingData() {
    return {
      averagePrice: 1.2,
      minPrice: 0.8,
      maxPrice: 2.0,
      recommendedRange: { min: 1.0, max: 1.5 }
    };
  }

  static async getTrendingRoutes() {
    return [
      { route: 'Paris-Lyon', departure: 'Paris', arrival: 'Lyon', demand: 85, avgPrice: 1.3, confidence: 'high' },
      { route: 'Lyon-Marseille', departure: 'Lyon', arrival: 'Marseille', demand: 78, avgPrice: 1.1, confidence: 'high' },
      { route: 'Paris-Toulouse', departure: 'Paris', arrival: 'Toulouse', demand: 72, avgPrice: 1.4, confidence: 'medium' }
    ];
  }

  static async getUserRouteHistory(userId) {
    try {
      const trips = await prisma.trip.findMany({
        where: { userId },
        select: { departureCity: true, arrivalCity: true }
      });

      const routeCount = {};
      trips.forEach(trip => {
        const route = `${trip.departureCity}-${trip.arrivalCity}`;
        routeCount[route] = (routeCount[route] || 0) + 1;
      });

      return Object.entries(routeCount)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      return [];
    }
  }

  static async calculateResponseTimeData(userId, since) {
    // Simulation simple - dans un vrai système, calculer basé sur les messages
    return { avgHours: 2 };
  }

  static async getVerificationDetails(userId) {
    return { status: 'verified', documents: [] };
  }

  // ================================
  // 📝 LOGGING D'ÉVÉNEMENTS
  // ================================

  static async logUserEvent(eventData) {
    try {
      // Dans une vraie app, vous stockeriez dans une table events
      // ou utiliseriez un service comme Mixpanel, Amplitude, etc.
      console.log('📊 Event tracked:', {
        timestamp: new Date(),
        ...eventData
      });

      // Retourner un ID simulé
      return { id: `event_${Date.now()}` };
    } catch (error) {
      console.error('❌ Erreur logging événement:', error);
      return { id: null };
    }
  }

  static async updateRealTimeMetrics(userId, eventType, eventData) {
    try {
      // Mettre à jour les métriques temps réel selon le type d'événement
      switch (eventType) {
        case 'create_trip':
          // Incrémenter compteur voyages
          break;
        case 'create_parcel':
          // Incrémenter compteur colis
          break;
        case 'send_message':
          // Mettre à jour temps de réponse moyen
          break;
        default:
          // Événement générique
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour métriques temps réel:', error);
      return false;
    }
  }

  // ================================
  // 📊 DONNÉES PAR DÉFAUT (FALLBACK)
  // ================================

  static getDefaultBasicStats() {
    return {
      totalTripsPublished: 0,
      totalParcelsSent: 0,
      totalReviews: 0,
      memberSince: new Date(),
      accountAge: 0,
      joinedDaysAgo: 0
    };
  }

  static getDefaultEarnings() {
    return {
      total: 0,
      thisMonth: 0,
      thisYear: 0,
      avgPerTrip: 0,
      monthlyGrowth: 0,
      earningsHistory: [],
      avgMonthlyEarnings: 0,
      monthlyBreakdown: {}
    };
  }

  static getDefaultPerformance() {
    return {
      successRate: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      cancelledTransactions: 0,
      avgResponseTime: '0h',
      reliability: 0,
      cancelationRate: 0,
      onTimeDeliveryRate: 0,
      efficiency: 0
    };
  }

  static getDefaultTrust() {
    return {
      trustScore: 0,
      verificationLevel: 'bronze',
      ratingQuality: 'low',
      trustBadges: [],
      verificationDetails: {},
      accountMaturity: 'new',
      ratingBreakdown: { current: 0, total: 0, target: 5.0, progress: 0 }
    };
  }

  static getDefaultPredictions() {
    return {
      nextMonthEarnings: 0,
      demandGrowth: 0,
      confidence: 50,
      marketTrend: 'stable',
      bestOpportunities: [],
      riskFactors: [],
      recommendations: []
    };
  }

  static getDefaultInsights() {
    return {
      pricing: { optimal: 0, current: 0, recommendation: 'maintain' },
      routes: { trending: [], recommended: [] },
      timing: { optimal: 'anytime', confidence: 'low' },
      profile: { completeness: 0, suggestions: [] },
      market: { trend: 'stable', opportunities: [] },
      actionPlan: [],
      confidence: 'low'
    };
  }

  static getMobileDefaults() {
    return {
      basic: this.getDefaultBasicStats(),
      quick: {
        monthlyEarnings: 0,
        successRate: 0,
        responseTime: '0h',
        totalTransactions: 0
      },
      recent: [],
      optimized: true,
      timestamp: new Date()
    };
  }

  // ================================
  // 🧮 FONCTIONS DE CALCUL AVANCÉES
  // ================================

  static calculateTrend(data) {
    if (data.length < 2) return 0;
    
    // Calcul simple de tendance linéaire
    const values = data.map(d => d.amount);
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY !== 0 ? (slope / avgY) * 100 : 0;
  }

  static calculateGrowthRate(trends) {
    if (trends.length < 2) return 0;
    
    const firstMonth = trends[0].amount;
    const lastMonth = trends[trends.length - 1].amount;
    
    if (firstMonth === 0) return 0;
    
    return ((lastMonth - firstMonth) / firstMonth) * 100;
  }

  // Fonctions simulées pour les fonctionnalités avancées
  static async getHistoricalEarnings(userId, months) { return []; }
  static async getUserBehaviorPatterns(userId) { return {}; }
  static async getSeasonalityData() { return {}; }
  static predictNextMonthEarnings(historical, market, seasonal) { return 450; }
  static predictDemandGrowth(behavior, market) { return 23; }
  static calculatePredictionConfidence(historical, behavior) { return 94; }
  static async identifyBestOpportunities(userId) { return []; }
  static identifyRiskFactors(historical, behavior) { return []; }
  static generatePredictionRecommendations(historical, growth) { return []; }
  static async generateTimingInsights(userId) { return {}; }
  static async generateProfileInsights(userId) { return {}; }
  static async generateMarketInsights(userId) { return {}; }
  static generateActionPlan(insights) { return []; }
  static calculateInsightsConfidence(pricing, routes) { return 'medium'; }
  static async getTotalEarnings(userId) { return 0; }
  static async getTotalFees(userId) { return 0; }
  static async getTotalWithdrawals(userId) { return 0; }
  static async getPendingEarnings(userId) { return 0; }
  static async getLastTransaction(userId) { return null; }
  static generateExpenseTrends(dateRange, trips) { return []; }
  static async calculatePublicPerformance(userId) { return { successRate: 0, avgResponseTime: '0h' }; }
  static async getPublicRecentActivity(userId) { return []; }
  static calculateAccountMaturity(createdAt) { return 'new'; }
  static calculateTrustBadges(user, score) { return []; }
  static generateRouteInsightsText(recommendations) { return []; }
  static async getRecentActivity(userId, limit) { return []; }
}

module.exports = AnalyticsService;