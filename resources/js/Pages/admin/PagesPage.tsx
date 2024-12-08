import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiZap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { usePageStore } from '../../store/pageStore';

const PagesPage: React.FC = () => {
  const [editingPage, setEditingPage] = useState<StorePage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pages, loading, error, fetchPages, createPage, updatePage, deletePage } = usePageStore();

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    
    try {
      await deletePage(id);
      toast.success('Page deleted successfully');
    } catch (error) {
      // Error is handled by the store
      toast.error('Failed to delete page');
    }
  };

  const handleSave = async (page: Partial<StorePage>) => {
    try {
      if (editingPage?.id) {
        await updatePage(editingPage.id, page);
      } else {
        await createPage(page);
      }
      toast.success(`Page ${editingPage ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
    } catch (error) {
      // Error is handled by the store
      toast.error('Failed to save page');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Store Pages</h1>
        <button
          onClick={() => {
            setEditingPage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiPlus className="mr-2" />
          Add Page
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {pages.map((page) => (
            <li key={page.id}>
              <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {page.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    /{page.slug}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setEditingPage(page);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">{editingPage ? 'Edit' : 'Create'} Page</h2>
            <PageForm
              initialData={editingPage}
              onSave={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface PageFormProps {
  initialData: StorePage | null;
  onSave: (page: Partial<StorePage>) => void;
  onCancel: () => void;
}

const PageForm: React.FC<PageFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<StorePage>>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    is_published: initialData?.is_published ?? true,
    meta_title: initialData?.meta_title || '',
    meta_description: initialData?.meta_description || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleGenerate = async (title: string) => {
    setIsGenerating(true);
    try {
      const generatedContent = await llmService.generateContent(title);
      setFormData(prev => ({ ...prev, content: generatedContent }));
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => handleGenerate(formData.title)}
            disabled={!formData.title || isGenerating}
            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiZap className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={10}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Meta Title</label>
        <input
          type="text"
          name="meta_title"
          value={formData.meta_title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Meta Description</label>
        <textarea
          name="meta_description"
          value={formData.meta_description}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-4 mt-6">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

interface StorePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  meta_title?: string;
  meta_description?: string;
}

export default PagesPage;
