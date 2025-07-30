const express = require('express');
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImageById,
  getOptimizedImageUrl,
  getImageInfo,
  listImages
} = require('../controllers/uploadController');

const { authenticate, authorize } = require('../middleware/auth/auth');
const { uploadSingle, uploadMultiple, optimizeImage, cleanupTempFiles } = require('../middleware/upload');
const { validate } = require('../middleware/validation/validation');
const Joi = require('joi');

const router = express.Router();

// Schémas de validation pour l'upload
const uploadSchemas = {
  singleUpload: Joi.object({
    folder: Joi.string().trim().max(50).default('general'),
    width: Joi.number().integer().min(1).max(4000),
    height: Joi.number().integer().min(1).max(4000),
    quality: Joi.string().valid('auto:low', 'auto:good', 'auto:best', 'auto:eco').default('auto:good')
  }),

  multipleUpload: Joi.object({
    folder: Joi.string().trim().max(50).default('general')
  }),

  optimizeParams: Joi.object({
    publicId: Joi.string().required()
  }),

  optimizeQuery: Joi.object({
    width: Joi.number().integer().min(1).max(4000),
    height: Joi.number().integer().min(1).max(4000),
    quality: Joi.string().default('auto:good'),
    format: Joi.string().default('auto')
  }),

  listQuery: Joi.object({
    folder: Joi.string().default('leonce-studio'),
    limit: Joi.number().integer().min(1).max(100).default(20),
    next_cursor: Joi.string()
  })
};

// Route publique pour l'optimisation d'images
router.get('/optimize/:publicId', 
  validate(uploadSchemas.optimizeParams, 'params'),
  validate(uploadSchemas.optimizeQuery, 'query'),
  getOptimizedImageUrl
);

// Routes protégées (Admin seulement)
router.use(authenticate);
router.use(authorize('admin'));

// Upload d'une seule image
router.post('/image',
  uploadSingle('image'),
  optimizeImage,
  cleanupTempFiles,
  validate(uploadSchemas.singleUpload),
  uploadSingleImage
);

// Upload de plusieurs images
router.post('/images',
  uploadMultiple('images', 10),
  optimizeImage,
  cleanupTempFiles,
  validate(uploadSchemas.multipleUpload),
  uploadMultipleImages
);

// Supprimer une image
router.delete('/image/:publicId',
  validate(uploadSchemas.optimizeParams, 'params'),
  deleteImageById
);

// Obtenir les informations d'une image
router.get('/info/:publicId',
  validate(uploadSchemas.optimizeParams, 'params'),
  getImageInfo
);

// Lister les images
router.get('/images',
  validate(uploadSchemas.listQuery, 'query'),
  listImages
);

module.exports = router;