const prisma = require('../config/database');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class UserController {
  // Récupérer le profil
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          birthDate: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          profilePicture: true,
          identityDocument: true,
          identityVerified: true,
          emailVerified: true,
          phoneVerified: true,
          rating: true,
          totalRatings: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
  }

  // Mettre à jour le profil
  async updateProfile(req, res) {
    try {
      const {
        fullName,
        phone,
        birthDate,
        address,
        city,
        postalCode,
        country
      } = req.body;

      const updateData = {};
      
      // Ne mettre à jour que les champs fournis
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (postalCode !== undefined) updateData.postalCode = postalCode;
      if (country !== undefined) updateData.country = country;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          birthDate: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          profilePicture: true,
          identityVerified: true,
          emailVerified: true
        }
      });

      res.json(user); 

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
  }

  // Upload photo de profil
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Redimensionner l'image
      const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
      const outputPath = path.join('./uploads/profiles', filename);

      await sharp(req.file.path)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      // Supprimer l'original
      await fs.unlink(req.file.path);

      // Supprimer l'ancienne photo si elle existe
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profilePicture: true }
      });

      if (user.profilePicture) {
        const oldPath = path.join('./uploads/profiles', user.profilePicture);
        try {
          await fs.unlink(oldPath);
        } catch (error) {
          console.log('Ancienne photo non trouvée');
        }
      }

      // Mettre à jour la base de données
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture: filename }
      });

      res.json({
        message: 'Photo de profil mise à jour',
        profilePicture: filename
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  }

  // Upload document d'identité
  async uploadIdentityDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const filename = req.file.filename;

      // Mettre à jour la base de données
      await prisma.user.update({
        where: { id: req.user.id },
        data: { 
          identityDocument: filename,
          // La vérification manuelle sera faite par un admin
          identityVerified: false
        }
      });

      res.json({
       message: 'Document d\'identité uploadé avec succès',
        identityDocument: filename  // ← Assure-toi que cette ligne utilise "identityDocument"
     });

    } catch (error) {
      console.error('Upload identity document error:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  }
}

module.exports = new UserController();