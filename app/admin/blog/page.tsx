'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  Calendar,
  Star,
  AlertCircle,
  Clock,
  Heart,
  MessageCircle
} from 'lucide-react';

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  isPublished: boolean;
  featured: boolean;
  publishedAt?: string;
  readingTime: number;
  tags: string[];
  analytics: {
    views: number;
    likes: number;
    comments: number;
  };
  author: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/blog', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/v1/blog/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPosts(posts.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/v1/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
          publishedAt: !currentStatus ? new Date() : null
        })
      });

      if (response.ok) {
        setPosts(posts.map(p => 
          p._id === id 
            ? { ...p, isPublished: !currentStatus, publishedAt: !currentStatus ? new Date().toISOString() : undefined }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || post.category === categoryFilter;
    const matchesStatus = !statusFilter || post.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(posts.map(p => p.category))];
  const statuses = [...new Set(posts.map(p => p.status))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00F5FF]/30 rounded-full animate-spin mb-4 mx-auto">
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00F5FF] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Blog</h1>
          <p className="text-gray-400">Gérez vos articles de blog</p>
        </div>
        <a
          href="/admin/blog/new"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] rounded-xl text-white font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel Article</span>
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
              placeholder="Rechercher un article..."
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
            {filteredPosts.length} article(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun article trouvé</h3>
          <p className="text-gray-500 mb-6">Commencez par créer votre premier article</p>
          <a
            href="/admin/blog/new"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#00F5FF] text-white rounded-xl hover:bg-[#0099CC] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Créer un article</span>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post._id} className="glass-card p-6 rounded-2xl border border-gray-700/50 hover:border-[#00F5FF]/30 transition-all">
              
              <div className="flex items-start justify-between">
                
                {/* Post Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                    {post.featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      post.status === 'review' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {post.status}
                    </span>
                    {!post.isPublished && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                        Non publié
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString('fr-FR')
                          : new Date(post.createdAt).toLocaleDateString('fr-FR')
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readingTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.analytics.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.analytics.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.analytics.comments}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <span className="px-2 py-1 bg-[#00F5FF]/20 text-[#00F5FF] rounded-full text-xs">
                      {post.category}
                    </span>
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => togglePublish(post._id, post.isPublished)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.isPublished 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    title={post.isPublished ? 'Dépublier' : 'Publier'}
                  >
                    {post.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <a
                    href={`/admin/blog/${post._id}/edit`}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                  
                  <button
                    onClick={() => handleDelete(post._id)}
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