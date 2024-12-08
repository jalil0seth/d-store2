export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  brand: string;
  variants: string;
  metadata: string;
  images: string[];
  features: string;
  isAvailable: boolean;
  status: 'active' | 'draft' | 'archived';
  created?: string;
  updated?: string;
  collectionId?: string;
  collectionName?: string;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  image: string;
  date: string;
}

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
  footerLinks: {
    title: string;
    links: Array<{
      text: string;
      url: string;
    }>;
  }[];
}