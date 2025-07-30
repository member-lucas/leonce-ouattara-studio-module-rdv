const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Fonction pour uploader une image
const uploadImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'leonce-studio',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(file.path || file.buffer, defaultOptions);
    
    logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
};

// Fonction pour supprimer une image
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error('Erreur lors de la suppression de l\'image');
  }
};

// Fonction pour générer une URL avec transformations
const generateImageUrl = (publicId, transformations = []) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations
  });
};

// Fonction pour optimiser une image existante
const optimizeImage = (publicId, width, height, quality = 'auto:good') => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width, height, crop: 'fill' },
      { quality },
      { fetch_format: 'auto' }
    ]
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  generateImageUrl,
  optimizeImage
};