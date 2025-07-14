const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  getTodayAppointments,
  getAppointmentStats
} = require('../controllers/appointmentController');

const { authenticate, authorize } = require('../middleware/auth/auth');
const { validate, commonSchemas } = require('../middleware/validation/validation');
const { publicLimiter } = require('../config/rateLimiter');
const Joi = require('joi');

const router = express.Router();

// Schémas de validation pour les rendez-vous
const appointmentSchemas = {
  create: Joi.object({
    client: Joi.object({
      firstName: Joi.string().trim().min(2).max(50).required(),
      lastName: Joi.string().trim().min(2).max(50).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^(?:\+33|0)[1-9](?:[0-9]{8})$/),
      company: Joi.object({
        name: Joi.string().trim().max(100),
        website: Joi.string().uri(),
        size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise')
      }),
      timezone: Joi.string().default('Europe/Paris')
    }).required(),

    appointment: Joi.object({
      title: Joi.string().trim().min(5).max(100).required(),
      description: Joi.string().trim().max(1000),
      type: Joi.string().valid('consultation', 'project-discussion', 'demo', 'support', 'follow-up', 'other').required(),
      duration: Joi.number().integer().min(15).max(240).required(),
      startTime: Joi.date().greater('now').required(),
      location: Joi.object({
        type: Joi.string().valid('online', 'office', 'client-office', 'phone', 'other').default('online'),
        details: Joi.string().trim().max(200),
        address: Joi.string().trim().max(300)
      })
    }).required(),

    project: Joi.object({
      type: Joi.string().valid('website', 'webapp', 'mobile', 'ecommerce', 'api', 'consulting', 'maintenance', 'other'),
      budget: Joi.object({
        range: Joi.string().valid('1000-5000', '5000-10000', '10000-20000', '20000-50000', '50000+', 'to-discuss'),
        currency: Joi.string().default('EUR')
      }),
      timeline: Joi.string().valid('asap', '1-month', '2-3-months', '3-6-months', '6-months+', 'flexible'),
      description: Joi.string().trim().max(1000),
      requirements: Joi.array().items(Joi.string().trim()),
      technologies: Joi.array().items(Joi.string().trim())
    }),

    gdprConsent: Joi.boolean().valid(true).required()
  }),

  confirm: Joi.object({
    token: Joi.string().required()
  }),

  cancel: Joi.object({
    token: Joi.string().required(),
    reason: Joi.string().trim().max(500)
  }),

  reschedule: Joi.object({
    newStartTime: Joi.date().greater('now').required(),
    newDuration: Joi.number().integer().min(15).max(240)
  })
};

// Routes publiques
router.post('/', publicLimiter, validate(appointmentSchemas.create), createAppointment);
router.get('/available-slots', publicLimiter, getAvailableSlots);
router.post('/:id/confirm', publicLimiter, validate(commonSchemas.mongoId, 'params'), validate(appointmentSchemas.confirm), confirmAppointment);
router.post('/:id/cancel', publicLimiter, validate(commonSchemas.mongoId, 'params'), validate(appointmentSchemas.cancel), cancelAppointment);

// Routes protégées (Admin seulement)
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.get('/stats', getAppointmentStats);
router.get('/:id', validate(commonSchemas.mongoId, 'params'), getAppointment);
router.put('/:id/reschedule', validate(commonSchemas.mongoId, 'params'), validate(appointmentSchemas.reschedule), rescheduleAppointment);

module.exports = router;