// app/admin/blog/new/page.tsx
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

// Import des composants de formulaire et du hook useForm
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormSubmitButton,
  useForm
} from '@/components/forms';

// Import dynamique de ReactQuill pour éviter les erreurs SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function NewBlogPost() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // --- Configuration du formulaire avec useForm ---
  const form = useForm({
    fields: {
      title: {
        rules: { required: true, minLength: 5, maxLength: 200 },
        validateOnChange: true,
      },
      excerpt: {
        rules: { required: true, minLength: 10, maxLength: 500 },
        validateOnChange: true,
      },
      content: {
        rules: { required: true, minLength: 100 },
        validateOnChange: false, // La validation du contenu riche peut être lourde en temps réel
      },
      category: {
        rules: { required: true },
        validateOnChange: true,
        initialValue: 'tech',
      },
      status: {
        rules: { required: true },
        validateOnChange: true,
        initialValue: 'draft',
      },
      isPublished: {
        initialValue: false,
      },
      featured: {
        initialValue: false,
      },
      tags: {
        initialValue: [],
      },
      featuredImage: {
        initialValue: { url: '', alt: '', caption: '' },
      },
      'featuredImage.url': {
        rules: { url: true }, // Valider l'URL de l'image si elle est présente
        validateOnChange: true,
      },
      'featuredImage.alt': {
        rules: { maxLength: 200 },
        validateOnChange: true,
      },
      'featuredImage.caption': {
        rules: { maxLength: 300 },
        validateOnChange: true,
      },
      seo: {
        initialValue: { metaTitle: '', metaDescription: '', keywords: [] },
      },
      'seo.metaTitle': {
        rules: { maxLength: 60 },
        validateOnChange: true,
      },
      'seo.metaDescription': {
        rules: { maxLength: 160 },
        validateOnChange: true,
      },
      'seo.keywords': {
        initialValue: [],
      },
    },
    validateOnSubmit: true, // Valider tout le formulaire à la soumission
    resetOnSubmit: true, // Réinitialiser le formulaire après soumission réussie
  });
  // --- Fin de la configuration useForm ---

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
    if (form.values.title && !form.values.seo.metaTitle) {
      form.setFieldValue('seo.metaTitle', form.values.title);
    }
  }, [form.values.title]); // Dépend de form.values.title

  // --- Fonction de soumission du formulaire ---
  const handleSubmit = form.onSubmit(async (values) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values) // Utilise les valeurs validées par useForm
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
  });
  // --- Fin de la fonction de soumission ---

  const addTag = () => {
    if (newTag.trim() && !form.values.tags.includes(newTag.trim())) {
      form.setFieldValue('tags', [...form.values.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    form.setFieldValue('tags', form.values.tags.filter((t: string) => t !== tag));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !form.values.seo.keywords.includes(newKeyword.trim())) {
      form.setFieldValue('seo.keywords', [...form.values.seo.keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    form.setFieldValue('seo.keywords', form.values.seo.keywords.filter((k: string) => k !== keyword));
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
        form.setFieldValue('featuredImage.url', data.data.image.url);
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
            <FormField>
              <FormInput
                {...form.getFieldProps('title')}
                label="Titre de l'article"
                placeholder="Titre accrocheur de votre article"
                required
              />
            </FormField>

            <FormField>
              <FormTextarea
                {...form.getFieldProps('excerpt')}
                label="Extrait"
                placeholder="Résumé court de l'article (max 500 caractères)"
                rows={3}
                maxLength={500}
                counter
                required
              />
            </FormField>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField>
                <FormSelect
                  {...form.getFieldProps('category')}
                  label="Catégorie"
                  options={categories}
                  required
                />
              </FormField>

              <FormField>
                <FormSelect
                  {...form.getFieldProps('status')}
                  label="Statut"
                  options={statuses}
                  required
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Contenu de l'article</h2>

          <FormField error={form.touched.content && form.errors.content && form.errors.content.length > 0}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contenu *
            </label>
            <div className="bg-white rounded-xl overflow-hidden">
              <ReactQuill
                value={form.values.content}
                onChange={(content) => form.setFieldValue('content', content)}
                onBlur={() => form.setFieldTouched('content', true)}
                modules={quillModules}
                formats={quillFormats}
                style={{ minHeight: '400px' }}
                placeholder="Rédigez votre article ici..."
              />
            </div>
            {form.touched.content && form.errors.content && form.errors.content.length > 0 && (
              <p className="text-xs text-red-400 mt-1">{form.errors.content[0]}</p>
            )}
          </FormField>
        </div>

        {/* Featured Image */}
        <div className="glass-card p-6 rounded-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Image à la une</h2>

          <div className="space-y-4">
            {!form.values.featuredImage.url ? (
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
                  src={form.values.featuredImage.url}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => form.setFieldValue('featuredImage.url', '')}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {form.values.featuredImage.url && (
              <div className="grid md:grid-cols-2 gap-4">
                <FormField>
                  <FormInput
                    {...form.getFieldProps('featuredImage.alt')}
                    label="Texte alternatif"
                    placeholder="Description de l'image"
                  />
                </FormField>
                <FormField>
                  <FormInput
                    {...form.getFieldProps('featuredImage.caption')}
                    label="Légende"
                    placeholder="Légende de l'image"
                  />
                </FormField>
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
            {form.values.tags.map((tag: string, index: number) => (
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
            <FormField>
              <FormInput
                {...form.getFieldProps('seo.metaTitle')}
                label="Meta Title"
                placeholder="Titre pour les moteurs de recherche"
                maxLength={60}
                counter
              />
            </FormField>

            <FormField>
              <FormTextarea
                {...form.getFieldProps('seo.metaDescription')}
                label="Meta Description"
                placeholder="Description pour les moteurs de recherche"
                maxLength={160}
                rows={3}
                counter
              />
            </FormField>

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
                {form.values.seo.keywords.map((keyword: string, index: number) => (
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
            <FormField>
              <FormCheckbox
                {...form.getFieldProps('featured')}
                label="Article en vedette"
                id="featured"
                icon={<Star className="w-4 h-4" />}
              />
            </FormField>

            <FormField>
              <FormCheckbox
                {...form.getFieldProps('isPublished')}
                label="Publier l'article"
                id="isPublished"
                icon={form.values.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              />
            </FormField>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center space-x-4">
          <FormSubmitButton
            loading={isLoading}
            disabled={!form.isValid || isLoading}
            icon={<Save className="w-5 h-5" />}
          >
            Créer l'article
          </FormSubmitButton>

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
