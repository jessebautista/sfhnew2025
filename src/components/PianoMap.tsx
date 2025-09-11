import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, MapPin, Navigation, Maximize2 } from 'lucide-react';
import type { Piano } from '../lib/supabase';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

interface PianoMapProps {
  pianos: Piano[];
  onPianoSelect?: (piano: Piano) => void;
  className?: string;
  showControls?: boolean;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Set Mapbox access token from environment variable
mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;

const PianoMap: React.FC<PianoMapProps> = ({
  pianos = [],
  onPianoSelect,
  className = '',
  showControls = true,
  height = '400px',
  initialCenter = [-74.006, 40.7128], // NYC
  initialZoom = 11
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pianoCount, setPianoCount] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      console.log('PianoMap: Initializing map...');
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Fallback to basic style
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
        logoPosition: 'bottom-right'
      });
      console.log('PianoMap: Map instance created');

    // Mobile optimizations
    mapInstance.touchZoomRotate.disableRotation();
    mapInstance.dragRotate.disable();

    // Add navigation controls
    if (showControls) {
      const nav = new mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false
      });
      mapInstance.addControl(nav, 'top-right');

      // Add geolocate control for mobile
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 6000
        },
        trackUserLocation: false,
        showUserHeading: false
      });
      mapInstance.addControl(geolocate, 'top-right');
    }

    map.current = mapInstance;

    mapInstance.on('load', () => {
      console.log('PianoMap: Map loaded successfully');
      setMapLoaded(true);
      setIsLoading(false);
    });

    mapInstance.on('error', (e) => {
      console.error('PianoMap: Map error:', e);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    } catch (error) {
      console.error('PianoMap: Error initializing map:', error);
      setIsLoading(false);
    }
  }, [initialCenter, initialZoom, showControls]);


  // Update markers when pianos change
  useEffect(() => {
    console.log('PianoMap: useEffect triggered with', pianos.length, 'pianos');
    
    if (!map.current || !mapLoaded) {
      console.log('Map not ready:', { mapCurrent: !!map.current, mapLoaded });
      return;
    }

    console.log('PianoMap: Adding markers for', pianos.length, 'pianos');
    console.log('PianoMap: First few pianos:', pianos.slice(0, 3));

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter pianos with valid coordinates
    const validPianos = pianos.filter(piano => 
      piano.perm_lat !== null && 
      piano.perm_lng !== null && 
      !isNaN(Number(piano.perm_lat)) && 
      !isNaN(Number(piano.perm_lng))
    );

    setPianoCount(validPianos.length);

    // Add new markers
    validPianos.forEach((piano, index) => {
      if (!piano.perm_lat || !piano.perm_lng) {
        console.log('Piano', index, 'has no coordinates');
        return;
      }

      console.log('Adding marker for piano', index, piano.piano_title, 'at', piano.perm_lng, piano.perm_lat);

      // Create simple marker element like old project
      const el = document.createElement('div');
      el.className = 'piano-marker';
      el.style.backgroundColor = '#da4680';
      el.style.border = '2px solid #ffffff';
      el.style.borderRadius = '50%';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      // Add click event
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Clicked piano:', piano.piano_title);
        if (onPianoSelect) {
          onPianoSelect(piano);
        }
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div class="text-sm">
          <div class="font-semibold">${piano.piano_title}</div>
          <div class="text-gray-600">by ${piano.artist_name}</div>
          ${piano.piano_year ? `<div class="text-xs text-gray-500">${piano.piano_year}</div>` : ''}
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([
          parseFloat(piano.perm_lng.toString()),
          parseFloat(piano.perm_lat.toString())
        ])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
      console.log('Added marker', index + 1, 'of', validPianos.length, 'for', piano.piano_title);
    });

    // Auto-fit to piano locations like old project
    if (validPianos.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      validPianos.forEach((piano) => {
        bounds.extend([
          parseFloat(piano.perm_lng.toString()),
          parseFloat(piano.perm_lat.toString())
        ]);
      });

      if (!bounds.isEmpty()) {
        map.current!.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15
        });
      }
    }
  }, [pianos, mapLoaded, onPianoSelect]);

  const handleFitBounds = useCallback(() => {
    if (!map.current || pianos.length === 0) return;

    const validPianos = pianos.filter(piano => 
      piano.perm_lat !== null && piano.perm_lng !== null
    );

    if (validPianos.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validPianos.forEach(piano => {
        bounds.extend([Number(piano.perm_lng), Number(piano.perm_lat)]);
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 40, right: 40 },
          maxZoom: 15,
          duration: 1000
        });
      }
    }
  }, [pianos]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20 rounded-lg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center space-y-3 bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">Loading piano locations...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Piano Count Badge */}
      {!isLoading && pianoCount > 0 && (
        <motion.div 
          className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <Music className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">
              {pianoCount} piano{pianoCount !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>
      )}

      {/* Fit Bounds Button */}
      {!isLoading && pianoCount > 1 && (
        <motion.button
          onClick={handleFitBounds}
          className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-full p-3 shadow-lg z-10 hover:bg-gray-50 transition-colors"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          title="Show all pianos"
        >
          <Maximize2 className="w-4 h-4 text-gray-700" />
        </motion.button>
      )}

      {/* No Pianos Message */}
      {!isLoading && pianoCount === 0 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50 bg-opacity-80 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No piano locations found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        </motion.div>
      )}

      {/* Mobile-specific styles */}
      <style>{`
        .piano-marker {
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .piano-marker:active {
          transform: scale(0.95);
        }

        .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mapboxgl-popup-tip {
          border-top-color: white;
        }

        /* Mobile touch optimizations */
        @media (max-width: 768px) {
          .mapboxgl-ctrl-group {
            margin: 10px;
          }
          
          .mapboxgl-ctrl-group > button {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PianoMap;