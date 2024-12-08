import { create } from 'zustand';

interface StorePage {
    id: string;
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
    meta_title?: string;
    meta_description?: string;
    created?: string;
    updated?: string;
    collectionId?: string;
    collectionName?: string;
}

interface PageState {
    pages: StorePage[];
    loading: boolean;
    error: string | null;
    selectedPage: StorePage | null;
}

interface PageActions {
    fetchPages: () => Promise<void>;
    createPage: (page: Partial<StorePage>) => Promise<void>;
    deletePage: (id: string) => Promise<void>;
    updatePage: (id: string, data: Partial<StorePage>) => Promise<void>;
    getPage: (id: string) => Promise<void>;
    setSelectedPage: (page: StorePage | null) => void;
    clearError: () => void;
    ensureAuthenticated: () => Promise<void>;
}

type PageStore = PageState & PageActions;

export const usePageStore = create<PageStore>((set, get) => ({
    pages: [],
    loading: false,
    error: null,
    selectedPage: null,

    async ensureAuthenticated() {
        if (!pocketBaseService.isAdminAuthenticated()) {
            await pocketBaseService.authenticate();
        }
    },

    fetchPages: async () => {
        set({ loading: true, error: null });
        try {
            await get().ensureAuthenticated();
            const response = await fetch('http://217.76.51.2:8090/api/collections/store_pages/records', {
                headers: pocketBaseService.getHeaders()
            });
            if (!response.ok) {
                throw new Error('Failed to fetch pages');
            }
            const data = await response.json();
            set({ pages: data.items, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    createPage: async (page: Partial<StorePage>) => {
        set({ loading: true, error: null });
        try {
            await get().ensureAuthenticated();
            const response = await fetch('http://217.76.51.2:8090/api/collections/store_pages/records', {
                method: 'POST',
                headers: pocketBaseService.getHeaders(),
                body: JSON.stringify({
                    ...page,
                    is_published: page.is_published ?? true,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create page');
            }

            const newPage = await response.json();
            const pages = get().pages;
            set({ pages: [...pages, newPage], loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    deletePage: async (id: string) => {
        set({ loading: true, error: null });
        try {
            await get().ensureAuthenticated();
            const response = await fetch(`http://217.76.51.2:8090/api/collections/store_pages/records/${id}`, {
                method: 'DELETE',
                headers: pocketBaseService.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete page');
            }

            const pages = get().pages.filter(page => page.id !== id);
            set({ pages, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    updatePage: async (id: string, data: Partial<StorePage>) => {
        set({ loading: true, error: null });
        try {
            await get().ensureAuthenticated();
            const response = await fetch(`http://217.76.51.2:8090/api/collections/store_pages/records/${id}`, {
                method: 'PATCH',
                headers: pocketBaseService.getHeaders(),
                body: JSON.stringify({
                    ...data,
                    updated: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update page');
            }

            const updatedPage = await response.json();
            const pages = get().pages.map(p => 
                p.id === id ? { ...p, ...updatedPage } : p
            );
            set({ pages, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    getPage: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const page = await pocketBaseService.getRecord('store_pages', id);
            if (!page) {
                throw new Error(`Page with ID ${id} not found`);
            }
            set({ selectedPage: page, loading: false });
            return page;
        } catch (error) {
            set({ error: (error as Error).message, loading: false, selectedPage: null });
            throw error;
        }
    },

    setSelectedPage: (page: StorePage | null) => set({ selectedPage: page }),

    clearError: () => set({ error: null })
}));
