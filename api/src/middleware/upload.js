const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { AppError } = require('./error/errorHandler');
const logger = require('../config/logger');

// Configuration du stockage temporaire
const storage = multer.memoryStorage();

// Filtre pour les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier non autorisé. Seules les images sont acceptées.', 400), false);
  }
};

// Configuration multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Maximum 5 fichiers
  }
});

// Middleware pour traiter une seule image
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Fichier trop volumineux. Taille maximale: 10MB', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError('Champ de fichier inattendu', 400));
        }
        return next(new AppError('Erreur lors de l\'upload du fichier', 400));
      }
      
      if (err) {
        return next(err);
      }
      
      next();
    });
  };
};

// Middleware pour traiter plusieurs images
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Un ou plusieurs fichiers sont trop volumineux. Taille maximale: 10MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError(`Trop de fichiers. Maximum autorisé: ${maxCount}`, 400));
        }
        return next(new AppError('Erreur lors de l\'upload des fichiers', 400));
      }
      
      if (err) {
        return next(err);
      }
      
      next();
    });
  };
};

// Middleware pour optimiser les images avec Sharp
const optimizeImage = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const processFile = async (file) => {
      if (!file.buffer) return file;

      // Optimiser l'image avec Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(2000, 2000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85, 
          progressive: true 
        })
        .toBuffer();

      // Créer un fichier temporaire
      const tempDir = path.join(__dirname, '../../temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const tempPath = path.join(tempDir, tempFilename);
      
      await fs.writeFile(tempPath, optimizedBuffer);

      return {
        ...file,
        path: tempPath,
        filename: tempFilename,
        mimetype: 'image/jpeg',
        size: optimizedBuffer.length
      };
    };

    if (req.file) {
      req.file = await processFile(req.file);
    }

    if (req.files && Array.isArray(req.files)) {
      req.files = await Promise.all(req.files.map(processFile));
    }

    next();
  } catch (error) {
    logger.error('Image optimization error:', error);
    next(new AppError('Erreur lors de l\'optimisation de l\'image', 500));
  }
};

// Middleware pour nettoyer les fichiers temporaires
const cleanupTempFiles = async (req, res, next) => {
  const cleanup = async () => {
    try {
      const files = [];
      
      if (req.file && req.file.path) {
        files.push(req.file.path);
      }
      
      if (req.files && Array.isArray(req.files)) {
        files.push(...req.files.filter(f => f.path).map(f => f.path));
      }

      await Promise.all(files.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn(`Failed to delete temp file: ${filePath}`, err);
        }
      }));
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  };

  // Nettoyer après la réponse
  res.on('finish', cleanup);
  res.on('close', cleanup);
  
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  optimizeImage,
  cleanupTempFiles
};