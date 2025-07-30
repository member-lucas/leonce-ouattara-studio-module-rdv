const SiteSetting = require('../models/SiteSetting');
const { catchAsync, AppError } = require('../middleware/error/errorHandler');
const logger = require('../config/logger');

// @desc    Obtenir tous les paramètres du site
// @route   GET /api/v1/admin/settings
// @access  Private (Admin)
const getAllSettings = catchAsync(async (req, res, next) => {
  const { category } = req.query;
  
  let settings;
  if (category) {
    settings = await SiteSetting.getByCategory(category);
  } else {
    settings = await SiteSetting.find().sort({ category: 1, key: 1 });
  }

  // Grouper par catégorie pour une meilleure organisation
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    count: settings.length,
    data: {
      settings: groupedSettings
    }
  });
});

// @desc    Obtenir un paramètre spécifique
// @route   GET /api/v1/admin/settings/:key
// @access  Private (Admin)
const getSetting = catchAsync(async (req, res, next) => {
  const setting = await SiteSetting.findOne({ key: req.params.key });

  if (!setting) {
    return next(new AppError('Paramètre non trouvé', 404));
  }

  res.status(200).json({
    success: true,
    data: { setting }
  });
});

// @desc    Créer un nouveau paramètre
// @route   POST /api/v1/admin/settings
// @access  Private (Admin)
const createSetting = catchAsync(async (req, res, next) => {
  req.body.lastModifiedBy = req.user.id;
  
  const setting = await SiteSetting.create(req.body);

  logger.info(`Site setting created: ${setting.key} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Paramètre créé avec succès',
    data: { setting }
  });
});

// @desc    Mettre à jour un paramètre
// @route   PUT /api/v1/admin/settings/:key
// @access  Private (Admin)
const updateSetting = catchAsync(async (req, res, next) => {
  const setting = await SiteSetting.findOne({ key: req.params.key });

  if (!setting) {
    return next(new AppError('Paramètre non trouvé', 404));
  }

  if (!setting.isEditable) {
    return next(new AppError('Ce paramètre ne peut pas être modifié', 403));
  }

  // Mettre à jour seulement la valeur et les métadonnées
  setting.value = req.body.value;
  setting.lastModifiedBy = req.user.id;
  
  await setting.save();

  logger.info(`Site setting updated: ${setting.key} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Paramètre mis à jour avec succès',
    data: { setting }
  });
});

// @desc    Mettre à jour plusieurs paramètres en une fois
// @route   PUT /api/v1/admin/settings/bulk
// @access  Private (Admin)
const updateMultipleSettings = catchAsync(async (req, res, next) => {
  const { settings } = req.body;

  if (!Array.isArray(settings) || settings.length === 0) {
    return next(new AppError('Liste de paramètres requise', 400));
  }

  const updatedSettings = [];
  const errors = [];

  for (const settingData of settings) {
    try {
      const setting = await SiteSetting.findOne({ key: settingData.key });
      
      if (!setting) {
        errors.push(`Paramètre '${settingData.key}' non trouvé`);
        continue;
      }

      if (!setting.isEditable) {
        errors.push(`Paramètre '${settingData.key}' non modifiable`);
        continue;
      }

      setting.value = settingData.value;
      setting.lastModifiedBy = req.user.id;
      
      await setting.save();
      updatedSettings.push(setting);
    } catch (error) {
      errors.push(`Erreur pour '${settingData.key}': ${error.message}`);
    }
  }

  logger.info(`Bulk settings update: ${updatedSettings.length} updated, ${errors.length} errors by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: `${updatedSettings.length} paramètres mis à jour`,
    data: {
      updated: updatedSettings,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

// @desc    Supprimer un paramètre
// @route   DELETE /api/v1/admin/settings/:key
// @access  Private (Admin)
const deleteSetting = catchAsync(async (req, res, next) => {
  const setting = await SiteSetting.findOne({ key: req.params.key });

  if (!setting) {
    return next(new AppError('Paramètre non trouvé', 404));
  }

  if (!setting.isEditable) {
    return next(new AppError('Ce paramètre ne peut pas être supprimé', 403));
  }

  await setting.deleteOne();

  logger.info(`Site setting deleted: ${req.params.key} by ${req.user.email}`);

  res.status(204).json({
    success: true,
    message: 'Paramètre supprimé avec succès'
  });
});

// @desc    Obtenir les paramètres publics (pour le frontend)
// @route   GET /api/v1/settings/public
// @access  Public
const getPublicSettings = catchAsync(async (req, res, next) => {
  const settings = await SiteSetting.getPublicSettings();

  // Convertir en objet clé-valeur pour faciliter l'utilisation
  const settingsObject = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: { settings: settingsObject }
  });
});

// @desc    Réinitialiser les paramètres par défaut
// @route   POST /api/v1/admin/settings/reset
// @access  Private (Admin)
const resetToDefaults = catchAsync(async (req, res, next) => {
  // Paramètres par défaut du site
  const defaultSettings = [
    {
      key: 'site_title',
      value: 'Leonce Ouattara Studio',
      type: 'string',
      category: 'general',
      description: 'Titre principal du site',
      isPublic: true
    },
    {
      key: 'site_description',
      value: 'Expert IT & Solutions Digitales',
      type: 'string',
      category: 'general',
      description: 'Description du site',
      isPublic: true
    },
    {
      key: 'contact_email',
      value: 'leonce.ouattara@outlook.fr',
      type: 'string',
      category: 'contact',
      description: 'Email de contact principal',
      isPublic: true
    },
    {
      key: 'contact_phone',
      value: '+225 05 45 13 07 39',
      type: 'string',
      category: 'contact',
      description: 'Téléphone de contact',
      isPublic: true
    },
    {
      key: 'contact_address',
      value: 'Abidjan, Côte d\'Ivoire',
      type: 'string',
      category: 'contact',
      description: 'Adresse physique',
      isPublic: true
    },
    {
      key: 'social_github',
      value: 'https://github.com/leonce-ouattara/',
      type: 'string',
      category: 'social',
      description: 'Lien GitHub',
      isPublic: true
    },
    {
      key: 'social_linkedin',
      value: 'https://www.linkedin.com/in/leonce-ouattara/',
      type: 'string',
      category: 'social',
      description: 'Lien LinkedIn',
      isPublic: true
    },
    {
      key: 'social_twitter',
      value: 'https://x.com/Sacerdoceroyalv',
      type: 'string',
      category: 'social',
      description: 'Lien Twitter X',
      isPublic: true
    },
    {
      key: 'seo_meta_title',
      value: 'Leonce Ouattara Studio - Expert IT & Solutions Digitales',
      type: 'string',
      category: 'seo',
      description: 'Titre SEO par défaut',
      isPublic: false
    },
    {
      key: 'seo_meta_description',
      value: 'Portfolio professionnel de Leonce Ouattara - Expert en développement web, solutions digitales pour hôtellerie, immobilier et entrepreneurs.',
      type: 'string',
      category: 'seo',
      description: 'Description SEO par défaut',
      isPublic: false
    },
    {
      key: 'maintenance_mode',
      value: false,
      type: 'boolean',
      category: 'general',
      description: 'Mode maintenance du site',
      isPublic: false
    },
    {
      key: 'analytics_enabled',
      value: true,
      type: 'boolean',
      category: 'analytics',
      description: 'Activer les analytics',
      isPublic: false
    }
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const settingData of defaultSettings) {
    try {
      const existingSetting = await SiteSetting.findOne({ key: settingData.key });
      
      if (existingSetting) {
        existingSetting.value = settingData.value;
        existingSetting.lastModifiedBy = req.user.id;
        await existingSetting.save();
        updatedCount++;
      } else {
        await SiteSetting.create({
          ...settingData,
          lastModifiedBy: req.user.id
        });
        createdCount++;
      }
    } catch (error) {
      logger.error(`Error resetting setting ${settingData.key}:`, error);
    }
  }

  logger.info(`Settings reset: ${createdCount} created, ${updatedCount} updated by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Paramètres réinitialisés avec succès',
    data: {
      created: createdCount,
      updated: updatedCount
    }
  });
});

module.exports = {
  getAllSettings,
  getSetting,
  createSetting,
  updateSetting,
  updateMultipleSettings,
  deleteSetting,
  getPublicSettings,
  resetToDefaults
};