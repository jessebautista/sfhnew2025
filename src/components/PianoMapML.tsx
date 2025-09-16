import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, MapPin } from 'lucide-react';
import type { Piano } from '../lib/supabase';

declare global {
  interface Window {
    maplibregl?: any;
  }
}

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

const PianoMapML: React.FC<PianoMapProps> = ({
  pianos = [],
  onPianoSelect,
  className = '',
  showControls = true,
  height = '400px',
  initialCenter = [40.7128, -74.006],
  initialZoom = 11,
  selectedPiano = null
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const validPianos = useMemo(() => (
    pianos.filter(p => p.perm_lat != null && p.perm_lng != null && !isNaN(Number(p.perm_lat)) && !isNaN(Number(p.perm_lng)))
  ), [pianos]);

  // Load MapLibre GL JS via CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsClient(true);

    if (window.maplibregl) {
      setReady(true);
      return;
    }

    let cssEl: HTMLLinkElement | null = null;
    let jsEl: HTMLScriptElement | null = null;

    if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
      cssEl = document.createElement('link');
      cssEl.rel = 'stylesheet';
      cssEl.href = 'https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      document.head.appendChild(cssEl);
    }

    if (!document.querySelector('script[src*="maplibre-gl@"]')) {
      jsEl = document.createElement('script');
      jsEl.src = 'https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      jsEl.onload = () => setReady(true);
      jsEl.onerror = () => console.error('Failed to load MapLibre GL');
      document.head.appendChild(jsEl);
    }

    return () => {
      // keep cached across route changes
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !ready || !containerRef.current || mapRef.current) return;
    const maplibregl = window.maplibregl;
    if (!maplibregl) return;

    const style = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        { id: 'osm', type: 'raster', source: 'osm' }
      ]
    } as any;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [initialCenter[1], initialCenter[0]], // [lng, lat]
      zoom: initialZoom,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    if (showControls) {
      const nav = new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false });
      mapRef.current.addControl(nav, 'top-right');
    }

    mapRef.current.on('load', () => {
      setMapLoaded(true);
      // Nudge size to avoid half-render
      const bump = () => mapRef.current && mapRef.current.resize();
      setTimeout(bump, 50);
      setTimeout(bump, 300);
      setTimeout(bump, 800);
    });

    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(containerRef.current);

    return () => {
      try { ro.disconnect(); } catch {}
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
    };
  }, [isClient, ready, initialCenter, initialZoom, showControls]);

  // Update markers and fit bounds
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = window.maplibregl;
    if (!map || !maplibregl || !mapLoaded) return;

    // Clear markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    validPianos.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'piano-marker';
      el.style.cssText = [
        'background:#22c55e',
        'border:2px solid #fff',
        'border-radius:50%','width:22px','height:22px','box-shadow:0 2px 4px rgba(0,0,0,0.3)',
        'cursor:pointer','z-index: 10'
      ].join(';');
      el.addEventListener('click', (e) => { e.stopPropagation(); onPianoSelect?.(p); });

      const marker = new maplibregl.Marker(el)
        .setLngLat([Number(p.perm_lng), Number(p.perm_lat)])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (validPianos.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      validPianos.forEach(p => bounds.extend([Number(p.perm_lng), Number(p.perm_lat)]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 40, right: 40 }, maxZoom: 15 });
      }
    }
  }, [validPianos, onPianoSelect, mapLoaded]);

  // Fly to selected piano
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPiano || selectedPiano.perm_lat == null || selectedPiano.perm_lng == null) return;
    map.flyTo({ center: [Number(selectedPiano.perm_lng), Number(selectedPiano.perm_lat)], zoom: Math.max(map.getZoom(), 13), speed: 0.8, curve: 1.42, essential: true });
  }, [selectedPiano]);

  if (!isClient || !ready) {
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
      <div ref={containerRef} className="absolute inset-0 w-full h-full rounded-lg overflow-hidden" />

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

export default PianoMapML;
