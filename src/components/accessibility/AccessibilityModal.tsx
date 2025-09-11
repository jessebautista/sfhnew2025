import React, { useState, useEffect } from 'react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 100);
      setHighContrast(settings.highContrast || false);
      setReduceMotion(settings.reduceMotion || false);
      setScreenReader(settings.screenReader || false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const applySettings = () => {
    const settings = {
      fontSize,
      highContrast,
      reduceMotion,
      screenReader
    };

    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    const root = document.documentElement;
    root.style.fontSize = `${fontSize}%`;
    
    if (highContrast) {
      document.body.classList.add('high-contrast');
      // Force a repaint to ensure styles are applied
      document.body.offsetHeight;
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    if (reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    if (screenReader) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }

    // Debug log to verify settings are being applied
    console.log('Accessibility settings applied:', settings);
    console.log('Body classes:', document.body.className);
  };

  useEffect(() => {
    applySettings();
  }, [fontSize, highContrast, reduceMotion, screenReader]);

  const resetSettings = () => {
    setFontSize(100);
    setHighContrast(false);
    setReduceMotion(false);
    setScreenReader(false);
    localStorage.removeItem('accessibility-settings');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 id="accessibility-title" className="text-xl font-bold text-gray-900">
              Accessibility Options
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-melody focus:ring-offset-2 rounded-md p-1"
              aria-label="Close accessibility options"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="font-size-slider" className="block text-sm font-medium text-gray-700 mb-2">
                Font Size: {fontSize}%
              </label>
              <input
                id="font-size-slider"
                type="range"
                min="75"
                max="150"
                step="25"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                aria-describedby="font-size-help"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>75%</span>
                <span>100%</span>
                <span>125%</span>
                <span>150%</span>
              </div>
              <p id="font-size-help" className="text-xs text-gray-500 mt-1">
                Adjust text size for better readability
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="high-contrast"
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="h-4 w-4 text-melody focus:ring-melody border-gray-300 rounded"
                />
                <label htmlFor="high-contrast" className="ml-3 block text-sm text-gray-700">
                  High Contrast Mode
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Increase color contrast for better visibility
              </p>

              <div className="flex items-center">
                <input
                  id="reduce-motion"
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => setReduceMotion(e.target.checked)}
                  className="h-4 w-4 text-melody focus:ring-melody border-gray-300 rounded"
                />
                <label htmlFor="reduce-motion" className="ml-3 block text-sm text-gray-700">
                  Reduce Motion
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Minimize animations and transitions
              </p>

              <div className="flex items-center">
                <input
                  id="screen-reader"
                  type="checkbox"
                  checked={screenReader}
                  onChange={(e) => setScreenReader(e.target.checked)}
                  className="h-4 w-4 text-melody focus:ring-melody border-gray-300 rounded"
                />
                <label htmlFor="screen-reader" className="ml-3 block text-sm text-gray-700">
                  Screen Reader Optimized
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Optimize content for assistive technologies
              </p>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={resetSettings}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-melody border border-transparent rounded-md hover:bg-melodydark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-melody transition-colors"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityModal;