'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  FolderOpen, 
  MessageSquare, 
  Eye,
  Heart,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  projects: {
    total: number;
    published: number;
    featured: number;
    categoryStats: Array<{
      _id: string;
      count: number;
      totalViews: number;
      totalLikes: number;
    }>;
  };
  blog: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    featuredPosts: number;
    categoryStats: Array<{
      _id: string;
      count: number;
      totalViews: number;
      totalLikes: number;
    }>;
  };
  contacts: {
    totalContacts: number;
    unreadContacts: number;
    spamContacts: number;
    statusBreakdown: Array<{
      _id: string;
      count: number;
    }>;
  };
  newsletter: {
    totalSubscribers: number;
    activeSubscribers: number;
    statusBreakdown: Array<{
      _id: string;
      count: number;
    }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const [projectsRes, blogRes, contactsRes, newsletterRes] = await Promise.all([
        fetch('/api/v1/projects/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v1/blog/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v1/contact/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v1/newsletter/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [projects, blog, contacts, newsletter] = await Promise.all([
        projectsRes.json(),
        blogRes.json(),
        contactsRes.json(),
        newsletterRes.json()
      ]);

      setStats({
        projects: projects.data,
        blog: blog.data,
        contacts: contacts.data,
        newsletter: newsletter.data
      });
    } catch (error) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Stats fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#00F5FF', '#9D4EDD', '#00BFFF', '#DA70D6', '#40E0D0'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00F5FF]/30 rounded-full animate-spin mb-4 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00F5FF] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-[#00F5FF] text-white rounded-lg hover:bg-[#0099CC] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Vue d'ensemble de votre site</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Projects Card */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#00F5FF] to-[#0099CC] rounded-xl flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              +{stats?.projects.featured || 0} featured
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats?.projects.total || 0}</h3>
          <p className="text-gray-400 text-sm">Projets totaux</p>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.projects.published || 0} publiés
          </div>
        </div>

        {/* Blog Card */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
              {stats?.blog.draftPosts || 0} brouillons
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats?.blog.totalPosts || 0}</h3>
          <p className="text-gray-400 text-sm">Articles de blog</p>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.blog.publishedPosts || 0} publiés
          </div>
        </div>

        {/* Contacts Card */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#00BFFF] to-[#40E0D0] rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
              {stats?.contacts.unreadContacts || 0} non lus
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats?.contacts.totalContacts || 0}</h3>
          <p className="text-gray-400 text-sm">Messages reçus</p>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.contacts.spamContacts || 0} spam détectés
          </div>
        </div>

        {/* Newsletter Card */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#DA70D6] to-[#9370DB] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
              {Math.round(((stats?.newsletter.activeSubscribers || 0) / (stats?.newsletter.totalSubscribers || 1)) * 100)}% actifs
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats?.newsletter.totalSubscribers || 0}</h3>
          <p className="text-gray-400 text-sm">Abonnés newsletter</p>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.newsletter.activeSubscribers || 0} actifs
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Projects by Category */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-6">Projets par Catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.projects.categoryStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="_id" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#00F5FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blog Categories */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-6">Articles par Catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.blog.categoryStats || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ _id, count }) => `${_id}: ${count}`}
                >
                  {(stats?.blog.categoryStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Activité Récente</h3>
          <Activity className="w-5 h-5 text-[#00F5FF]" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-white text-sm">Nouveau message de contact reçu</p>
              <p className="text-gray-400 text-xs">Il y a 2 heures</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-white text-sm">Article de blog publié</p>
              <p className="text-gray-400 text-xs">Il y a 5 heures</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-white text-sm">Nouveau projet ajouté au portfolio</p>
              <p className="text-gray-400 text-xs">Hier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <a
          href="/admin/blog/new"
          className="glass-card p-6 rounded-2xl border border-gray-700/50 hover:border-[#00F5FF]/50 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Nouvel Article</h4>
              <p className="text-gray-400 text-sm">Créer un article de blog</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/projects/new"
          className="glass-card p-6 rounded-2xl border border-gray-700/50 hover:border-[#9D4EDD]/50 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#9D4EDD] to-[#DA70D6] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Nouveau Projet</h4>
              <p className="text-gray-400 text-sm">Ajouter au portfolio</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/contacts"
          className="glass-card p-6 rounded-2xl border border-gray-700/50 hover:border-[#00BFFF]/50 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#00BFFF] to-[#40E0D0] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Messages</h4>
              <p className="text-gray-400 text-sm">Gérer les contacts</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}