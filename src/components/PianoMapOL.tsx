import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, MapPin } from 'lucide-react';
import type { Piano } from '../lib/supabase';

declare global {
  interface Window {
    ol?: any;
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

const PianoMapOL: React.FC<PianoMapProps> = ({
  pianos = [],
  onPianoSelect,
  className = '',
  showControls = true,
  height = '400px',
  initialCenter = [40.7128, -74.006],
  initialZoom = 11,
  selectedPiano = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const vectorLayerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [olReady, setOlReady] = useState(false);

  const validPianos = useMemo(() => {
    return pianos.filter(
      (p) => p.perm_lat != null && p.perm_lng != null && !isNaN(Number(p.perm_lat)) && !isNaN(Number(p.perm_lng))
    );
  }, [pianos]);

  // Load OpenLayers via CDN (JS + CSS)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsClient(true);

    if (window.ol) {
      setOlReady(true);
      return;
    }

    let linkEl: HTMLLinkElement | null = null;
    let scriptEl: HTMLScriptElement | null = null;

    if (!document.querySelector('link[href*="ol.css"]')) {
      linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/ol.css';
      document.head.appendChild(linkEl);
    }

    if (!document.querySelector('script[src*="/ol.js"]')) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/ol@v9.2.4/dist/ol.js';
      scriptEl.onload = () => setOlReady(true);
      scriptEl.onerror = () => console.error('Failed to load OpenLayers');
      document.head.appendChild(scriptEl);
    }

    return () => {
      // keep OL cached across navigations (no cleanup)
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !olReady || !containerRef.current || mapRef.current) return;
    const ol = window.ol;
    if (!ol) return;

    const view = new ol.View({
      center: ol.proj.fromLonLat([initialCenter[1], initialCenter[0]]),
      zoom: initialZoom,
    });

    const tileLayer = new ol.layer.Tile({ source: new ol.source.OSM() });

    // Vector layer for markers
    vectorLayerRef.current = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({ color: '#22c55e' }),
          stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
    });

    mapRef.current = new ol.Map({
      target: containerRef.current,
      layers: [tileLayer, vectorLayerRef.current],
      view,
      controls: showControls ? undefined : [],
    });

    // Click to select feature
    mapRef.current.on('singleclick', (evt: any) => {
      const feature = mapRef.current.forEachFeatureAtPixel(evt.pixel, (f: any) => f);
      if (feature) {
        const piano = feature.get('piano');
        if (piano && onPianoSelect) onPianoSelect(piano);
      }
    });

    // Resize handling
    const ro = new ResizeObserver(() => {
      mapRef.current?.updateSize();
    });
    ro.observe(containerRef.current);

    // Initial delayed size updates to avoid half-height
    const bump = () => mapRef.current && mapRef.current.updateSize();
    const t1 = setTimeout(bump, 50);
    const t2 = setTimeout(bump, 300);
    const t3 = setTimeout(bump, 800);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      try { ro.disconnect(); } catch {}
      try { mapRef.current?.setTarget(undefined); } catch {}
      mapRef.current = null;
    };
  }, [isClient, olReady, initialCenter, initialZoom, showControls]);

  // Update features when pianos change
  useEffect(() => {
    const ol = window.ol;
    if (!ol || !vectorLayerRef.current) return;
    const source = vectorLayerRef.current.getSource();
    source.clear();

    validPianos.forEach((p) => {
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([Number(p.perm_lng), Number(p.perm_lat)])),
        piano: p,
      });
      source.addFeature(feature);
    });

    // Fit bounds
    if (validPianos.length && mapRef.current) {
      const extent = source.getExtent();
      if (extent && Array.isArray(extent) && extent.every((n: any) => typeof n === 'number')) {
        mapRef.current.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15, duration: 400 });
      }
    }
  }, [validPianos]);

  // Fly to selected piano
  useEffect(() => {
    if (!selectedPiano || !mapRef.current || selectedPiano.perm_lat == null || selectedPiano.perm_lng == null) return;
    const ol = window.ol;
    const view = mapRef.current.getView();
    const target = ol.proj.fromLonLat([Number(selectedPiano.perm_lng), Number(selectedPiano.perm_lat)]);
    view.animate({ center: target, zoom: Math.max(view.getZoom(), 13), duration: 600 });
  }, [selectedPiano]);

  if (!isClient || !olReady) {
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

export default PianoMapOL;

