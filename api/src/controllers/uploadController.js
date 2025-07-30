const { uploadImage, deleteImage, optimizeImage } = require('../config/cloudinary');
const { catchAsync, AppError } = require('../middleware/error/errorHandler');
const logger = require('../config/logger');

// @desc    Upload d'une seule image
// @route   POST /api/v1/upload/image
// @access  Private (Admin)
const uploadSingleImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Aucun fichier fourni', 400));
  }

  const { folder = 'general', width, height, quality } = req.body;

  try {
    // Options d'upload personnalisées
    const uploadOptions = {
      folder: `leonce-studio/${folder}`,
      use_filename: true,
      unique_filename: true
    };

    // Ajouter des transformations si spécifiées
    if (width || height || quality) {
      uploadOptions.transformation = [];
      
      if (width || height) {
        uploadOptions.transformation.push({
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          crop: 'fill'
        });
      }
      
      if (quality) {
        uploadOptions.transformation.push({
          quality: quality
        });
      }
    }

    const result = await uploadImage(req.file, uploadOptions);

    logger.info(`Image uploaded successfully: ${result.public_id} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        image: result
      }
    });
  } catch (error) {
    logger.error('Image upload failed:', error);
    return next(new AppError('Erreur lors de l\'upload de l\'image', 500));
  }
});

// @desc    Upload de plusieurs images
// @route   POST /api/v1/upload/images
// @access  Private (Admin)
const uploadMultipleImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Aucun fichier fourni', 400));
  }

  const { folder = 'general' } = req.body;
  const uploadedImages = [];
  const errors = [];

  try {
    for (const file of req.files) {
      try {
        const result = await uploadImage(file, {
          folder: `leonce-studio/${folder}`,
          use_filename: true,
          unique_filename: true
        });
        
        uploadedImages.push(result);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    logger.info(`Multiple images uploaded: ${uploadedImages.length} success, ${errors.length} errors by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} images uploadées avec succès`,
      data: {
        images: uploadedImages,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Multiple images upload failed:', error);
    return next(new AppError('Erreur lors de l\'upload des images', 500));
  }
});

// @desc    Supprimer une image
// @route   DELETE /api/v1/upload/image/:publicId
// @access  Private (Admin)
const deleteImageById = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new AppError('ID public de l\'image requis', 400));
  }

  try {
    // Décoder l'ID public (il peut être encodé dans l'URL)
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await deleteImage(decodedPublicId);

    if (result.result === 'not found') {
      return next(new AppError('Image non trouvée', 404));
    }

    logger.info(`Image deleted: ${decodedPublicId} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Image supprimée avec succès',
      data: { result }
    });
  } catch (error) {
    logger.error('Image deletion failed:', error);
    return next(new AppError('Erreur lors de la suppression de l\'image', 500));
  }
});

// @desc    Obtenir une URL optimisée pour une image
// @route   GET /api/v1/upload/optimize/:publicId
// @access  Public
const getOptimizedImageUrl = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;
  const { width, height, quality = 'auto:good', format = 'auto' } = req.query;

  if (!publicId) {
    return next(new AppError('ID public de l\'image requis', 400));
  }

  try {
    const decodedPublicId = decodeURIComponent(publicId);
    
    const optimizedUrl = optimizeImage(
      decodedPublicId,
      width ? parseInt(width) : undefined,
      height ? parseInt(height) : undefined,
      quality
    );

    res.status(200).json({
      success: true,
      data: {
        originalPublicId: decodedPublicId,
        optimizedUrl,
        transformations: {
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          quality,
          format
        }
      }
    });
  } catch (error) {
    logger.error('Image optimization failed:', error);
    return next(new AppError('Erreur lors de l\'optimisation de l\'image', 500));
  }
});

// @desc    Obtenir les informations d'une image
// @route   GET /api/v1/upload/info/:publicId
// @access  Private (Admin)
const getImageInfo = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new AppError('ID public de l\'image requis', 400));
  }

  try {
    const decodedPublicId = decodeURIComponent(publicId);
    
    // Utiliser l'API Cloudinary pour obtenir les informations
    const result = await cloudinary.api.resource(decodedPublicId);

    res.status(200).json({
      success: true,
      data: {
        image: {
          public_id: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          created_at: result.created_at,
          folder: result.folder,
          tags: result.tags || []
        }
      }
    });
  } catch (error) {
    if (error.http_code === 404) {
      return next(new AppError('Image non trouvée', 404));
    }
    
    logger.error('Get image info failed:', error);
    return next(new AppError('Erreur lors de la récupération des informations de l\'image', 500));
  }
});

// @desc    Lister les images par dossier
// @route   GET /api/v1/upload/images
// @access  Private (Admin)
const listImages = catchAsync(async (req, res, next) => {
  const { folder = 'leonce-studio', limit = 20, next_cursor } = req.query;

  try {
    const options = {
      type: 'upload',
      prefix: folder,
      max_results: parseInt(limit)
    };

    if (next_cursor) {
      options.next_cursor = next_cursor;
    }

    const result = await cloudinary.api.resources(options);

    res.status(200).json({
      success: true,
      data: {
        images: result.resources.map(resource => ({
          public_id: resource.public_id,
          url: resource.secure_url,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          bytes: resource.bytes,
          created_at: resource.created_at
        })),
        next_cursor: result.next_cursor,
        total_count: result.total_count
      }
    });
  } catch (error) {
    logger.error('List images failed:', error);
    return next(new AppError('Erreur lors de la récupération de la liste des images', 500));
  }
});

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImageById,
  getOptimizedImageUrl,
  getImageInfo,
  listImages
};