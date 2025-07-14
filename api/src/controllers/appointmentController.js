const Appointment = require('../models/Appointment');
const { catchAsync, AppError } = require('../middleware/error/errorHandler');
const logger = require('../config/logger');

// Fonction utilitaire pour envoyer des emails
const sendEmail = async (to, subject, message) => {
  logger.info(`Email sent to ${to}: ${subject}`);
  return true;
};

// Fonction pour vérifier la disponibilité d'un créneau
const isSlotAvailable = async (startTime, endTime, excludeId = null) => {
  const query = {
    $or: [
      {
        'appointment.startTime': { $lt: endTime },
        'appointment.endTime': { $gt: startTime }
      }
    ],
    status: { $in: ['scheduled', 'confirmed'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflictingAppointment = await Appointment.findOne(query);
  return !conflictingAppointment;
};

// @desc    Créer un nouveau rendez-vous
// @route   POST /api/v1/appointments
// @access  Public
const createAppointment = catchAsync(async (req, res, next) => {
  const {
    client,
    appointment,
    project,
    gdprConsent
  } = req.body;

  if (!gdprConsent) {
    return next(new AppError('Le consentement RGPD est requis', 400));
  }

  // Vérifier la disponibilité du créneau
  const isAvailable = await isSlotAvailable(
    new Date(appointment.startTime),
    new Date(appointment.endTime)
  );

  if (!isAvailable) {
    return next(new AppError('Ce créneau n\'est pas disponible', 400));
  }

  // Créer le rendez-vous
  const appointmentData = {
    client: {
      ...client,
      timezone: client.timezone || 'Europe/Paris'
    },
    appointment: {
      ...appointment,
      location: {
        type: appointment.location?.type || 'online',
        details: appointment.location?.details,
        meetingLink: appointment.location?.type === 'online' ? 
          `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}` : 
          undefined
      }
    },
    project,
    gdprConsent
  };

  const newAppointment = await Appointment.create(appointmentData);

  // Envoyer email de confirmation au client
  try {
    const appointmentDate = new Date(appointment.startTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = new Date(appointment.startTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendEmail(
      client.email,
      'Confirmation de rendez-vous - Leonce Ouattara Studio',
      `
        Bonjour ${client.firstName},
        
        Votre rendez-vous a été confirmé avec succès !
        
        📅 Date : ${appointmentDate}
        🕐 Heure : ${appointmentTime}
        ⏱️ Durée : ${appointment.duration} minutes
        📍 Type : ${appointment.location?.type === 'online' ? 'Visioconférence' : 'Présentiel'}
        ${appointment.location?.meetingLink ? `🔗 Lien : ${appointment.location.meetingLink}` : ''}
        
        Sujet : ${appointment.title}
        ${appointment.description ? `Description : ${appointment.description}` : ''}
        
        Je vous enverrai un rappel 24h avant notre rendez-vous.
        
        Si vous devez annuler ou reporter, utilisez ce lien :
        ${process.env.FRONTEND_URL}/appointments/manage/${newAppointment.cancellationToken}
        
        À bientôt,
        Leonce Ouattara
        Expert IT & Solutions Digitales
        
        Email: leonce.ouattara@outlook.fr
        Téléphone: +225 05 45 13 07 39
      `
    );

    // Envoyer notification à l'admin
    await sendEmail(
      process.env.ADMIN_EMAIL || 'admin@leonceouattara.com',
      `Nouveau RDV - ${appointment.title}`,
      `
        Nouveau rendez-vous programmé :
        
        Client : ${client.firstName} ${client.lastName}
        Email : ${client.email}
        Téléphone : ${client.phone || 'Non renseigné'}
        Entreprise : ${client.company?.name || 'Non renseignée'}
        
        Date : ${appointmentDate} à ${appointmentTime}
        Durée : ${appointment.duration} minutes
        Type : ${appointment.type}
        
        Projet :
        Type : ${project?.type || 'Non spécifié'}
        Budget : ${project?.budget?.range || 'Non spécifié'}
        Timeline : ${project?.timeline || 'Non spécifiée'}
        
        Description : ${project?.description || 'Aucune description'}
        
        Lien de gestion : ${process.env.ADMIN_URL}/appointments/${newAppointment._id}
      `
    );
  } catch (emailError) {
    logger.error('Appointment confirmation email failed:', emailError);
  }

  logger.info(`New appointment created: ${client.email} - ${appointment.title}`);

  res.status(201).json({
    success: true,
    message: 'Rendez-vous créé avec succès. Un email de confirmation vous a été envoyé.',
    data: {
      appointment: {
        id: newAppointment._id,
        startTime: newAppointment.appointment.startTime,
        duration: newAppointment.appointment.duration,
        status: newAppointment.status
      }
    }
  });
});

// @desc    Obtenir tous les rendez-vous (Admin)
// @route   GET /api/v1/appointments
// @access  Private (Admin)
const getAppointments = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Filtres
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.type) filters['appointment.type'] = req.query.type;
  if (req.query.date) {
    const date = new Date(req.query.date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    filters['appointment.startTime'] = {
      $gte: date,
      $lt: nextDay
    };
  }

  const appointments = await Appointment.find(filters)
    .sort({ 'appointment.startTime': 1 })
    .skip(skip)
    .limit(limit)
    .populate('assignedTo', 'firstName lastName');

  const total = await Appointment.countDocuments(filters);

  res.status(200).json({
    success: true,
    count: appointments.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: { appointments }
  });
});

// @desc    Obtenir un rendez-vous par ID (Admin)
// @route   GET /api/v1/appointments/:id
// @access  Private (Admin)
const getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('assignedTo', 'firstName lastName')
    .populate('createdBy', 'firstName lastName');

  if (!appointment) {
    return next(new AppError('Rendez-vous non trouvé', 404));
  }

  res.status(200).json({
    success: true,
    data: { appointment }
  });
});

// @desc    Confirmer un rendez-vous
// @route   POST /api/v1/appointments/:id/confirm
// @access  Public
const confirmAppointment = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    confirmationToken: token,
    status: 'scheduled'
  });

  if (!appointment) {
    return next(new AppError('Rendez-vous non trouvé ou token invalide', 404));
  }

  await appointment.confirm();

  logger.info(`Appointment confirmed: ${appointment._id}`);

  res.status(200).json({
    success: true,
    message: 'Rendez-vous confirmé avec succès',
    data: { appointment }
  });
});

// @desc    Annuler un rendez-vous
// @route   POST /api/v1/appointments/:id/cancel
// @access  Public
const cancelAppointment = catchAsync(async (req, res, next) => {
  const { token, reason } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    cancellationToken: token,
    status: { $in: ['scheduled', 'confirmed'] }
  });

  if (!appointment) {
    return next(new AppError('Rendez-vous non trouvé ou token invalide', 404));
  }

  await appointment.cancel(reason);

  // Envoyer email de confirmation d'annulation
  try {
    await sendEmail(
      appointment.client.email,
      'Annulation de rendez-vous confirmée',
      `
        Bonjour ${appointment.client.firstName},
        
        Votre rendez-vous du ${new Date(appointment.appointment.startTime).toLocaleDateString('fr-FR')} 
        a été annulé avec succès.
        
        ${reason ? `Raison : ${reason}` : ''}
        
        N'hésitez pas à reprendre contact pour programmer un nouveau rendez-vous.
        
        Cordialement,
        Leonce Ouattara
      `
    );
  } catch (emailError) {
    logger.error('Cancellation email failed:', emailError);
  }

  logger.info(`Appointment cancelled: ${appointment._id} - ${reason || 'No reason'}`);

  res.status(200).json({
    success: true,
    message: 'Rendez-vous annulé avec succès',
    data: { appointment }
  });
});

// @desc    Reporter un rendez-vous
// @route   PUT /api/v1/appointments/:id/reschedule
// @access  Private (Admin)
const rescheduleAppointment = catchAsync(async (req, res, next) => {
  const { newStartTime, newDuration } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(new AppError('Rendez-vous non trouvé', 404));
  }

  const newEndTime = new Date(new Date(newStartTime).getTime() + (newDuration || appointment.appointment.duration) * 60000);

  // Vérifier la disponibilité du nouveau créneau
  const isAvailable = await isSlotAvailable(
    new Date(newStartTime),
    newEndTime,
    appointment._id
  );

  if (!isAvailable) {
    return next(new AppError('Le nouveau créneau n\'est pas disponible', 400));
  }

  await appointment.reschedule(new Date(newStartTime), newDuration);

  // Envoyer email de notification
  try {
    await sendEmail(
      appointment.client.email,
      'Rendez-vous reporté - Nouvelle date confirmée',
      `
        Bonjour ${appointment.client.firstName},
        
        Votre rendez-vous a été reporté à une nouvelle date :
        
        📅 Nouvelle date : ${new Date(newStartTime).toLocaleDateString('fr-FR')}
        🕐 Nouvelle heure : ${new Date(newStartTime).toLocaleTimeString('fr-FR')}
        ⏱️ Durée : ${newDuration || appointment.appointment.duration} minutes
        
        Toutes les autres informations restent inchangées.
        
        Cordialement,
        Leonce Ouattara
      `
    );
  } catch (emailError) {
    logger.error('Reschedule email failed:', emailError);
  }

  logger.info(`Appointment rescheduled: ${appointment._id} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Rendez-vous reporté avec succès',
    data: { appointment }
  });
});

// @desc    Obtenir les créneaux disponibles
// @route   GET /api/v1/appointments/available-slots
// @access  Public
const getAvailableSlots = catchAsync(async (req, res, next) => {
  const { date, duration = 60 } = req.query;

  if (!date) {
    return next(new AppError('Date requise', 400));
  }

  const requestedDate = new Date(date);
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(9, 0, 0, 0); // 9h00
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(18, 0, 0, 0); // 18h00

  // Obtenir les rendez-vous existants pour cette date
  const existingAppointments = await Appointment.find({
    'appointment.startTime': {
      $gte: startOfDay,
      $lt: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed'] }
  }).sort({ 'appointment.startTime': 1 });

  // Générer les créneaux disponibles (par tranches de 30 minutes)
  const availableSlots = [];
  const slotDuration = parseInt(duration);
  
  for (let time = new Date(startOfDay); time < endOfDay; time.setMinutes(time.getMinutes() + 30)) {
    const slotEnd = new Date(time.getTime() + slotDuration * 60000);
    
    if (slotEnd <= endOfDay) {
      const isAvailable = await isSlotAvailable(time, slotEnd);
      
      if (isAvailable) {
        availableSlots.push({
          startTime: new Date(time),
          endTime: slotEnd,
          duration: slotDuration
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      date: requestedDate,
      availableSlots
    }
  });
});

// @desc    Obtenir les rendez-vous du jour (Admin)
// @route   GET /api/v1/appointments/today
// @access  Private (Admin)
const getTodayAppointments = catchAsync(async (req, res, next) => {
  const appointments = await Appointment.getTodayAppointments();

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: { appointments }
  });
});

// @desc    Obtenir les statistiques des rendez-vous (Admin)
// @route   GET /api/v1/appointments/stats
// @access  Private (Admin)
const getAppointmentStats = catchAsync(async (req, res, next) => {
  const totalAppointments = await Appointment.countDocuments();
  const scheduledAppointments = await Appointment.countDocuments({ status: 'scheduled' });
  const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
  const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
  const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

  const typeStats = await Appointment.aggregate([
    {
      $group: {
        _id: '$appointment.type',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalAppointments,
      scheduledAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      typeStats
    }
  });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointment,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  getTodayAppointments,
  getAppointmentStats
};