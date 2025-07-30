'use client';

import { useEffect, useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  Settings as SettingsIcon,
  Globe,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Search,
  Eye,
  Shield,
  Palette,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface SiteSetting {
  _id: string;
  key: string;
  value: any;
  type: string;
  category: string;
  description: string;
  isPublic: boolean;
  isEditable: boolean;
}

interface GroupedSettings {
  [category: string]: SiteSetting[];
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [changes, setChanges] = useState<Record<string, any>>({});

  const categoryIcons = {
    general: <Globe className="w-5 h-5" />,
    contact: <Mail className="w-5 h-5" />,
    social: <Twitter className="w-5 h-5" />,
    seo: <Search className="w-5 h-5" />,
    appearance: <Palette className="w-5 h-5" />,
    analytics: <BarChart3 className="w-5 h-5" />,
    security: <Shield className="w-5 h-5" />
  };

  const categoryLabels = {
    general: 'Général',
    contact: 'Contact',
    social: 'Réseaux Sociaux',
    seo: 'SEO',
    appearance: 'Apparence',
    analytics: 'Analytics',
    security: 'Sécurité'
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any, type: string) => {
    let processedValue = value;
    
    // Traitement selon le type
    if (type === 'boolean') {
      processedValue = value === 'true' || value === true;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'array') {
      processedValue = typeof value === 'string' ? value.split(',').map(v => v.trim()) : value;
    }

    setChanges(prev => ({
      ...prev,
      [key]: processedValue
    }));
  };

  const saveSettings = async () => {
    if (Object.keys(changes).length === 0) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const settingsToUpdate = Object.entries(changes).map(([key, value]) => ({
        key,
        value
      }));

      const response = await fetch('/api/v1/admin/settings/bulk/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: settingsToUpdate })
      });

      if (response.ok) {
        setChanges({});
        await fetchSettings();
        alert('Paramètres sauvegardés avec succès !');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/admin/settings/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setChanges({});
        await fetchSettings();
        alert('Paramètres réinitialisés avec succès !');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Erreur lors de la réinitialisation');
    }
  };

  const renderSettingInput = (setting: SiteSetting) => {
    const currentValue = changes[setting.key] !== undefined ? changes[setting.key] : setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <select
            value={currentValue.toString()}
            onChange={(e) => handleSettingChange(setting.key, e.target.value, setting.type)}
            disabled={!setting.isEditable}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white disabled:opacity-50"
          >
            <option value="true">Activé</option>
            <option value="false">Désactivé</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value, setting.type)}
            disabled={!setting.isEditable}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white disabled:opacity-50"
          />
        );

      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(currentValue) ? currentValue.join(', ') : currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value, setting.type)}
            disabled={!setting.isEditable}
            placeholder="Séparez les valeurs par des virgules"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white disabled:opacity-50"
          />
        );

      case 'object':
        return (
          <textarea
            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting.key, parsed, setting.type);
              } catch {
                handleSettingChange(setting.key, e.target.value, setting.type);
              }
            }}
            disabled={!setting.isEditable}
            rows={4}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white font-mono text-sm disabled:opacity-50 resize-none"
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value, setting.type)}
            disabled={!setting.isEditable}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white disabled:opacity-50"
          />
        );
    }
  };

  const filteredSettings = Object.entries(settings).reduce((acc, [category, categorySettings]) => {
    if (selectedCategory && category !== selectedCategory) return acc;
    
    const filtered = categorySettings.filter(setting =>
      setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    
    return acc;
  }, {} as GroupedSettings);

  const categories = Object.keys(settings);
  const hasChanges = Object.keys(changes).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00F5FF]/30 rounded-full animate-spin mb-4 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00F5FF] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuration du Site</h1>
          <p className="text-gray-400">Gérez les paramètres globaux de votre site</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasChanges && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{Object.keys(changes).length} modification(s) non sauvegardée(s)</span>
            </div>
          )}
          
          <button
            onClick={resetToDefaults}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>
          
          <button
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Sauvegarder</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 rounded-2xl border border-gray-700/50 sticky top-6">
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none text-white text-sm"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  selectedCategory === '' 
                    ? 'bg-[#00F5FF]/20 text-[#00F5FF]' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="text-sm">Tous les paramètres</span>
              </button>
              
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    selectedCategory === category 
                      ? 'bg-[#00F5FF]/20 text-[#00F5FF]' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {categoryIcons[category as keyof typeof categoryIcons] || <SettingsIcon className="w-4 h-4" />}
                  <span className="text-sm">{categoryLabels[category as keyof typeof categoryLabels] || category}</span>
                  <span className="ml-auto text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    {settings[category]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {Object.entries(filteredSettings).map(([category, categorySettings]) => (
            <div key={category} className="glass-card p-6 rounded-2xl border border-gray-700/50">
              
              {/* Category Header */}
              <div className="flex items-center space-x-3 mb-6">
                {categoryIcons[category as keyof typeof categoryIcons] || <SettingsIcon className="w-6 h-6" />}
                <h2 className="text-xl font-semibold text-white">
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </h2>
                <span className="text-sm text-gray-400">
                  ({categorySettings.length} paramètre{categorySettings.length > 1 ? 's' : ''})
                </span>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {categorySettings.map(setting => (
                  <div key={setting.key} className="border-b border-gray-700/30 pb-6 last:border-b-0 last:pb-0">
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-white">{setting.key}</h3>
                          <div className="flex items-center space-x-2">
                            {setting.isPublic && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>Public</span>
                              </span>
                            )}
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                              {setting.type}
                            </span>
                            {changes[setting.key] !== undefined && (
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                                Modifié
                              </span>
                            )}
                          </div>
                        </div>
                        {setting.description && (
                          <p className="text-gray-400 text-sm">{setting.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredSettings).length === 0 && (
            <div className="text-center py-12">
              <SettingsIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun paramètre trouvé</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Essayez avec d\'autres termes de recherche' : 'Aucun paramètre disponible'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}