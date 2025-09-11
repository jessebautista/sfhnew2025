import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, Music, FileText, MapPin, ExternalLink, Clock } from 'lucide-react';
import { searchService, type SearchResult } from '../lib/search';

interface SearchProps {
  placeholder?: string;
  className?: string;
  showFullScreen?: boolean;
  maxResults?: number;
  onResultSelect?: (result: SearchResult) => void;
}

const Search: React.FC<SearchProps> = ({
  placeholder = 'Search pianos, news, and more...',
  className = '',
  showFullScreen = false,
  maxResults = 8,
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sfh-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5); // Keep only 5 recent searches
    
    setRecentSearches(updated);
    localStorage.setItem('sfh-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await searchService.search(searchQuery, maxResults);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxResults]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          // Navigate to search results page
          saveRecentSearch(query);
          setIsOpen(false);
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Navigate to result URL
      if (result.url.startsWith('/')) {
        window.location.href = result.url;
      } else {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
    performSearch(searchQuery);
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for result type
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

  // Get result type label
  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'piano':
        return 'Piano';
      case 'news':
        return 'News';
      case 'page':
        return 'Page';
      case 'program':
        return 'Program';
      default:
        return 'Result';
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all duration-200"
          autoComplete="off"
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={resultsRef}
            className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden ${
              showFullScreen ? 'md:max-h-96' : 'max-h-96'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Loading state */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              </div>
            )}

            {/* No query - show recent searches */}
            {!query && !isLoading && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  Recent Searches
                </div>
                <div className="space-y-1">
                  {recentSearches.map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(recentQuery)}
                      className="flex items-center space-x-2 w-full px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{recentQuery}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {!isLoading && results.length > 0 && (
              <>
                <div className="py-2 max-h-80 overflow-y-auto">
                  {results.map((result, index) => {
                    const Icon = getResultIcon(result.type);
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-green-50 border-r-2 border-green-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            result.type === 'piano' ? 'bg-green-100' :
                            result.type === 'news' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              result.type === 'piano' ? 'text-green-600' :
                              result.type === 'news' ? 'text-blue-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                result.type === 'piano' ? 'bg-green-100 text-green-600' :
                                result.type === 'news' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {getResultTypeLabel(result.type)}
                              </span>
                            </div>
                            
                            {result.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </p>
                            )}
                          </div>
                          
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* View all results footer */}
                {results.length >= maxResults && query && (
                  <div className="border-t border-gray-200 p-3">
                    <button
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                        window.location.href = `/search?q=${encodeURIComponent(query)}`;
                      }}
                      className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      View all results for "{query}"
                    </button>
                  </div>
                )}
              </>
            )}

            {/* No results */}
            {!isLoading && query && results.length === 0 && (
              <div className="p-8 text-center">
                <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No results found</h3>
                <p className="text-xs text-gray-500">
                  Try searching for pianos, artists, news, or programs
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Search;