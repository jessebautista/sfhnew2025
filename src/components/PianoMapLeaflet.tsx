import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, MapPin, Navigation, Maximize2 } from 'lucide-react';
import type { Piano } from '../lib/supabase';

interface PianoMapProps {
  pianos: Piano[];
  onPianoSelect?: (piano: Piano) => void;
  className?: string;
  showControls?: boolean;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const PianoMapLeaflet: React.FC<PianoMapProps> = ({
  pianos = [],
  onPianoSelect,
  className = '',
  showControls = true,
  height = '400px',
  initialCenter = [40.7128, -74.006], // NYC (lat, lng for Leaflet)
  initialZoom = 11
}) => {
  const [isClient, setIsClient] = useState(false);
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

  // Filter pianos with valid coordinates
  const validPianos = useMemo(() => {
    const filtered = pianos.filter(piano => 
      piano.perm_lat !== null && 
      piano.perm_lng !== null && 
      !isNaN(Number(piano.perm_lat)) && 
      !isNaN(Number(piano.perm_lng))
    );
    return filtered;
  }, [pianos]);

  const handlePianoClick = (piano: Piano) => {
    console.log('Clicked piano:', piano.piano_title);
    if (onPianoSelect) {
      onPianoSelect(piano);
    }
  };

  // Only run on client side and load map components
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsClient(true);
    
    const loadMapComponents = async () => {
      try {
        // Import CSS first
        await Promise.all([
          import('leaflet/dist/leaflet.css')
        ]);

        // Then import JS modules
        const [
          leaflet,
          reactLeaflet
        ] = await Promise.all([
          import('leaflet'),
          import('react-leaflet')
        ]);

        // Fix marker icons (common Leaflet issue with bundlers)
        delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Create the map component
        const Map = React.memo(() => {
          const { MapContainer, TileLayer, Marker, Popup, useMap } = reactLeaflet;
          const L = leaflet.default;

          // Component to fit bounds when pianos change
          const FitBoundsOnChange = React.memo<{ pianos: Piano[] }>(({ pianos }) => {
            const map = useMap();

            useEffect(() => {
              if (!map || !pianos.length) return;

              const validPianos = pianos.filter(piano => 
                piano.perm_lat !== null && 
                piano.perm_lng !== null && 
                !isNaN(Number(piano.perm_lat)) && 
                !isNaN(Number(piano.perm_lng))
              );

              if (validPianos.length > 0) {
                const group = new L.FeatureGroup();

                validPianos.forEach(piano => {
                  const marker = L.marker([Number(piano.perm_lat), Number(piano.perm_lng)]);
                  group.addLayer(marker);
                });

                map.fitBounds(group.getBounds(), {
                  padding: [20, 20],
                  maxZoom: 15
                });
              }
            }, [pianos, map, L]);

            return null;
          });

          // Component for regular markers without clustering for now
          const PianoMarkers = React.memo(() => {
            // Custom piano marker icon
            const createPianoIcon = () => {
              return new L.DivIcon({
                html: `
                  <div style="
                    background-color: #da4680;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                  </div>
                `,
                className: 'piano-marker-custom',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
                popupAnchor: [0, -8]
              });
            };

            return (
              <>
                {validPianos.map((piano, index) => (
                  <Marker
                    key={`${piano.piano_id || index}-${piano.piano_title}`}
                    position={[Number(piano.perm_lat), Number(piano.perm_lng)] as any}
                    icon={createPianoIcon() as any}
                    eventHandlers={{
                      click: () => handlePianoClick(piano)
                    } as any}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{piano.piano_title}</div>
                        <div className="text-gray-600">by {piano.artist_name}</div>
                        {piano.piano_year && (
                          <div className="text-xs text-gray-500">{piano.piano_year}</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            );
          });

          return (
            <MapContainer
              center={initialCenter as any}
              zoom={initialZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg overflow-hidden"
              zoomControl={showControls}
              scrollWheelZoom={true}
              touchZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' as any}
              />
              
              <FitBoundsOnChange pianos={validPianos} />
              <PianoMarkers />
            </MapContainer>
          );
        });

        setMapComponent(() => Map);
      } catch (error) {
        console.error('Failed to load map components:', error);
      }
    };

    loadMapComponents();
  }, []);

  if (!isClient || !MapComponent) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading interactive map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, minHeight: height === '100%' ? '600px' : '400px' }}>
      {/* Map Container */}
      <MapComponent />
      
      {/* Piano Count Badge */}
      {validPianos.length > 0 && (
        <motion.div 
          className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-[1000]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <Music className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">
              {validPianos.length} piano{validPianos.length !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>
      )}

      {/* No Pianos Message */}
      {validPianos.length === 0 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-[1000] bg-gray-50 bg-opacity-80 rounded-lg"
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

      {/* Styles */}
      <style>{`
        .piano-marker-custom {
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .piano-marker-custom:active {
          transform: scale(0.95);
        }

        .leaflet-popup-content {
          border-radius: 8px;
          margin: 8px 12px;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Cluster styles */
        .marker-cluster-small {
          background-color: rgba(218, 70, 128, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(218, 70, 128, 0.8);
        }

        .marker-cluster-medium {
          background-color: rgba(218, 70, 128, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(218, 70, 128, 0.8);
        }

        .marker-cluster-large {
          background-color: rgba(218, 70, 128, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(218, 70, 128, 0.8);
        }

        /* Mobile touch optimizations */
        @media (max-width: 768px) {
          .leaflet-control-container {
            margin: 10px;
          }
          
          .leaflet-control-zoom a {
            width: 36px;
            height: 36px;
            line-height: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export default PianoMapLeaflet;