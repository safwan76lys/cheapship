const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Route publique pour les avatars (pas besoin d'authentification)
router.get('/avatar/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/profiles', filename);
  
  console.log('📸 Demande avatar:', filename);
  
  // Vérifier si le fichier existe
  if (fs.existsSync(filePath)) {
    // Définir les headers CORS
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Content-Type', 'image/jpeg');
    res.sendFile(path.resolve(filePath));
  } else {
    console.log('❌ Avatar non trouvé:', filePath);
    res.status(404).json({ error: 'Image non trouvée' });
  }
});

// Toutes les autres routes nécessitent l'authentification
router.use(authMiddleware);

// Routes protégées
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/profile/picture', upload.single('photo'), userController.uploadProfilePicture);
router.post('/profile/identity', upload.single('document'), userController.uploadIdentityDocument);

// Route pour les documents d'identité (authentifiée)
router.get('/document/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/documents', filename);
  
  console.log('📄 Demande document:', filename);
  
  // Vérifier si le fichier existe et appartient à l'utilisateur
  if (fs.existsSync(filePath) && filename.startsWith(req.user.id)) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.sendFile(path.resolve(filePath));
  } else {
    console.log('❌ Document non trouvé ou non autorisé:', filePath);
    res.status(404).json({ error: 'Document non trouvé' });
  }
});

module.exports = router;