import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('PUBLIC_SUPABASE_URL environment variable is required');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('PUBLIC_SUPABASE_ANON_KEY environment variable is required');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types based on the database structure
export interface NewsItem {
  id: number;
  news_title: string;
  news_url: string;
  news_image: string;
  news_date: string;
  news_content?: string;
  tiny?: string;
  news_excerpt?: string;
  news_image_caption?: string;
  news_author?: string;
  news_link?: string;
  featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Piano {
  id: number;
  piano_title: string;
  piano_year: number | null;
  piano_image: string;
  artist_name: string;
  piano_program: number | null;
  piano_url: string;
  perm_lat: number | null;
  perm_lng: number | null;
  piano_search?: string;
  program?: {
    act_title: string;
    act_location: string;
    status?: string;
  };
}

export interface Program {
  id: number;
  act_title: string;
  status?: string;
}

// Helper functions for fetching data
export async function fetchNews(limit = 12, searchTerm = '') {
  try {
    let query = supabase
      .from('news')
      .select('*')
      .order('news_date', { ascending: false });

    if (searchTerm) {
      query = query.ilike('news_title', `%${searchTerm}%`);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Paginated news fetch with total count
export async function fetchNewsPage(page: number = 1, pageSize: number = 12, searchTerm: string = '') {
  try {
    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + pageSize - 1;

    let query = supabase
      .from('news')
      .select('*', { count: 'exact' })
      .order('news_date', { ascending: false })
      .range(from, to);

    if (searchTerm) {
      query = query.ilike('news_title', `%${searchTerm}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      items: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    };
  } catch (error) {
    console.error('Error fetching paginated news:', error);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
}

export async function fetchNewsItem(newsUrl: string) {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('news_url', newsUrl)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching news item:', error);
    return null;
  }
}

export async function fetchPianos(limit?: number) {
  try {
    // First, try to get pianos with coordinates (deployed pianos)
    let query = supabase
      .from('pianos')
      .select('id, piano_title, piano_year, piano_image, artist_name, piano_program, piano_url, perm_lat, perm_lng, piano_search')
      .not('perm_lat', 'is', null)
      .not('perm_lng', 'is', null)
      .order('piano_year', { ascending: false });

    const { data: pianosWithCoords, error: coordsError } = await query;
    
    // If we don't have enough pianos with coordinates, get all pianos
    let allPianos = pianosWithCoords || [];
    
    if (!coordsError && allPianos.length < (limit || 50)) {
      const { data: allPianosData, error: allError } = await supabase
        .from('pianos')
        .select('id, piano_title, piano_year, piano_image, artist_name, piano_program, piano_url, perm_lat, perm_lng, piano_search')
        .order('piano_year', { ascending: false });
      
      if (!allError && allPianosData) {
        // Combine and deduplicate
        const existingIds = new Set(allPianos.map(p => p.id));
        const additionalPianos = allPianosData.filter(p => !existingIds.has(p.id));
        allPianos = [...allPianos, ...additionalPianos];
      }
    }

    if (coordsError && !allPianos.length) {
      throw coordsError;
    }

    // Apply limit if specified
    if (limit) {
      allPianos = allPianos.slice(0, limit);
    }

    // Fetch programs to enrich piano data
    const { data: programsData, error: programsError } = await supabase
      .from('piano_activations')
      .select('id, act_title, act_location, status')
      .order('act_title');

    if (programsError) {
      console.warn('Error fetching programs (non-critical):', programsError);
    }

    // Create a map for quick program lookup
    const programsMap = new Map((programsData || []).map(p => [p.id, p]));
    
    // Enrich pianos with program information
    const enrichedPianos = allPianos.map(piano => ({
      ...piano,
      program: piano.piano_program ? programsMap.get(piano.piano_program) : undefined
    }));

    const pianosWithCoordsCount = enrichedPianos.filter(p => p.perm_lat && p.perm_lng).length;
    console.log(`Fetched ${enrichedPianos.length} pianos (${pianosWithCoordsCount} with coordinates)${limit ? ` (limited to ${limit})` : ''}`);
    return enrichedPianos;
  } catch (error) {
    console.error('Error fetching pianos:', error);
    return [];
  }
}

export async function fetchPianoPrograms() {
  try {
    const { data, error } = await supabase
      .from('piano_activations')
      .select('id, act_title')
      .eq('status', 'Active')
      .order('act_title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching piano programs:', error);
    return [];
  }
}

export async function fetchPianoByUrl(pianoUrl: string) {
  try {
    const { data, error } = await supabase
      .from('pianos')
      .select('*')
      .eq('piano_url', pianoUrl)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching piano:', error);
    return null;
  }
}

export async function fetchFeaturedNews(limit?: number) {
  try {
    let query = supabase
      .from('news')
      .select('*')
      .eq('featured', true)
      .order('news_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching featured news:', error);
    return [];
  }
}
