import React from 'react';
import { Music, User, Calendar, MapPin, ExternalLink } from 'lucide-react';
import type { Piano } from '../lib/supabase';

interface PianoDetailPanelProps {
  piano: Piano | null;
  className?: string;
}

const PianoDetailPanel: React.FC<PianoDetailPanelProps> = ({ piano, className = '' }) => {
  return (
    <aside className={`h-full bg-white border-l border-gray-200 ${className}`}>
      {!piano ? (
        <div className="h-full flex items-center justify-center text-center p-6">
          <div>
            <Music className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-sm text-gray-500">Select a piano to see details</div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header image */}
          {piano.piano_image && (
            <div className="h-40 w-full bg-gray-100 overflow-hidden">
              <img src={piano.piano_image} alt={piano.piano_title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{piano.piano_title}</h2>
              <div className="flex items-center text-gray-600 mt-1">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm">by {piano.artist_name}</span>
              </div>
              {piano.piano_year && (
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{piano.piano_year}</span>
                </div>
              )}
            </div>

            {(piano.perm_lat && piano.perm_lng) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="font-medium text-sm">Location</span>
                </div>
                <div className="text-xs text-gray-600">
                  {Number(piano.perm_lat).toFixed(4)}, {Number(piano.perm_lng).toFixed(4)}
                </div>
              </div>
            )}

            {piano.piano_search && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center text-green-700 mb-1">
                  <Music className="w-4 h-4 mr-2" />
                  <span className="font-medium text-sm">Tags</span>
                </div>
                <div className="text-xs text-green-700 break-words">{piano.piano_search}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              {piano.piano_url && (
                <a
                  href={`/piano/${piano.piano_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                >
                  View Details
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              )}
              {(piano.perm_lat && piano.perm_lng) && (
                <a
                  href={`https://maps.google.com/?q=${piano.perm_lat},${piano.perm_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
                >
                  Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default PianoDetailPanel;

