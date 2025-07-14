const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  client: {
    firstName: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Numéro de téléphone invalide']
    },
    company: {
      name: String,
      website: String,
      size: {
        type: String,
        enum: ['startup', 'small', 'medium', 'large', 'enterprise']
      }
    },
    timezone: {
      type: String,
      default: 'Europe/Paris'
    }
  },
  appointment: {
    title: {
      type: String,
      required: [true, 'Le titre du rendez-vous est requis'],
      trim: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    type: {
      type: String,
      required: [true, 'Le type de rendez-vous est requis'],
      enum: {
        values: ['consultation', 'project-discussion', 'demo', 'support', 'follow-up', 'other'],
        message: 'Type de rendez-vous invalide'
      }
    },
    duration: {
      type: Number,
      required: [true, 'La durée est requise'],
      min: [15, 'La durée minimale est de 15 minutes'],
      max: [240, 'La durée maximale est de 4 heures']
    },
    startTime: {
      type: Date,
      required: [true, 'L\'heure de début est requise']
    },
    endTime: {
      type: Date,
      required: [true, 'L\'heure de fin est requise']
    },
    location: {
      type: {
        type: String,
        enum: ['online', 'office', 'client-office', 'phone', 'other'],
        default: 'online'
      },
      details: String,
      address: String,
      meetingLink: String,
      meetingId: String,
      meetingPassword: String
    }
  },
  project: {
    type: {
      type: String,
      enum: ['website', 'webapp', 'mobile', 'ecommerce', 'api', 'consulting', 'maintenance', 'other']
    },
    budget: {
      range: {
        type: String,
        enum: ['1000-5000', '5000-10000', '10000-20000', '20000-50000', '50000+', 'to-discuss']
      },
      currency: {
        type: String,
        default: 'EUR'
      }
    },
    timeline: {
      type: String,
      enum: ['asap', '1-month', '2-3-months', '3-6-months', '6-months+', 'flexible']
    },
    description: String,
    requirements: [String],
    technologies: [String]
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no-show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social', 'email', 'phone', 'return-client'],
    default: 'website'
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      default: 'email'
    },
    timing: {
      type: Number, // minutes avant le RDV
      default: 1440 // 24h
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }],
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    completed: {
      type: Boolean,
      default: false
    },
    notes: String
  },
  outcome: {
    result: {
      type: String,
      enum: ['project-accepted', 'project-declined', 'needs-follow-up', 'information-only', 'other']
    },
    nextSteps: [String],
    estimatedValue: Number,
    notes: String
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  confirmationToken: String,
  cancellationToken: String,
  rescheduleToken: String,
  gdprConsent: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
appointmentSchema.index({ 'client.email': 1 });
appointmentSchema.index({ 'appointment.startTime': 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ assignedTo: 1 });
appointmentSchema.index({ createdAt: -1 });

// Virtual pour le nom complet du client
appointmentSchema.virtual('client.fullName').get(function() {
  return `${this.client.firstName} ${this.client.lastName}`;
});

// Virtual pour vérifier si le RDV est dans le futur
appointmentSchema.virtual('isFuture').get(function() {
  return this.appointment.startTime > new Date();
});

// Virtual pour vérifier si le RDV est aujourd'hui
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointment.startTime);
  return appointmentDate.toDateString() === today.toDateString();
});

// Middleware pre-save pour générer les tokens et calculer l'heure de fin
appointmentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.confirmationToken = require('crypto').randomBytes(32).toString('hex');
    this.cancellationToken = require('crypto').randomBytes(32).toString('hex');
    this.rescheduleToken = require('crypto').randomBytes(32).toString('hex');
  }
  
  // Calculer l'heure de fin si pas définie
  if (this.appointment.startTime && this.appointment.duration && !this.appointment.endTime) {
    this.appointment.endTime = new Date(this.appointment.startTime.getTime() + (this.appointment.duration * 60000));
  }
  
  next();
});

// Méthode pour confirmer le RDV
appointmentSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.confirmationToken = undefined;
  return this.save();
};

// Méthode pour annuler le RDV
appointmentSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  if (reason) {
    this.notes.push({
      content: `Annulé: ${reason}`,
      addedAt: new Date()
    });
  }
  return this.save();
};

// Méthode pour reprogrammer le RDV
appointmentSchema.methods.reschedule = function(newStartTime, newDuration) {
  this.appointment.startTime = newStartTime;
  if (newDuration) {
    this.appointment.duration = newDuration;
  }
  this.appointment.endTime = new Date(newStartTime.getTime() + (this.appointment.duration * 60000));
  this.status = 'rescheduled';
  return this.save();
};

// Méthode pour marquer comme terminé
appointmentSchema.methods.complete = function(outcomeData) {
  this.status = 'completed';
  if (outcomeData) {
    this.outcome = { ...this.outcome, ...outcomeData };
  }
  return this.save();
};

// Méthode pour ajouter une note
appointmentSchema.methods.addNote = function(noteData) {
  this.notes.push(noteData);
  return this.save();
};

// Méthode statique pour obtenir les RDV du jour
appointmentSchema.statics.getTodayAppointments = function() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  return this.find({
    'appointment.startTime': {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed'] }
  }).sort({ 'appointment.startTime': 1 });
};

// Méthode statique pour obtenir les RDV à venir
appointmentSchema.statics.getUpcoming = function(days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    'appointment.startTime': {
      $gte: now,
      $lte: futureDate
    },
    status: { $in: ['scheduled', 'confirmed'] }
  }).sort({ 'appointment.startTime': 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);