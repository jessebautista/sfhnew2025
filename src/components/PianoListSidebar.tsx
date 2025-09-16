import React from 'react';
import { Search, MapPin, Music } from 'lucide-react';
import type { Piano } from '../lib/supabase';

interface PianoListSidebarProps {
  pianos: Piano[];
  selectedPiano: Piano | null;
  onSelect: (p: Piano) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

const PianoListSidebar: React.FC<PianoListSidebarProps> = ({
  pianos,
  selectedPiano,
  onSelect,
  onSearch,
  className = ''
}) => {
  return (
    <aside className={`h-full bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Pianos in View</h3>
          <div className="flex items-center text-xs text-gray-500">
            <Music className="w-3 h-3 mr-1" />
            {pianos.length}
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pianos, artist..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-80px)] p-2 space-y-2">
        {pianos.map((p) => {
          const isActive = selectedPiano && (selectedPiano.id === p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`w-full text-left rounded-lg border transition shadow-sm hover:shadow-md ${
                isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center p-3 space-x-3">
                <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden">
                  <img
                    src={p.piano_image || 'https://via.placeholder.com/80'}
                    alt={p.piano_title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">{p.piano_title}</div>
                  <div className="text-xs text-gray-600 truncate">by {p.artist_name}</div>
                  {p.piano_year && (
                    <div className="text-[11px] text-gray-500 mt-0.5">{p.piano_year}</div>
                  )}
                </div>
                {(p.perm_lat && p.perm_lng) && (
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default PianoListSidebar;

