import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';
import Search from './Search';

const MobileSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="sm:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Search"
      >
        <SearchIcon className="w-5 h-5" />
      </button>

      {/* Full-screen Mobile Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <div className="flex-1">
                <Search
                  placeholder="Search pianos, news, and more..."
                  showFullScreen={true}
                  onResultSelect={() => setIsOpen(false)}
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area for expanded results if needed */}
            <div className="p-4">
              <div className="text-center text-gray-500 text-sm">
                Start typing to search through our content...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileSearch;