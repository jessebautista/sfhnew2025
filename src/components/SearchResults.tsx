import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Music, FileText, MapPin } from 'lucide-react';
import Search from './Search';
import { searchService, type SearchResult } from '../lib/search';

const SearchResults: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState<{ totalItems: number; types: Record<string, number> } | null>(null);

  // Get search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }

    // Get search stats
    setSearchStats(searchService.getStats());
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchService.search(searchQuery, 50);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchQuery);
    window.history.pushState({}, '', url.toString());
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'piano':
        return Music;
      case 'news':
        return FileText;
      case 'page':
        return MapPin;
      default:
        return FileText;
    }
  };

  const getResultTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'piano':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'news':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'page':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const resultsByType = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="max-w-2xl mx-auto">
          <Search
            placeholder="Search pianos, news, programs, and more..."
            onResultSelect={(result) => {
              // Handle result selection if needed
              window.location.href = result.url;
            }}
          />
        </div>
      </div>

      {/* Search Stats */}
      {searchStats && (
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600">
            Searchable content: {searchStats.totalItems} items across{' '}
            {Object.keys(searchStats.types).length} categories
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* No Query State */}
      {!query && !isLoading && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Start your search
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Use the search bar above to find pianos, news articles, programs, and more across our site.
          </p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && query && results.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No results found for "{query}"
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Try searching with different keywords or check your spelling.
          </p>
          <div className="text-sm text-gray-500">
            <p>Suggestions:</p>
            <ul className="mt-2 space-y-1">
              <li>• Search for "piano" to find piano-related content</li>
              <li>• Search for "news" to find recent articles</li>
              <li>• Search for "education" to find program information</li>
            </ul>
          </div>
        </div>
      )}

      {/* Results by Type */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <p className="text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>

          {Object.entries(resultsByType).map(([type, typeResults]) => (
            <div key={type} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 capitalize flex items-center">
                {type === 'piano' && <Music className="w-5 h-5 mr-2" />}
                {type === 'news' && <FileText className="w-5 h-5 mr-2" />}
                {type === 'page' && <MapPin className="w-5 h-5 mr-2" />}
                {type}s ({typeResults.length})
              </h2>
              
              <div className="grid gap-4">
                {typeResults.map((result, index) => {
                  const Icon = getResultIcon(result.type);
                  
                  return (
                    <motion.a
                      key={result.id}
                      href={result.url}
                      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-start space-x-4">
                        {result.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={result.image}
                              alt={result.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors">
                                {result.title}
                              </h3>
                              
                              {result.description && (
                                <p className="text-gray-600 mt-1 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                              
                              {result.metadata && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {result.metadata.artist && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                      by {result.metadata.artist}
                                    </span>
                                  )}
                                  {result.metadata.year && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                      {result.metadata.year}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full border text-xs font-medium ${getResultTypeColor(result.type)}`}>
                              {result.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;