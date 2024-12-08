import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pb } from '../lib/pocketbase';

export interface HomeConfig {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    image: string;
  };
  featuredProducts: {
    title: string;
    subtitle: string;
    productIds: string[];
  };
  reviews: {
    title: string;
    subtitle: string;
    reviewIds: string[];
  };
}

export interface WebsiteConfig {
  name: string;
  description: string;
  logo: string;
  contactEmail: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  footerLinks: Array<{
    title: string;
    url: string;
  }>;
}

interface ConfigState {
  homeConfig: HomeConfig;
  websiteConfig: WebsiteConfig;
  isLoading: boolean;
  error: string | null;
  fetchConfigs: () => Promise<void>;
  updateHomeConfig: (config: Partial<HomeConfig>) => Promise<void>;
  updateWebsiteConfig: (config: Partial<WebsiteConfig>) => Promise<void>;
}

const defaultHomeConfig: HomeConfig = {
  hero: {
    title: 'Premium Software Store',
    subtitle: 'Get the best software for your needs',
    ctaText: 'Browse Products',
    image: '/hero-image.jpg',
  },
  featuredProducts: {
    title: 'Featured Products',
    subtitle: 'Our most popular software solutions',
    productIds: [],
  },
  reviews: {
    title: 'Customer Reviews',
    subtitle: 'What our customers say about us',
    reviewIds: [],
  },
};

const defaultWebsiteConfig: WebsiteConfig = {
  name: 'Premium Software Store',
  description: 'Your one-stop shop for premium software solutions',
  logo: '/logo.png',
  contactEmail: 'contact@example.com',
  socialLinks: {
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
  },
  footerLinks: [
    { title: 'About', url: '/about' },
    { title: 'Contact', url: '/contact' },
    { title: 'Privacy', url: '/privacy' },
    { title: 'Terms', url: '/terms' },
  ],
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      homeConfig: defaultHomeConfig,
      websiteConfig: defaultWebsiteConfig,
      isLoading: false,
      error: null,

      fetchConfigs: async () => {
        set({ isLoading: true, error: null });
        try {
          const [homeConfigRecord, websiteConfigRecord] = await Promise.all([
            pb.collection('configs').getFirstListItem('type="home"'),
            pb.collection('configs').getFirstListItem('type="website"')
          ]);

          if (homeConfigRecord) {
            set({ homeConfig: homeConfigRecord.data as HomeConfig });
          }

          if (websiteConfigRecord) {
            set({ websiteConfig: websiteConfigRecord.data as WebsiteConfig });
          }
        } catch (error) {
          console.error('Error fetching configs:', error);
          set({ error: 'Failed to fetch configurations' });
        } finally {
          set({ isLoading: false });
        }
      },

      updateHomeConfig: async (config: Partial<HomeConfig>) => {
        set({ isLoading: true, error: null });
        try {
          const currentConfig = get().homeConfig;
          const updatedConfig = {
            ...currentConfig,
            ...config,
          };

          await pb.collection('configs').update('home_config', {
            type: 'home',
            data: updatedConfig,
          });

          set({ homeConfig: updatedConfig });
        } catch (error) {
          console.error('Error updating home config:', error);
          set({ error: 'Failed to update home configuration' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateWebsiteConfig: async (config: Partial<WebsiteConfig>) => {
        set({ isLoading: true, error: null });
        try {
          const currentConfig = get().websiteConfig;
          const updatedConfig = {
            ...currentConfig,
            ...config,
          };

          await pb.collection('configs').update('website_config', {
            type: 'website',
            data: updatedConfig,
          });

          set({ websiteConfig: updatedConfig });
        } catch (error) {
          console.error('Error updating website config:', error);
          set({ error: 'Failed to update website configuration' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'store-config',
      partialize: (state) => ({
        homeConfig: state.homeConfig,
        websiteConfig: state.websiteConfig,
      }),
    }
  )
);
