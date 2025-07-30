const express = require('express');
const { authenticate } = require('../middleware/auth/auth');
const { 
  adminProtection, 
  sensitiveActionProtection, 
  adminRateLimit,
  auditAdminAction 
} = require('../middleware/adminProtection');
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/authController');
const { 
  getProjectStats,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const {
  getAllSettings,
  getSetting,
  createSetting,
  updateSetting,
  updateMultipleSettings,
  deleteSetting,
  resetToDefaults
} = require('../controllers/siteSettingsController');
const { validate, commonSchemas, projectSchemas } = require('../middleware/validation/validation');
const Joi = require('joi');

const router = express.Router();

// Appliquer la protection admin à toutes les routes
router.use(adminRateLimit);
router.use(authenticate);
router.use(adminProtection);

// Dashboard et statistiques
router.get('/dashboard', auditAdminAction('view_dashboard'), (req, res) => {
  res.json({
    success: true,
    message: 'Accès au dashboard admin autorisé',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    }
  });
});

router.get('/stats', auditAdminAction('view_stats'), getProjectStats);

// Gestion des utilisateurs
router.get('/users', auditAdminAction('list_users'), getAllUsers);
router.get('/users/:id', 
  validate(commonSchemas.mongoId, 'params'),
  auditAdminAction('view_user'),
  getUserById
);

router.put('/users/:id', 
  validate(commonSchemas.mongoId, 'params'),
  sensitiveActionProtection,
  auditAdminAction('update_user'),
  updateUser
);

router.delete('/users/:id', 
  validate(commonSchemas.mongoId, 'params'),
  sensitiveActionProtection,
  auditAdminAction('delete_user'),
  deleteUser
);

// Gestion des projets
router.post('/projects', 
  validate(projectSchemas.create),
  auditAdminAction('create_project'),
  createProject
);

router.put('/projects/:id', 
  validate(commonSchemas.mongoId, 'params'),
  validate(projectSchemas.update),
  auditAdminAction('update_project'),
  updateProject
);

router.delete('/projects/:id', 
  validate(commonSchemas.mongoId, 'params'),
  sensitiveActionProtection,
  auditAdminAction('delete_project'),
  deleteProject
);

// Gestion des paramètres du site
router.get('/settings', 
  auditAdminAction('list_settings'),
  getAllSettings
);

router.get('/settings/:key', 
  validate(Joi.object({ key: Joi.string().required() }), 'params'),
  auditAdminAction('view_setting'),
  getSetting
);

router.post('/settings', 
  auditAdminAction('create_setting'),
  createSetting
);

router.put('/settings/:key', 
  validate(Joi.object({ key: Joi.string().required() }), 'params'),
  auditAdminAction('update_setting'),
  updateSetting
);

router.put('/settings/bulk/update', 
  auditAdminAction('bulk_update_settings'),
  updateMultipleSettings
);

router.delete('/settings/:key', 
  validate(Joi.object({ key: Joi.string().required() }), 'params'),
  sensitiveActionProtection,
  auditAdminAction('delete_setting'),
  deleteSetting
);

router.post('/settings/reset', 
  sensitiveActionProtection,
  auditAdminAction('reset_settings'),
  resetToDefaults
);

// Logs et monitoring (actions sensibles)
router.get('/logs', 
  sensitiveActionProtection,
  auditAdminAction('view_logs'),
  (req, res) => {
    // Ici vous pourriez implémenter la lecture des logs
    res.json({
      success: true,
      message: 'Accès aux logs autorisé',
      logs: [] // Implémenter la lecture des fichiers de logs
    });
  }
);

// Configuration système
router.get('/config', 
  sensitiveActionProtection,
  auditAdminAction('view_config'),
  (req, res) => {
    res.json({
      success: true,
      config: {
        nodeEnv: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || 'v1',
        // Ne pas exposer les secrets
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbConnection: !!process.env.MONGODB_URI
      }
    });
  }
);

module.exports = router;