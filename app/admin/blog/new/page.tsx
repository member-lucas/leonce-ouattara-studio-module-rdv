'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  Eye,
  EyeOff,
  Star,
  Calendar
} from 'lucide-react';

// Import dynamique de ReactQuill pour éviter les erreurs SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface BlogForm {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  isPublished: boolean;
  featured: boolean;
  tags: string[];
  featuredImage: {
    url: string;
    alt: string;
    caption: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
}

export default function NewBlogPost() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [formData, setFormData] = useState<BlogForm>({
    title: '',
    excerpt: '',
    content: '',
    category: 'tech',
    status: 'draft',
    isPublished: false,
    featured: false,
    tags: [],
    featuredImage: {
      url: '',
      alt: '',
      caption: ''
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    }
  });

  const categories = [
    { value: 'tech', label: 'Technologie' },
    { value: 'tutorial', label: 'Tutoriel' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'news', label: 'Actualités' },
    { value: 'case-study', label: 'Étude de cas' },
    { value: 'tips', label: 'Conseils' },
    { value: 'other', label: 'Autre' }
  ];

  const statuses = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'review', label: 'En révision' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' }
  ];

  // Configuration de ReactQuill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'script', 'indent', 'direction',
    'color', 'background', 'align', 'link', 'image', 'video'
  ];

  useEffect(() => {
    // Auto-générer le meta title si vide
    if (formData.title && !formData.seo.metaTitle) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          metaTitle: prev.title
        }
      }));
    }
  }, [formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/admin/blog');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création de l\'article');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erreur lors de la création de l\'article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof BlogForm],
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.seo.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...prev.seo.keywords, newKeyword.trim()]
        }
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter(k => k !== keyword)
      }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('folder', 'blog');

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
          featuredImage: {
            ...prev.featuredImage,
            url: data.data.image.url
          }
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
            <h1 className="text-3xl font-bold text-white">Nouvel Article</h1>
            <p className="text-gray-400">Créez un nouvel article de blog</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Information */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Informations de base</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titre de l'article *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                placeholder="Titre accrocheur de votre article"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Extrait *
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                required
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white resize-none"
                placeholder="Résumé court de l'article (max 500 caractères)"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.excerpt.length}/500
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Contenu de l'article</h2>
          
          <div className="bg-white rounded-xl overflow-hidden">
            <ReactQuill
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              modules={quillModules}
              formats={quillFormats}
              style={{ minHeight: '400px' }}
              placeholder="Rédigez votre article ici..."
            />
          </div>
        </div>

        {/* Featured Image */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Image à la une</h2>
          
          <div className="space-y-4">
            {!formData.featuredImage.url ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer hover:border-[#00F5FF] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-400">Cliquez pour ajouter une image</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={formData.featuredImage.url}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    featuredImage: { url: '', alt: '', caption: '' }
                  }))}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formData.featuredImage.url && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texte alternatif
                  </label>
                  <input
                    type="text"
                    name="featuredImage.alt"
                    value={formData.featuredImage.alt}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                    placeholder="Description de l'image"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Légende
                  </label>
                  <input
                    type="text"
                    name="featuredImage.caption"
                    value={formData.featuredImage.caption}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                    placeholder="Légende de l'image"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Tags</h2>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
              placeholder="Ajouter un tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-3 bg-[#00F5FF] text-white rounded-xl hover:bg-[#0099CC] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Optimisation SEO</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                name="seo.metaTitle"
                value={formData.seo.metaTitle}
                onChange={handleChange}
                maxLength={60}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                placeholder="Titre pour les moteurs de recherche"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.seo.metaTitle.length}/60
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta Description
              </label>
              <textarea
                name="seo.metaDescription"
                value={formData.seo.metaDescription}
                onChange={handleChange}
                maxLength={160}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white resize-none"
                placeholder="Description pour les moteurs de recherche"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.seo.metaDescription.length}/160
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mots-clés SEO
              </label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-[#00F5FF] focus:outline-none text-white"
                  placeholder="Ajouter un mot-clé"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-3 bg-[#9D4EDD] text-white rounded-xl hover:bg-[#7B2CBF] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.seo.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="flex items-center space-x-2 px-3 py-1 bg-[#9D4EDD]/20 text-[#9D4EDD] rounded-full text-sm"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Paramètres de publication</h2>
          
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
                <span>Article en vedette</span>
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
                <span>Publier l'article</span>
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
                <span>Créer l'article</span>
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