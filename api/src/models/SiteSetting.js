const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'La clé du paramètre est requise'],
    unique: true,
    trim: true,
    maxlength: [100, 'La clé ne peut pas dépasser 100 caractères']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'La valeur du paramètre est requise']
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'contact', 'social', 'seo', 'appearance', 'analytics', 'security'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  isPublic: {
    type: Boolean,
    default: false // Si true, accessible via API publique
  },
  isEditable: {
    type: Boolean,
    default: true // Si false, ne peut pas être modifié via l'interface
  },
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    min: Number,
    max: Number,
    pattern: String,
    options: [String] // Pour les valeurs avec choix limités
  },
  lastModifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
siteSettingSchema.index({ key: 1 });
siteSettingSchema.index({ category: 1 });
siteSettingSchema.index({ isPublic: 1 });

// Méthode statique pour obtenir les paramètres par catégorie
siteSettingSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ key: 1 });
};

// Méthode statique pour obtenir les paramètres publics
siteSettingSchema.statics.getPublicSettings = function() {
  return this.find({ isPublic: true }).select('key value type category');
};

// Méthode statique pour obtenir une valeur par clé
siteSettingSchema.statics.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Méthode statique pour définir une valeur
siteSettingSchema.statics.setValue = async function(key, value, userId = null) {
  const setting = await this.findOneAndUpdate(
    { key },
    { 
      value, 
      lastModifiedBy: userId,
      updatedAt: new Date()
    },
    { 
      new: true, 
      upsert: false 
    }
  );
  
  if (!setting) {
    throw new Error(`Paramètre '${key}' non trouvé`);
  }
  
  return setting;
};

// Middleware pre-save pour la validation
siteSettingSchema.pre('save', function(next) {
  // Validation basée sur le type
  if (this.type === 'number' && typeof this.value !== 'number') {
    return next(new Error('La valeur doit être un nombre'));
  }
  
  if (this.type === 'boolean' && typeof this.value !== 'boolean') {
    return next(new Error('La valeur doit être un booléen'));
  }
  
  if (this.type === 'array' && !Array.isArray(this.value)) {
    return next(new Error('La valeur doit être un tableau'));
  }
  
  // Validation des options
  if (this.validation.options && this.validation.options.length > 0) {
    if (!this.validation.options.includes(this.value)) {
      return next(new Error(`La valeur doit être l'une des options: ${this.validation.options.join(', ')}`));
    }
  }
  
  // Validation des limites numériques
  if (this.type === 'number') {
    if (this.validation.min !== undefined && this.value < this.validation.min) {
      return next(new Error(`La valeur doit être supérieure ou égale à ${this.validation.min}`));
    }
    if (this.validation.max !== undefined && this.value > this.validation.max) {
      return next(new Error(`La valeur doit être inférieure ou égale à ${this.validation.max}`));
    }
  }
  
  next();
});

module.exports = mongoose.model('SiteSetting', siteSettingSchema);