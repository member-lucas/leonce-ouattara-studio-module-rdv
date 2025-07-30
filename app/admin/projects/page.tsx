'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ExternalLink, 
  Github,
  Search,
  Filter,
  Calendar,
  Star,
  AlertCircle
} from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  startDate: string;
  endDate?: string;
  clientName?: string;
  budget?: number;
  featured: boolean;
  isPublished: boolean;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  analytics: {
    views: number;
    likes: number;
  };
  createdAt: string;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/v1/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProjects(projects.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || project.category === categoryFilter;
    const matchesStatus = !statusFilter || project.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(projects.map(p => p.category))];
  const statuses = [...new Set(projects.map(p => p.status))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00F5FF]/30 rounded-full animate-spin mb-4 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00F5FF] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Projets</h1>
          <p className="text-gray-400">Gérez votre portfolio de projets</p>
        </div>
        <a
          href="/admin/projects/new"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] rounded-xl text-white font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Projet</span>
        </a>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
        <div className="grid md:grid-cols-4 gap-4">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
          >
            <option value="">Tous les statuts</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-center text-gray-400">
            {filteredProjects.length} projet(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-500 mb-6">Commencez par créer votre premier projet</p>
          <a
            href="/admin/projects/new"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#00F5FF] text-white rounded-xl hover:bg-[#0099CC] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Créer un projet</span>
          </a>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project._id} className="glass-card p-6 rounded-2xl border border-gray-700/50 hover:border-[#00F5FF]/30 transition-all">
              
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">{project.title}</h3>
                    {project.featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-[#00F5FF]/20 text-[#00F5FF] rounded-full text-xs">
                      {project.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'development' ? 'bg-blue-500/20 text-blue-400' :
                      project.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {!project.isPublished && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full" title="Non publié" />
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1 mb-4">
                {project.technologies.slice(0, 3).map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{project.analytics.views}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
                </div>
                {project.budget && (
                  <div className="text-[#00F5FF] font-medium">
                    {project.budget}€
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                <div className="flex items-center space-x-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Site live"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`/admin/projects/${project._id}/edit`}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}