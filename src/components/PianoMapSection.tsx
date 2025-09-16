import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';
import PianoMapLeaflet from './PianoMapLeaflet';
import PianoDetailModal from './PianoDetailModal';
import { fetchPianos, type Piano } from '../lib/supabase';

const PianoMapSection: React.FC = () => {
  const [pianos, setPianos] = useState<Piano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPiano, setSelectedPiano] = useState<Piano | null>(null);

  // Load a subset of pianos for the preview
  useEffect(() => {
    const loadPianos = async () => {
      try {
        setIsLoading(true);
        const pianosData = await fetchPianos(100); // Fetch more to find ones with coordinates
        // Filter to only show pianos with valid coordinates for the map preview
        const pianosWithCoords = pianosData.filter(piano => 
          piano.perm_lat !== null && piano.perm_lng !== null
        );
        
        console.log(`PianoMapSection: Found ${pianosWithCoords.length} pianos with coordinates out of ${pianosData.length} total`);
        setPianos(pianosWithCoords);
      } catch (error) {
        console.error('Failed to fetch pianos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPianos();
  }, []);

  const handlePianoSelect = (piano: Piano) => {
    setSelectedPiano(piano);
  };

  const handleCloseModal = () => {
    setSelectedPiano(null);
  };

  return (
    <div className="relative">
      {/* Map Preview */}
      <div className="relative">
        <PianoMapLeaflet
          pianos={pianos}
          onPianoSelect={handlePianoSelect}
          height="400px"
          showControls={false}
          className="rounded-lg"
        />
        
        {/* Overlay with stats and CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg font-semibold">
                      {isLoading ? 'Loading...' : `${pianos.length}+ Locations`}
                    </span>
                  </div>
                </div>
                <p className="text-gray-200 text-sm">
                  Click any piano marker to learn more, or explore the full interactive experience
                </p>
              </div>
              
              <motion.a
                href="/gallery"
                className="bg-white bg-opacity-20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 pointer-events-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Explore All</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      {/* Piano Detail Modal */}
      <PianoDetailModal
        piano={selectedPiano}
        isOpen={!!selectedPiano}
        onClose={handleCloseModal}
      />

      {/* Mobile-friendly note */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          💡 Tip: For the best mobile experience, visit our 
          <a href="/gallery" className="text-green-600 hover:text-green-700 font-medium ml-1">
            dedicated gallery page
          </a>
        </p>
      </div>
    </div>
  );
};

export default PianoMapSection;