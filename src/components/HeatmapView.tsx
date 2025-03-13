
import React, { useEffect, useRef } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { drawHeatmap } from '@/utils/heatmap';

const HeatmapView: React.FC = () => {
  const { heatmapData, storeLayout } = useAnalytics();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Draw the heatmap whenever data or layout changes
  useEffect(() => {
    if (!canvasRef.current || heatmapData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = storeLayout.width;
    canvas.height = storeLayout.height;
    
    // Draw the heatmap
    drawHeatmap(ctx, heatmapData, storeLayout.width, storeLayout.height);
  }, [heatmapData, storeLayout]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-subtle"
    >
      {/* Store layout background */}
      {storeLayout.imageUrl ? (
        <img 
          src={storeLayout.imageUrl} 
          alt="Store Layout"
          className="absolute top-0 left-0 w-full h-full object-contain z-10"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center z-10">
          <p className="text-gray-400 dark:text-gray-600">No store layout uploaded</p>
        </div>
      )}
      
      {/* Heatmap canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full z-20 mix-blend-multiply"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 z-30 shadow-subtle border border-gray-100 dark:border-gray-700 flex flex-col space-y-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Foot Traffic</p>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-heatmap-low" />
          <span className="text-xs text-gray-700 dark:text-gray-300">Low</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-heatmap-medium" />
          <span className="text-xs text-gray-700 dark:text-gray-300">Medium</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-heatmap-high" />
          <span className="text-xs text-gray-700 dark:text-gray-300">High</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView;
