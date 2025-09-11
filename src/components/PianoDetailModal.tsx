import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Music, User, Calendar, MapPin, ExternalLink } from 'lucide-react';
import type { Piano } from '../lib/supabase';

interface PianoDetailModalProps {
  piano: Piano | null;
  isOpen: boolean;
  onClose: () => void;
}

const PianoDetailModal: React.FC<PianoDetailModalProps> = ({
  piano,
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!piano || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={modalRef}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="piano-modal-title"
        aria-describedby="piano-modal-desc"
      >
        {/* Header */}
        <div className="relative">
          {piano.piano_image && (
            <div className="w-full h-48 bg-gray-200 overflow-hidden">
              <img
                src={piano.piano_image}
                alt={piano.piano_title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
            aria-label="Close piano details"
          >
            <X className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>

          {/* Piano year badge */}
          {piano.piano_year && (
            <div className="absolute bottom-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {piano.piano_year}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Artist */}
          <div className="mb-6">
            <h2 id="piano-modal-title" className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
              {piano.piano_title}
            </h2>
            <div id="piano-modal-desc" className="flex items-center text-gray-600 mb-1">
              <User className="w-4 h-4 mr-2" aria-hidden="true" />
              <span className="font-medium">by {piano.artist_name}</span>
            </div>
            
            {piano.piano_year && (
              <div className="flex items-center text-gray-500 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{piano.piano_year}</span>
              </div>
            )}
          </div>

          {/* Location Info */}
          {(piano.perm_lat && piano.perm_lng) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="font-medium">Location</span>
              </div>
              <div className="text-sm text-gray-600">
                Coordinates: {Number(piano.perm_lat).toFixed(4)}, {Number(piano.perm_lng).toFixed(4)}
              </div>
            </div>
          )}

          {/* Program Info */}
          {piano.piano_program && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center text-green-700 mb-2">
                <Music className="w-4 h-4 mr-2" />
                <span className="font-medium">Program</span>
              </div>
              <div className="text-sm text-green-600">
                Program ID: {piano.piano_program}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            {piano.piano_url && (
              <a
                href={`/piano/${piano.piano_url}`}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>View Details</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            
            {(piano.perm_lat && piano.perm_lng) && (
              <button
                onClick={() => {
                  const url = `https://maps.google.com/?q=${piano.perm_lat},${piano.perm_lng}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
              >
                Get Directions
              </button>
            )}
          </div>

          {/* Piano search terms (if available) */}
          {piano.piano_search && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Tags: {piano.piano_search}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PianoDetailModal;