'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Mail, Phone, Building, ChevronLeft, ChevronRight, Check, Star, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  features: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  period: 'morning' | 'afternoon' | 'evening';
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerType: 'rdv' | 'devis' | 'reservation';
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, triggerType }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [serviceFilter, setServiceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    rgpdConsent: false
  });

  const services: Service[] = [
    {
      id: '1',
      name: 'Consultation Stratégie Digitale',
      category: 'Conseil',
      duration: 60,
      price: 150,
      description: 'Analyse complète de vos besoins digitaux et recommandations stratégiques',
      features: ['Audit digital', 'Roadmap personnalisée', 'Recommandations techniques']
    },
    {
      id: '2',
      name: 'Développement Site Web',
      category: 'Développement',
      duration: 90,
      price: 0,
      description: 'Discussion détaillée pour votre projet de site web sur mesure',
      features: ['Analyse des besoins', 'Devis personnalisé', 'Planning projet']
    },
    {
      id: '3',
      name: 'Application Mobile',
      category: 'Développement',
      duration: 90,
      price: 0,
      description: 'Conception et développement d\'applications mobiles natives ou hybrides',
      features: ['Étude de faisabilité', 'Prototype', 'Devis détaillé']
    },
    {
      id: '4',
      name: 'E-commerce & Marketplace',
      category: 'E-commerce',
      duration: 75,
      price: 0,
      description: 'Solutions e-commerce complètes avec paiements et gestion des stocks',
      features: ['Analyse concurrentielle', 'Architecture technique', 'Intégrations']
    },
    {
      id: '5',
      name: 'Support Technique',
      category: 'Support',
      duration: 30,
      price: 80,
      description: 'Assistance technique et résolution de problèmes',
      features: ['Diagnostic', 'Résolution rapide', 'Recommandations']
    },
    {
      id: '6',
      name: 'Formation Technique',
      category: 'Formation',
      duration: 120,
      price: 200,
      description: 'Formation personnalisée sur les technologies web modernes',
      features: ['Contenu sur mesure', 'Exercices pratiques', 'Support post-formation']
    }
  ];

  const categories = ['Tous', 'Conseil', 'Développement', 'E-commerce', 'Support', 'Formation'];

  const getModalTitle = () => {
    switch (triggerType) {
      case 'devis':
        return 'Demander un devis';
      case 'reservation':
        return 'Réserver un créneau';
      default:
        return 'Prendre rendez-vous';
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(serviceFilter.toLowerCase()) ||
                         service.description.toLowerCase().includes(serviceFilter.toLowerCase());
    const matchesCategory = categoryFilter === '' || categoryFilter === 'Tous' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    if (date.getDay() === 0) { // Dimanche fermé
      return slots;
    }
    
    const startHour = 9;
    const endHour = isWeekend ? 16 : 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        let period: 'morning' | 'afternoon' | 'evening' = 'morning';
        
        if (hour >= 12 && hour < 17) period = 'afternoon';
        else if (hour >= 17) period = 'evening';
        
        // Simulation de disponibilité
        const available = Math.random() > 0.3;
        
        slots.push({
          time: timeString,
          available,
          period
        });
      }
    }
    
    return slots;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date) => {
    if (date.getDay() === 0) return; // Dimanche bloqué
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulation d'envoi
    console.log('Appointment data:', {
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      client: formData
    });
    
    // Fermer le modal après succès
    onClose();
    
    // Reset
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      rgpdConsent: false
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Passé ou dimanche
  };

  const getDateClassName = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isDisabled = isDateDisabled(date);
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    
    return cn(
      'w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
      {
        'bg-blue-500 text-white shadow-lg': isSelected,
        'bg-gray-800 text-gray-500 cursor-not-allowed': isDisabled,
        'text-gray-500': !isCurrentMonth,
        'text-white hover:bg-gray-700': !isSelected && !isDisabled && isCurrentMonth,
        'ring-2 ring-blue-400': isToday && !isSelected
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[90vh] mx-4 bg-[#0A0A0B] rounded-3xl border border-gray-700/50 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-[#00F5FF]/10 to-[#9D4EDD]/10">
          <div>
            <h2 className="text-2xl font-bold text-white">{getModalTitle()}</h2>
            <div className="flex items-center space-x-4 mt-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white' 
                      : 'bg-gray-700 text-gray-400'
                  )}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={cn(
                      'w-12 h-0.5 mx-2 transition-all',
                      currentStep > step ? 'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD]' : 'bg-gray-700'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(90vh-100px)] overflow-y-auto p-6">
          
          {/* Étape 1: Sélection du service */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Choisissez votre service</h3>
                <p className="text-gray-400">Sélectionnez le type de prestation qui vous intéresse</p>
              </div>

              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white appearance-none cursor-pointer"
                  >
                    {categories.map(category => (
                      <option key={category} value={category === 'Tous' ? '' : category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="group cursor-pointer glass-card p-6 rounded-2xl border border-gray-700/50 hover:border-[#00F5FF]/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2 group-hover:text-[#00F5FF] transition-colors">
                          {service.name}
                        </h4>
                        <span className="px-2 py-1 bg-[#9D4EDD]/20 text-[#9D4EDD] rounded-full text-xs">
                          {service.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#00F5FF]">
                          {service.price === 0 ? 'Gratuit' : `${service.price}€`}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration}min
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="space-y-2">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Choix du créneau */}
          {currentStep === 2 && selectedService && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Choisissez votre créneau</h3>
                  <p className="text-gray-400">
                    Service sélectionné: <span className="text-[#00F5FF]">{selectedService.name}</span> ({selectedService.duration}min)
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendrier */}
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold">Sélectionnez une date</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-medium min-w-[140px] text-center">
                        {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Jours de la semaine */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Grille du calendrier */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays(currentMonth).map((date, index) => (
                      <button
                        key={index}
                        onClick={() => !isDateDisabled(date) && handleDateSelect(date)}
                        className={getDateClassName(date)}
                        disabled={isDateDisabled(date)}
                      >
                        {date.getDate()}
                      </button>
                    ))}
                  </div>

                  {/* Légende */}
                  <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-400">Disponible</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-400">Indisponible</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-400">Sélectionné</span>
                    </div>
                  </div>
                </div>

                {/* Créneaux horaires */}
                <div className="glass-card p-6 rounded-2xl">
                  <h4 className="text-lg font-semibold mb-6">
                    {selectedDate ? (
                      <>Créneaux pour le {selectedDate.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}</>
                    ) : (
                      'Sélectionnez d\'abord une date'
                    )}
                  </h4>

                  {selectedDate ? (
                    selectedDate.getDay() === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-500 mb-2">Fermé le dimanche</div>
                        <p className="text-sm text-gray-400">Veuillez choisir un autre jour</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Boutons rapides */}
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                            Matin
                          </button>
                          <button className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                            Après-midi
                          </button>
                          <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            Soirée
                          </button>
                        </div>

                        {/* Créneaux */}
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {['morning', 'afternoon', 'evening'].map((period) => {
                            const periodSlots = generateTimeSlots(selectedDate).filter(slot => slot.period === period);
                            const periodName = period === 'morning' ? 'Matin' : period === 'afternoon' ? 'Après-midi' : 'Soirée';
                            
                            if (periodSlots.length === 0) return null;
                            
                            return (
                              <div key={period}>
                                <h5 className="text-sm font-medium text-gray-400 mb-3">{periodName}</h5>
                                <div className="grid grid-cols-3 gap-2">
                                  {periodSlots.map((slot) => (
                                    <button
                                      key={slot.time}
                                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                                      disabled={!slot.available}
                                      className={cn(
                                        'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                                        slot.available
                                          ? selectedTime === slot.time
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                      )}
                                    >
                                      {slot.time}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Sélectionnez une date pour voir les créneaux disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Informations client */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Vos informations</h3>
                  <p className="text-gray-400">
                    RDV: {selectedService?.name} le {selectedDate?.toLocaleDateString('fr-FR')} à {selectedTime}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prénom <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nom <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Entreprise</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                      placeholder="Nom de votre entreprise"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white resize-none"
                    placeholder="Décrivez brièvement votre projet ou vos besoins..."
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="rgpd"
                    required
                    checked={formData.rgpdConsent}
                    onChange={(e) => setFormData({...formData, rgpdConsent: e.target.checked})}
                    className="mt-1 w-4 h-4 text-[#00F5FF] bg-gray-800 border-gray-600 rounded focus:ring-[#00F5FF]"
                  />
                  <label htmlFor="rgpd" className="text-sm text-gray-400">
                    J'accepte que mes données soient utilisées pour répondre à ma demande. 
                    <a href="#" className="text-[#00F5FF] hover:underline ml-1">Politique de confidentialité</a>
                  </label>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] rounded-xl text-white font-medium hover:shadow-lg transition-all"
                  >
                    Confirmer le rendez-vous
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;