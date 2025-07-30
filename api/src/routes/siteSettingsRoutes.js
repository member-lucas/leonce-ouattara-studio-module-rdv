const express = require('express');
const {
  getAllSettings,
  getSetting,
  createSetting,
  updateSetting,
  updateMultipleSettings,
  deleteSetting,
  getPublicSettings,
  resetToDefaults
} = require('../controllers/siteSettingsController');

const { authenticate, authorize } = require('../middleware/auth/auth');
const { validate, commonSchemas } = require('../middleware/validation/validation');
const { publicLimiter } = require('../config/rateLimiter');
const Joi = require('joi');

const router = express.Router();

// Schémas de validation pour les paramètres du site
const settingSchemas = {
  create: Joi.object({
    key: Joi.string().trim().min(1).max(100).required()
      .pattern(/^[a-z0-9_]+$/)
      .messages({
        'string.pattern.base': 'La clé doit contenir uniquement des lettres minuscules, chiffres et underscores'
      }),
    value: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object(),
      Joi.array()
    ).required(),
    type: Joi.string().valid('string', 'number', 'boolean', 'object', 'array').required(),
    category: Joi.string().valid('general', 'contact', 'social', 'seo', 'appearance', 'analytics', 'security').required(),
    description: Joi.string().trim().max(500),
    isPublic: Joi.boolean().default(false),
    isEditable: Joi.boolean().default(true),
    validation: Joi.object({
      required: Joi.boolean(),
      min: Joi.number(),
      max: Joi.number(),
      pattern: Joi.string(),
      options: Joi.array().items(Joi.string())
    })
  }),

  update: Joi.object({
    value: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object(),
      Joi.array()
    ).required()
  }),

  bulkUpdate: Joi.object({
    settings: Joi.array().items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array()
        ).required()
      })
    ).min(1).required()
  }),

  keyParam: Joi.object({
    key: Joi.string().required()
  })
};

// Route publique pour obtenir les paramètres publics
router.get('/public', publicLimiter, getPublicSettings);

// Routes protégées (Admin seulement)
router.use(authenticate);
router.use(authorize('admin'));

// Routes CRUD pour les paramètres
router.get('/', getAllSettings);
router.get('/:key', validate(settingSchemas.keyParam, 'params'), getSetting);
router.post('/', validate(settingSchemas.create), createSetting);
router.put('/:key', validate(settingSchemas.keyParam, 'params'), validate(settingSchemas.update), updateSetting);
router.put('/bulk/update', validate(settingSchemas.bulkUpdate), updateMultipleSettings);
router.delete('/:key', validate(settingSchemas.keyParam, 'params'), deleteSetting);

// Route pour réinitialiser aux valeurs par défaut
router.post('/reset', resetToDefaults);

module.exports = router;