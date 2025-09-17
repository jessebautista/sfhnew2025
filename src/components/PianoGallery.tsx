import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Piano {
  id: number;
  piano_title: string;
  piano_year: number | null;
  piano_image: string;
  artist_name: string;
  piano_program: number | null;
  piano_url: string;
  perm_lat: number | null;
  perm_lng: number | null;
  piano_search?: string;
}

interface Program {
  id: number;
  act_title: string;
}

mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;

// Debug logging for Vercel deployment
console.log('Mapbox token configured:', !!mapboxgl.accessToken);
console.log('Environment:', import.meta.env.MODE);
if (!mapboxgl.accessToken) {
  console.error('Mapbox token is not configured. Please set PUBLIC_MAPBOX_TOKEN in environment variables.');
}

// Error Boundary Component
class PianoGalleryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Piano Gallery Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full max-h-full space-y-4 pt-12 flex flex-col xl:bg-white xl:border xl:border-gray-200 xl:shadow-sm xl:rounded-xl">
          <div className="max-w-7xl mx-auto px-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              SFH Piano Gallery
            </h2>
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-4">We're having trouble loading the piano gallery. Please try refreshing the page.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PianoGallery: React.FC = () => {
  const [pianos, setPianos] = useState<Piano[]>([]);
  const [filteredPianos, setFilteredPianos] = useState<Piano[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPiano, setSelectedPiano] = useState<Piano | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const itemsPerPage = 24;

  // Normalize image URLs that might be stored as relative storage paths
  const normalizeImageUrl = (src?: string) => {
    if (!src) return '/pianos-icon.png';
    if (/^https?:\/\//i.test(src)) return src;
    const base = import.meta.env.PUBLIC_SUPABASE_URL || '';
    if (!base) return src; // best effort
    if (src.startsWith('/')) return `${base}${src}`;
    return `${base}/${src}`;
  };

  // Check if desktop layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Initialize data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapContainer.current]);

  // Update filtered pianos when filters change
  useEffect(() => {
    applyFilters();
  }, [pianos, selectedProgram, selectedYear, searchTerm]);

  // Update available options when filters change
  useEffect(() => {
    updateAvailableOptions();
  }, [pianos, selectedProgram, selectedYear]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowProgramDropdown(false);
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update map markers when filtered pianos change
  useEffect(() => {
    updateMapMarkers();
  }, [filteredPianos]);

  const fetchInitialData = async () => {
    try {
      // Fetch all pianos
      const { data: pianosData, error: pianosError } = await supabase
        .from('pianos')
        .select('id, piano_title, piano_year, piano_image, artist_name, piano_program, piano_url, perm_lat, perm_lng, piano_search')
        .order('piano_year', { ascending: false });

      if (pianosError) throw pianosError;

      // Fetch programs
      const { data: programsData, error: programsError } = await supabase
        .from('piano_activations')
        .select('id, act_title')
        .eq('status', 'Active')
        .order('act_title');

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        throw programsError;
      }


      // Set state
      setPianos(pianosData || []);
      setPrograms(programsData || []);
      
      // Extract unique years (filter out null values)
      const uniqueYears = [...new Set((pianosData || [])
        .filter(p => p.piano_year !== null)
        .map(p => p.piano_year as number))]
        .sort((a, b) => b - a);
      setYears(uniqueYears);
      
      // Initialize available options with all options
      setAvailablePrograms(programsData || []);
      setAvailableYears(uniqueYears);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 0],
      zoom: 1,
      attributionControl: false,
    });

    map.current.scrollZoom.disable();
    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.addControl(new mapboxgl.FullscreenControl());
  };

  const updateAvailableOptions = () => {
    if (!pianos.length) return;

    try {
      // If a year is selected, show only programs that have pianos in that year
      if (selectedYear) {
        const availableProgramIds = [...new Set(
          pianos
            .filter(piano => piano.piano_year?.toString() === selectedYear)
            .map(piano => piano.piano_program)
            .filter(id => id !== null && id !== undefined)
        )].map(id => Number(id)); // Convert to numbers for consistent comparison
        
        const filteredPrograms = programs.filter(program => 
          availableProgramIds.includes(program.id)
        );
        setAvailablePrograms(filteredPrograms);
      } else {
        // Show all programs if no year is selected
        setAvailablePrograms(programs);
      }

      // If a program is selected, show only years that have pianos for that program
      if (selectedProgram) {
        const availableYearsForProgram = [...new Set(
          pianos
            .filter(piano => piano.piano_program?.toString() === selectedProgram)
            .map(piano => piano.piano_year)
            .filter(year => year !== null && year !== undefined)
        )].sort((a, b) => b! - a!);
        
        setAvailableYears(availableYearsForProgram as number[]);
      } else {
        // Show all years if no program is selected
        setAvailableYears(years);
      }
    } catch (error) {
      console.error('Error updating available options:', error);
      // Fallback to showing all options
      setAvailablePrograms(programs);
      setAvailableYears(years);
    }
  };

  const applyFilters = () => {
    try {
      let filtered = [...pianos];

      // Filter by program
      if (selectedProgram) {
        filtered = filtered.filter(piano => {
          try {
            return piano.piano_program !== null && 
                   piano.piano_program !== undefined && 
                   piano.piano_program.toString() === selectedProgram;
          } catch (e) {
            console.warn('Error filtering piano by program:', piano, e);
            return false;
          }
        });
      }

      // Filter by year
      if (selectedYear) {
        filtered = filtered.filter(piano => {
          try {
            return piano.piano_year !== null && 
                   piano.piano_year !== undefined && 
                   piano.piano_year.toString() === selectedYear;
          } catch (e) {
            console.warn('Error filtering piano by year:', piano, e);
            return false;
          }
        });
      }

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(piano => 
          (piano.piano_title && piano.piano_title.toLowerCase().includes(term)) ||
          (piano.artist_name && piano.artist_name.toLowerCase().includes(term)) ||
          (piano.piano_search && piano.piano_search.toLowerCase().includes(term))
        );
      }

      // Sort: program 34 first, then by year (desc), then by ID (asc)
      filtered.sort((a, b) => {
        const aProgram = a.piano_program || 0;
        const bProgram = b.piano_program || 0;
        const aYear = a.piano_year || 0;
        const bYear = b.piano_year || 0;
        
        if (aProgram === 34 && bProgram !== 34) return -1;
        if (aProgram !== 34 && bProgram === 34) return 1;
        if (aYear !== bYear) return bYear - aYear;
        return a.id - b.id;
      });

      setFilteredPianos(filtered);
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredPianos([]);
    }
  };

  const updateMapMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;


    // Add new markers for filtered pianos
    filteredPianos.forEach((piano) => {
      if (piano.perm_lat && piano.perm_lng) {
        const el = document.createElement('div');
        el.className = 'piano-marker';
        el.style.backgroundColor = '#22c55e';
        el.style.border = '2px solid #ffffff';
        el.style.borderRadius = '50%';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        // Highlight selected piano
        if (selectedPiano && selectedPiano.id === piano.id) {
          el.style.backgroundColor = '#f59e0b';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
        }

        const marker = new mapboxgl.Marker(el)
          .setLngLat([parseFloat(piano.perm_lng!.toString()), parseFloat(piano.perm_lat!.toString())])
          .addTo(map.current!);

        el.addEventListener('click', () => {
          selectPiano(piano);
        });

        markers.current.push(marker);
        bounds.extend([parseFloat(piano.perm_lng!.toString()), parseFloat(piano.perm_lat!.toString())]);
        hasValidCoordinates = true;
      }
    });

    // Fit map to show all markers
    if (hasValidCoordinates && map.current) {
      map.current.fitBounds(bounds, { 
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15
      });
    }
  };

  const selectPiano = async (piano: Piano) => {
    setSelectedPiano(piano);
    
    if (map.current && piano.perm_lat && piano.perm_lng) {
      try {
        map.current.flyTo({
          center: [parseFloat(piano.perm_lng!.toString()), parseFloat(piano.perm_lat!.toString())],
          zoom: 15,
          essential: true
        });
      } catch (error) {
        console.error('Error flying to piano location:', error);
      }
    }

    // Scroll to piano in list on mobile
    if (!isDesktop) {
      setTimeout(() => {
        const pianoElement = document.getElementById(`piano-${piano.id}`);
        if (pianoElement) {
          pianoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleProgramChange = (newProgram: string) => {
    setSelectedProgram(newProgram);
    
    // If the current year is not available for the new program, clear it
    if (newProgram && selectedYear) {
      const availableYearsForProgram = [...new Set(
        pianos
          .filter(piano => piano.piano_program?.toString() === newProgram)
          .map(piano => piano.piano_year)
          .filter(year => year !== null && year !== undefined)
      )];
      
      if (!availableYearsForProgram.includes(parseInt(selectedYear))) {
        setSelectedYear('');
      }
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    
    // If the current program is not available for the new year, clear it
    if (newYear && selectedProgram) {
      const availableProgramIds = [...new Set(
        pianos
          .filter(piano => piano.piano_year?.toString() === newYear)
          .map(piano => piano.piano_program)
          .filter(id => id !== null && id !== undefined)
      )].map(id => Number(id));
      
      if (!availableProgramIds.includes(parseInt(selectedProgram))) {
        setSelectedProgram('');
      }
    }
  };

  const clearFilters = () => {
    setSelectedProgram('');
    setSelectedYear('');
    setSearchTerm('');
    setSelectedPiano(null);
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const getPaginatedPianos = () => {
    const endIndex = currentPage * itemsPerPage;
    return filteredPianos.slice(0, endIndex);
  };

  const hasMorePianos = () => {
    return currentPage * itemsPerPage < filteredPianos.length;
  };

  return (
    <div className="h-full max-h-full space-y-4 pt-12 flex flex-col xl:bg-white xl:border xl:border-gray-200 xl:shadow-sm xl:rounded-xl">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-3">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          SFH Piano Gallery
        </h2>
        <p className="mt-3 text-md text-gray-600">
          The gallery below represents over 700+ Sing for Hope Pianos that have been
          placed in permanent homes such as schools, hospitals, transit hubs,
          refugee camps, and community-based organizations.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:flex justify-between items-center gap-x-2 border-b border-gray-200">
        {/* Search Input */}
        <div className="flex flex-row space-x-1 mb-2 md:mb-0">
          <div className="relative md:min-w-[400px] w-full">
            <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-3.5">
              <svg className="flex-shrink-0 w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              className="py-2 px-3 ps-10 pe-16 block w-full bg-gray-200 xl:bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search pianos, artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-row items-center space-x-2">
          <div className="text-sm font-bold text-gray-700">Filter:</div>
          
          {/* Program Filter */}
          <div className="relative">
            {isDesktop ? (
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={selectedProgram}
                onChange={(e) => handleProgramChange(e.target.value)}
              >
                <option value="">All Programs</option>
                {availablePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.act_title}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <button
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 text-left flex items-center justify-between"
                  onClick={() => setShowProgramDropdown(!showProgramDropdown)}
                >
                  <span>{selectedProgram ? availablePrograms.find(p => p.id.toString() === selectedProgram)?.act_title : 'All Programs'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showProgramDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      className="w-full text-left p-3 text-base hover:bg-gray-100 border-b border-gray-200"
                      onClick={() => {
                        handleProgramChange('');
                        setShowProgramDropdown(false);
                      }}
                    >
                      All Programs
                    </button>
                    {availablePrograms.map((program) => (
                      <button
                        key={program.id}
                        className="w-full text-left p-3 text-base hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                        onClick={() => {
                          handleProgramChange(program.id.toString());
                          setShowProgramDropdown(false);
                        }}
                      >
                        {program.act_title}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Year Filter */}
          <div className="relative">
            {isDesktop ? (
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <button
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 text-left flex items-center justify-between"
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <span>{selectedYear || 'All Years'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showYearDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      className="w-full text-left p-3 text-base hover:bg-gray-100 border-b border-gray-200"
                      onClick={() => {
                        handleYearChange('');
                        setShowYearDropdown(false);
                      }}
                    >
                      All Years
                    </button>
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        className="w-full text-left p-3 text-base hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                        onClick={() => {
                          handleYearChange(year.toString());
                          setShowYearDropdown(false);
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Clear Filters */}
          {(selectedProgram || selectedYear || searchTerm) && (
            <button
              onClick={clearFilters}
              className="py-2 px-3 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Desktop: Two Column, Mobile: Map + Overlay */}
      <div className={`flex ${isDesktop ? 'lg:flex-row' : 'flex-col'} h-full`}>
        {/* Map Container */}
        <div className={`${isDesktop ? 'lg:w-1/2 lg:h-[80vh]' : 'h-[60vh] relative'} bg-gray-100`}>
          <div ref={mapContainer} className="w-full h-full" />
          
          {/* Selected Piano Info (Mobile Overlay) */}
          {!isDesktop && selectedPiano && (
            <div className="absolute bottom-4 left-4 right-4 bg-white p-4 shadow-lg rounded-lg border">
              <div className="flex gap-3">
                <img 
                  src={normalizeImageUrl(selectedPiano.piano_image)} 
                  alt={selectedPiano.piano_title}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/pianos-icon.png'; }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight">{selectedPiano.piano_title}</h3>
                  <p className="text-sm text-gray-600">{selectedPiano.artist_name}</p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{selectedPiano.piano_year || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedPiano(null)}
                    className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                  <a 
                    href={`/piano/${selectedPiano.piano_url}`}
                    className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  >
                    →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Piano List */}
        <div className={`${isDesktop ? 'lg:w-1/2 lg:h-[80vh] lg:overflow-y-auto' : 'flex-1'} bg-white`}>
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {getPaginatedPianos().length} of {filteredPianos.length} pianos
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {getPaginatedPianos().map((piano) => (
                <div
                  key={piano.id}
                  id={`piano-${piano.id}`}
                  className={`bg-white border border-gray-200 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedPiano?.id === piano.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                  onClick={() => selectPiano(piano)}
                >
                  <div className="relative group">
                    <img
                      className="w-full h-40 object-cover rounded-t-xl"
                      src={normalizeImageUrl(piano.piano_image)}
                      alt={piano.piano_title}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/pianos-icon.png'; }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 opacity-90 rounded-full bg-green-500 text-white font-bold text-xs">
                        {piano.piano_year || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 leading-tight mb-1">
                      {piano.piano_title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {piano.artist_name}
                    </p>
                    <a 
                      href={`/piano/${piano.piano_url}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMorePianos() && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
                >
                  Load More Pianos
                </button>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with error boundary
const PianoGalleryWithErrorBoundary: React.FC = () => {
  return (
    <PianoGalleryErrorBoundary>
      <PianoGallery />
    </PianoGalleryErrorBoundary>
  );
};

export default PianoGalleryWithErrorBoundary;
