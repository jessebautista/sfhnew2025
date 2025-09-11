import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, X, Search } from 'lucide-react';
import { fetchPianoPrograms } from '../lib/supabase';

export interface PianoFiltersState {
  selectedYear: number | null;
  selectedProgram: number | null;
  searchQuery: string;
}

interface PianoFiltersProps {
  availableYears: number[];
  filters: PianoFiltersState;
  onFiltersChange: (filters: PianoFiltersState) => void;
  pianoCount?: number;
  className?: string;
}

interface Program {
  id: number;
  act_title: string;
  status?: string;
}

const PianoFilters: React.FC<PianoFiltersProps> = ({
  availableYears,
  filters,
  onFiltersChange,
  pianoCount = 0,
  className = ''
}) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isProgramOpen, setIsProgramOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch programs on mount
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setIsLoading(true);
        const programsData = await fetchPianoPrograms();
        setPrograms(programsData);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPrograms();
  }, []);

  const handleYearChange = (year: number | null) => {
    onFiltersChange({ ...filters, selectedYear: year });
    setIsYearOpen(false);
  };

  const handleProgramChange = (programId: number | null) => {
    onFiltersChange({ ...filters, selectedProgram: programId });
    setIsProgramOpen(false);
  };

  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, searchQuery: query });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      selectedYear: null,
      selectedProgram: null,
      searchQuery: ''
    });
  };

  const hasActiveFilters = filters.selectedYear !== null || 
                          filters.selectedProgram !== null || 
                          filters.searchQuery.trim() !== '';

  const selectedProgramName = programs.find(p => p.id === filters.selectedProgram)?.act_title;

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pianos, artists, or programs..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {/* Year Filter */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsYearOpen(!isYearOpen)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                filters.selectedYear !== null
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>
                {filters.selectedYear ? filters.selectedYear : 'Year'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isYearOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsYearOpen(false)}
                  />
                  <motion.div
                    className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[150px] max-h-60 overflow-y-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-2">
                      <button
                        onClick={() => handleYearChange(null)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          filters.selectedYear === null ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        All Years
                      </button>
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => handleYearChange(year)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            filters.selectedYear === year ? 'bg-green-50 text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Program Filter */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsProgramOpen(!isProgramOpen)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                filters.selectedProgram !== null
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={isLoading}
            >
              <span>
                {selectedProgramName || 'Program'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isProgramOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isProgramOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProgramOpen(false)}
                  />
                  <motion.div
                    className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[200px] max-h-60 overflow-y-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-2">
                      <button
                        onClick={() => handleProgramChange(null)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          filters.selectedProgram === null ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        All Programs
                      </button>
                      {programs.map(program => (
                        <button
                          key={program.id}
                          onClick={() => handleProgramChange(program.id)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            filters.selectedProgram === program.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="truncate">
                            {program.act_title}
                          </div>
                          {program.status && (
                            <div className="text-xs text-gray-500 mt-1">
                              {program.status}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <motion.button
              onClick={clearAllFilters}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </motion.button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {pianoCount} piano{pianoCount !== 1 ? 's' : ''} found
          </div>
          {hasActiveFilters && (
            <div className="flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Filtered</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PianoFilters;