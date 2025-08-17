const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const uploadDirs = {
  profiles: './uploads/profiles',
  documents: './uploads/documents'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = uploadDirs.profiles; // Par défaut
    
    // Déterminer le type basé sur l'URL de la requête
    if (req.path.includes('identity') || req.path.includes('document')) {
      uploadDir = uploadDirs.documents;
    } else if (req.path.includes('picture') || req.path.includes('photo')) {
      uploadDir = uploadDirs.profiles;
    }
    
    console.log(`Upload destination: ${uploadDir} for path: ${req.path}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  console.log(`File filter - Path: ${req.path}, Fieldname: ${file.fieldname}, Mimetype: ${file.mimetype}`);
  
  // Déterminer le type basé sur l'URL de la requête
  const isDocument = req.path.includes('identity') || req.path.includes('document');
  const isPhoto = req.path.includes('picture') || req.path.includes('photo');
  
  if (isPhoto) {
    // Images uniquement pour les profils
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log('✅ Photo acceptée');
      return cb(null, true);
    } else {
      console.log('❌ Photo rejetée');
      cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif)'));
    }
  } else if (isDocument) {
    // Images et PDFs pour les documents
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      console.log('✅ Document accepté');
      return cb(null, true);
    } else {
      console.log('❌ Document rejeté');
      cb(new Error('Formats autorisés : jpeg, jpg, png, pdf'));
    }
  } else {
    console.log('❌ Type non reconnu');
    cb(new Error('Type de fichier non reconnu'));
  }
};

// Créer le middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

module.exports = upload;