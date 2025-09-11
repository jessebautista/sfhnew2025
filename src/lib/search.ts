import Fuse from 'fuse.js';
import { fetchPianos, fetchNews, type Piano, type NewsItem } from './supabase';

// Search result types
export interface SearchResult {
  id: string;
  title: string;
  type: 'piano' | 'news' | 'page' | 'program';
  url: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
}

// Searchable content interface
export interface SearchableContent {
  id: string;
  title: string;
  content: string;
  type: 'piano' | 'news' | 'page' | 'program';
  url: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
}

// Fuse.js configuration for optimal search experience
const fuseOptions: Fuse.IFuseOptions<SearchableContent> = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'content', weight: 0.3 },
    { name: 'description', weight: 0.2 },
    { name: 'metadata.artist', weight: 0.5 },
    { name: 'metadata.year', weight: 0.1 },
    { name: 'metadata.tags', weight: 0.4 }
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  findAllMatches: false,
  useExtendedSearch: false
};

// Convert Piano data to searchable content
function pianoToSearchable(piano: Piano): SearchableContent {
  return {
    id: `piano-${piano.id}`,
    title: piano.piano_title,
    content: `${piano.piano_title} ${piano.artist_name} ${piano.piano_search || ''}`,
    type: 'piano',
    url: `/piano/${piano.piano_url}`,
    description: `Piano by ${piano.artist_name}${piano.piano_year ? ` (${piano.piano_year})` : ''}`,
    image: piano.piano_image,
    metadata: {
      artist: piano.artist_name,
      year: piano.piano_year,
      program: piano.piano_program,
      tags: piano.piano_search,
      coordinates: piano.perm_lat && piano.perm_lng ? [piano.perm_lat, piano.perm_lng] : null
    }
  };
}

// Convert News data to searchable content
function newsToSearchable(news: NewsItem): SearchableContent {
  const contentText = typeof news.news_content === 'string' ? news.news_content : '';
  return {
    id: `news-${news.id}`,
    title: news.news_title,
    content: `${news.news_title} ${contentText}`,
    type: 'news',
    url: `/news/${news.news_url}`,
    description: contentText ? 
      contentText.substring(0, 150) + '...' : 
      `News article from ${new Date(news.news_date).toLocaleDateString()}`,
    image: news.news_image,
    metadata: {
      date: news.news_date,
      created_at: news.created_at
    }
  };
}

// Static page content for search
const staticPages: SearchableContent[] = [
  {
    id: 'page-home',
    title: 'Sing for Hope - Art for All',
    content: 'Sing for Hope harnesses the power of the arts to create a better world through innovative programs, creative expression, communities, healthcare, education',
    type: 'page',
    url: '/',
    description: 'Homepage - Art for All through innovative arts programs'
  },
  {
    id: 'page-about',
    title: 'About Sing for Hope',
    content: 'About our mission programming board leadership annual reports press',
    type: 'page',
    url: '/about',
    description: 'Learn about our mission, programs, and leadership'
  },
  {
    id: 'page-pianos',
    title: 'Sing for Hope Pianos',
    content: 'Artist-designed pianos public spaces healthcare facilities music community connection',
    type: 'page',
    url: '/pianos',
    description: 'Artist-designed pianos in public spaces worldwide'
  },
  {
    id: 'page-discover',
    title: 'Discover Pianos',
    content: 'Interactive map piano locations discovery find pianos near me',
    type: 'page',
    url: '/discover',
    description: 'Find piano locations with our interactive map'
  },
  {
    id: 'page-education',
    title: 'Education Programs',
    content: 'Education youth chorus classes curriculum artivism career development',
    type: 'page',
    url: '/education',
    description: 'Arts education programs for students and educators'
  },
  {
    id: 'page-contact',
    title: 'Contact Us',
    content: 'Contact get in touch partnership collaboration support',
    type: 'page',
    url: '/contact',
    description: 'Get in touch with our team'
  },
  {
    id: 'page-donate',
    title: 'Donate to Sing for Hope',
    content: 'Donate support funding contribute impact community arts',
    type: 'page',
    url: '/donate',
    description: 'Support our mission with a donation'
  }
];

// Search service class
export class SearchService {
  private fuse: Fuse<SearchableContent> | null = null;
  private searchData: SearchableContent[] = [];
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize search data on construction
    this.initializationPromise = this.initialize();
  }

  // Initialize search data from Supabase
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Fetch data from Supabase
      const [pianos, news] = await Promise.all([
        fetchPianos(),
        fetchNews(100) // Limit to most recent 100 news items
      ]);

      // Convert to searchable content
      const searchablePianos = pianos.map(pianoToSearchable);
      const searchableNews = news.map(newsToSearchable);

      // Combine all searchable content
      this.searchData = [
        ...staticPages,
        ...searchablePianos,
        ...searchableNews
      ];

      // Initialize Fuse instance
      this.fuse = new Fuse(this.searchData, fuseOptions);
      this.isInitialized = true;

      console.log(`Search initialized with ${this.searchData.length} items`);
    } catch (error) {
      console.error('Failed to initialize search:', error);
      // Fallback to static pages only
      this.searchData = staticPages;
      this.fuse = new Fuse(this.searchData, fuseOptions);
      this.isInitialized = true;
    }
  }

  // Ensure search is initialized before use
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  // Perform search with query
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    await this.ensureInitialized();

    if (!this.fuse || !query.trim()) {
      return [];
    }

    const results = this.fuse.search(query, { limit });
    
    return results.map(result => ({
      id: result.item.id,
      title: result.item.title,
      type: result.item.type,
      url: result.item.url,
      description: result.item.description,
      image: result.item.image,
      metadata: {
        ...result.item.metadata,
        score: result.score,
        matches: result.matches
      }
    }));
  }

  // Get search suggestions (for autocomplete)
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    await this.ensureInitialized();

    if (!query.trim()) {
      return [];
    }

    const results = await this.search(query, limit);
    return results.map(result => result.title);
  }

  // Get content by type
  async getContentByType(type: SearchableContent['type'], limit: number = 10): Promise<SearchResult[]> {
    await this.ensureInitialized();

    const filtered = this.searchData
      .filter(item => item.type === type)
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        url: item.url,
        description: item.description,
        image: item.image,
        metadata: item.metadata
      }));

    return filtered;
  }

  // Refresh search data (useful for updates)
  async refresh(): Promise<void> {
    this.isInitialized = false;
    this.initializationPromise = this.initialize();
    await this.initializationPromise;
  }

  // Get search statistics
  getStats(): { totalItems: number; types: Record<string, number> } {
    const types: Record<string, number> = {};
    
    this.searchData.forEach(item => {
      types[item.type] = (types[item.type] || 0) + 1;
    });

    return {
      totalItems: this.searchData.length,
      types
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();