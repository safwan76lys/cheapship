const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const authConfig = require('../config/auth');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentification requise'
      });
    }

    const decoded = jwt.verify(token, authConfig.jwtSecret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Utilisateur non trouvé ou inactif'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: 'Token invalide'
    });
  }
};

module.exports = authMiddleware;