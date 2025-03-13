
import React from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';

const Header: React.FC = () => {
  const { isModelLoaded, isProcessing, processingProgress } = useAnalytics();

  return (
    <header className="w-full px-8 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-retail-blue w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
            RT
          </div>
          <h1 className="text-2xl font-medium tracking-tight">
            <span className="text-retail-blue font-semibold">Retail</span>Track
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status indicators */}
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isModelLoaded ? 'bg-retail-green animate-pulse' : 'bg-retail-gray'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Model {isModelLoaded ? 'Ready' : 'Loading'}
            </span>
          </div>

          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-retail-blue rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {Math.round(processingProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
