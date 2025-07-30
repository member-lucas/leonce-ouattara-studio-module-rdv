'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  Calendar,
  DollarSign,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProjectForm {
  title: string;
  description: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  clientName: string;
  budget: string;
  featured: boolean;
  isPublished: boolean;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  images: string[];
}

export default function NewProject() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newTech, setNewTech] = useState('');
  const [formData, setFormData] = useState<ProjectForm>({
    title: '',
    description: '',
    category: 'web',
    status: 'planning',
    startDate: '',
    endDate: '',
    clientName: '',
    budget: '',
    featured: false,
    isPublished: false,
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    images: []
  });

  const categories = [
    { value: 'web', label: 'Développement Web' },
    { value: 'mobile', label: 'Application Mobile' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'api', label: 'API/Backend' },
    { value: 'desktop', label: 'Application Desktop' },
    { value: 'other', label: 'Autre' }
  ];

  const statuses = [
    { value: 'planning', label: 'Planification' },
    { value: 'development', label: 'Développement' },
    { value: 'testing', label: 'Tests' },
    { value: 'completed', label: 'Terminé' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'archived', label: 'Archivé' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined
        })
      });

      if (response.ok) {
        router.push('/admin/projects');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création du projet');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erreur lors de la création du projet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTech.trim()]
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('folder', 'projects');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.data.image.url]
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Nouveau Projet</h1>
            <p className="text-gray-400">Ajoutez un nouveau projet à votre portfolio</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Information */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Informations de base</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titre du projet *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                placeholder="Nom du projet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                placeholder="Nom du client"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white resize-none"
              placeholder="Description détaillée du projet"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Statut *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Budget (€)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Dates du projet</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de début *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de fin
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Technologies utilisées</h2>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
              placeholder="Ajouter une technologie"
            />
            <button
              type="button"
              onClick={addTechnology}
              className="px-4 py-3 bg-[#00F5FF] text-white rounded-xl hover:bg-[#0099CC] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.technologies.map((tech, index) => (
              <span
                key={index}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
              >
                <span>{tech}</span>
                <button
                  type="button"
                  onClick={() => removeTechnology(tech)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Liens du projet</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL GitHub
              </label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL Live
              </label>
              <input
                type="url"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Images du projet</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl cursor-pointer hover:border-[#00F5FF] transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Ajouter une image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Project image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Paramètres</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 text-[#00F5FF] bg-gray-800 border-gray-600 rounded focus:ring-[#00F5FF]"
              />
              <label htmlFor="featured" className="flex items-center space-x-2 text-gray-300">
                <Star className="w-4 h-4" />
                <span>Projet en vedette</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="w-4 h-4 text-[#00F5FF] bg-gray-800 border-gray-600 rounded focus:ring-[#00F5FF]"
              />
              <label htmlFor="isPublished" className="flex items-center space-x-2 text-gray-300">
                {formData.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>Publier le projet</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Création...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Créer le projet</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}