import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Grid, Music } from 'lucide-react';
import PianoMapLeaflet from './PianoMapLeaflet';
import PianoFilters from './PianoFilters';
import type { PianoFiltersState } from './PianoFilters';
import PianoDetailModal from './PianoDetailModal';
import { fetchPianos, type Piano } from '../lib/supabase';

const PianoDiscovery: React.FC = () => {
  const [pianos, setPianos] = useState<Piano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'gallery'>('map');
  const [selectedPiano, setSelectedPiano] = useState<Piano | null>(null);
  const [filters, setFilters] = useState<PianoFiltersState>({
    selectedYear: null,
    selectedProgram: null,
    searchQuery: ''
  });

  // Load pianos on mount
  useEffect(() => {
    const loadPianos = async () => {
      try {
        setIsLoading(true);
        console.log('PianoDiscovery: Fetching pianos...');
        const pianosData = await fetchPianos();
        console.log('PianoDiscovery: Fetched', pianosData.length, 'pianos');
        console.log('PianoDiscovery: Sample piano data:', pianosData[0]);
        setPianos(pianosData);
      } catch (error) {
        console.error('Failed to fetch pianos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPianos();
  }, []);

  // Get available years from pianos
  const availableYears = useMemo(() => {
    const years = pianos
      .map(piano => piano.piano_year)
      .filter((year): year is number => year !== null && year !== undefined)
      .sort((a, b) => b - a);
    
    return [...new Set(years)];
  }, [pianos]);

  // Filter pianos based on current filters
  const filteredPianos = useMemo(() => {
    let filtered = [...pianos];
    console.log('PianoDiscovery: Starting with', filtered.length, 'pianos');

    // Filter by year
    if (filters.selectedYear !== null) {
      filtered = filtered.filter(piano => piano.piano_year === filters.selectedYear);
      console.log('PianoDiscovery: After year filter:', filtered.length, 'pianos');
    }

    // Filter by program
    if (filters.selectedProgram !== null) {
      filtered = filtered.filter(piano => piano.piano_program === filters.selectedProgram);
      console.log('PianoDiscovery: After program filter:', filtered.length, 'pianos');
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(piano =>
        piano.piano_title.toLowerCase().includes(query) ||
        piano.artist_name.toLowerCase().includes(query) ||
        (piano.piano_search && piano.piano_search.toLowerCase().includes(query))
      );
      console.log('PianoDiscovery: After search filter:', filtered.length, 'pianos');
    }

    console.log('PianoDiscovery: Final filtered pianos:', filtered.length);
    return filtered;
  }, [pianos, filters]);

  const handlePianoSelect = (piano: Piano) => {
    setSelectedPiano(piano);
  };

  const handleCloseModal = () => {
    setSelectedPiano(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading piano data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* View Mode Toggle */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Gallery View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <PianoFilters
        availableYears={availableYears}
        filters={filters}
        onFiltersChange={setFilters}
        pianoCount={filteredPianos.length}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <motion.div
              key="map"
              className="h-full min-h-[600px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PianoMapLeaflet
                pianos={filteredPianos}
                onPianoSelect={handlePianoSelect}
                className="h-full w-full"
                height="100%"
              />
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              className="h-full overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PianoGalleryView
                pianos={filteredPianos}
                onPianoSelect={handlePianoSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Piano Detail Modal */}
      <PianoDetailModal
        piano={selectedPiano}
        isOpen={!!selectedPiano}
        onClose={handleCloseModal}
      />
    </div>
  );
};

// Gallery View Component
interface PianoGalleryViewProps {
  pianos: Piano[];
  onPianoSelect: (piano: Piano) => void;
}

const PianoGalleryView: React.FC<PianoGalleryViewProps> = ({ pianos, onPianoSelect }) => {
  if (pianos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pianos found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pianos.map((piano, index) => (
          <motion.div
            key={piano.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onPianoSelect(piano)}
          >
            {/* Piano Image */}
            <div className="aspect-square bg-gray-200 overflow-hidden">
              <img
                src={piano.piano_image || 'https://via.placeholder.com/300'}
                alt={piano.piano_title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Piano Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {piano.piano_title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                by {piano.artist_name}
              </p>
              
              <div className="flex items-center justify-between">
                {piano.piano_year && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {piano.piano_year}
                  </span>
                )}
                
                {piano.perm_lat && piano.perm_lng && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Map className="w-3 h-3 mr-1" />
                    <span>Located</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PianoDiscovery;