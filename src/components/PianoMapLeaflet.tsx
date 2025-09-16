import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, MapPin } from 'lucide-react';
import type { Piano } from '../lib/supabase';

interface PianoMapProps {
  pianos: Piano[];
  onPianoSelect?: (piano: Piano) => void;
  className?: string;
  showControls?: boolean;
  height?: string;
  initialCenter?: [number, number]; // [lat, lng]
  initialZoom?: number;
  selectedPiano?: Piano | null;
}

const PianoMapLeaflet: React.FC<PianoMapProps> = ({
  pianos = [],
  onPianoSelect,
  className = '',
  showControls = true,
  height = '400px',
  initialCenter = [40.7128, -74.006],
  initialZoom = 11,
  selectedPiano = null
}) => {
  const [isClient, setIsClient] = useState(false);
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

  // Filter pianos with valid coordinates
  const validPianos = useMemo(() => {
    return pianos.filter(p => p.perm_lat != null && p.perm_lng != null && !isNaN(Number(p.perm_lat)) && !isNaN(Number(p.perm_lng)));
  }, [pianos]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsClient(true);

    const load = async () => {
      try {
        const [leaflet, reactLeaflet] = await Promise.all([
          import('leaflet'),
          import('react-leaflet')
        ]);

        // Fix default marker icons for bundlers
        delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const Map: React.FC = () => {
          const { MapContainer, TileLayer, Marker, Popup, useMap } = reactLeaflet;
          const L = leaflet.default;

          const InvalidateOnResize: React.FC = () => {
            const map = useMap();
            useEffect(() => {
              const handler = () => map.invalidateSize();
              const t1 = setTimeout(handler, 50);
              const t2 = setTimeout(handler, 300);
              const t3 = setTimeout(handler, 800);
              window.addEventListener('resize', handler);
              return () => {
                window.removeEventListener('resize', handler);
                clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
              };
            }, [map]);
            return null;
          };

          const FitBoundsOnChange: React.FC<{ pianos: Piano[] }> = ({ pianos }) => {
            const map = useMap();
            useEffect(() => {
              if (!pianos.length) return;
              const group = new L.FeatureGroup();
              pianos.forEach(p => group.addLayer(L.marker([Number(p.perm_lat), Number(p.perm_lng)])));
              const bounds = group.getBounds();
              if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
            }, [pianos, map]);
            return null;
          };

          const FlyToSelected: React.FC<{ piano: Piano | null }> = ({ piano }) => {
            const map = useMap();
            useEffect(() => {
              if (!piano || piano.perm_lat == null || piano.perm_lng == null) return;
              map.flyTo([Number(piano.perm_lat), Number(piano.perm_lng)], Math.max(map.getZoom(), 13), { duration: 1.0 });
            }, [piano, map]);
            return null;
          };

          const PianoMarkers: React.FC = () => {
            const createIcon = () => new L.DivIcon({
              html: `<div style="background:#22c55e;border:2px solid #fff;border-radius:50%;width:16px;height:16px;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>`,
              className: 'piano-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              popupAnchor: [0, -8]
            });
            return (
              <>
                {validPianos.map((p, i) => (
                  <Marker
                    key={`${p.id}-${i}`}
                    position={[Number(p.perm_lat), Number(p.perm_lng)] as any}
                    icon={createIcon() as any}
                    eventHandlers={{ click: () => onPianoSelect?.(p) } as any}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{p.piano_title}</div>
                        <div className="text-gray-600">by {p.artist_name}</div>
                        {p.piano_year && <div className="text-xs text-gray-500">{p.piano_year}</div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            );
          };

          return (
            <MapContainer
              center={initialCenter as any}
              zoom={initialZoom}
              zoomControl={showControls}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg overflow-hidden"
            >
              <InvalidateOnResize />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution={'&copy; OpenStreetMap contributors' as any}
              />
              <FitBoundsOnChange pianos={validPianos} />
              <FlyToSelected piano={selectedPiano} />
              <PianoMarkers />
            </MapContainer>
          );
        };

        setMapComponent(() => Map);
      } catch (e) {
        console.error('Failed to load Leaflet map:', e);
      }
    };

    load();
  }, [initialCenter, initialZoom, showControls, selectedPiano, validPianos.length]);

  if (!isClient || !MapComponent) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading map…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, minHeight: height === '100%' ? '600px' : '400px' }}>
      <MapComponent />

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
    </div>
  );
};

export default PianoMapLeaflet;

