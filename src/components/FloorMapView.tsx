
import React, { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { drawHeatmap } from '@/utils/heatmap';
import { analyzeStoreLayout, generateStoreInsights, StoreFeatures, StoreArea } from '@/utils/storeRecognition';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MapPin, Eye, EyeOff } from 'lucide-react';

const FloorMapView: React.FC = () => {
  const { storeLayout, heatmapData, tracks } = useAnalytics();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeLayerRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [storeFeatures, setStoreFeatures] = useState<StoreFeatures | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<{
    insights: string[];
    recommendations: string[];
    areaStats: { type: string; visits: number; heatLevel: number }[];
  } | null>(null);
  
  // Load and analyze store layout when image changes
  useEffect(() => {
    if (!storeLayout.imageUrl) return;
    
    const analyzeLayout = async () => {
      setIsAnalyzing(true);
      
      try {
        // Load the image
        const img = new Image();
        img.src = storeLayout.imageUrl!;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Analyze the store layout
        const features = await analyzeStoreLayout(img);
        setStoreFeatures(features);
        
        // Draw layout areas
        if (storeLayerRef.current) {
          drawStoreLayout(storeLayerRef.current, features);
        }
        
        toast.success('Store layout analyzed successfully');
      } catch (error) {
        console.error('Error analyzing store layout:', error);
        toast.error('Failed to analyze store layout');
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    analyzeLayout();
  }, [storeLayout.imageUrl]);
  
  // Draw heatmap when data or layout changes
  useEffect(() => {
    if (!canvasRef.current || heatmapData.length === 0 || !showHeatmap) {
      // Clear canvas if not showing heatmap
      if (canvasRef.current && !showHeatmap) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = storeLayout.width;
    canvas.height = storeLayout.height;
    
    // Draw the heatmap
    drawHeatmap(ctx, heatmapData, storeLayout.width, storeLayout.height);
  }, [heatmapData, storeLayout, showHeatmap]);
  
  // Generate insights when both heatmap and store features are available
  useEffect(() => {
    if (!storeFeatures || heatmapData.length === 0) return;
    
    const storeInsights = generateStoreInsights(storeFeatures, heatmapData);
    setInsights(storeInsights);
  }, [storeFeatures, heatmapData]);
  
  // Draw store layout areas on canvas
  const drawStoreLayout = (canvas: HTMLCanvasElement, features: StoreFeatures) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = storeLayout.width;
    canvas.height = storeLayout.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each area with semi-transparency
    features.areas.forEach(area => {
      ctx.globalAlpha = 0.3;
      
      // Set colors based on area type
      switch (area.type) {
        case 'walkway':
          ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // Light blue
          break;
        case 'shelf':
          ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Brown
          break;
        case 'counter':
          ctx.fillStyle = 'rgba(220, 220, 220, 0.3)'; // Light gray
          break;
        case 'entrance':
          ctx.fillStyle = 'rgba(152, 251, 152, 0.5)'; // Pale green
          break;
        case 'exit':
          ctx.fillStyle = 'rgba(255, 182, 193, 0.5)'; // Light pink
          break;
        case 'cashier':
          ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; // Gold
          break;
        default:
          ctx.fillStyle = 'rgba(200, 200, 200, 0.2)'; // Default gray
      }
      
      // Fill area
      ctx.fillRect(area.x, area.y, area.width, area.height);
      
      // Add border
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // Reset alpha
      ctx.globalAlpha = 1.0;
    });
    
    // Draw icons or labels for special areas
    features.areas.forEach(area => {
      if (area.width < 15 || area.height < 15) return; // Skip small areas
      
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;
      
      if (area.type === 'entrance' || area.type === 'exit') {
        // Draw entrance/exit icon
        ctx.fillStyle = area.type === 'entrance' ? 'rgba(0, 128, 0, 0.7)' : 'rgba(220, 20, 60, 0.7)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Add label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(area.type.toUpperCase(), centerX, centerY + 15);
      }
      
      if (area.type === 'cashier' && area.width > 30 && area.height > 30) {
        // Draw cashier label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CASHIER', centerX, centerY);
      }
    });
  };
  
  // Handle auto-detection of store areas
  const handleAutoDetect = async () => {
    if (!storeLayout.imageUrl) {
      toast.error('Please upload a store layout image first');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Load the image
      const img = new Image();
      img.src = storeLayout.imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Analyze the store layout with higher resolution
      const features = await analyzeStoreLayout(img, 15);
      setStoreFeatures(features);
      
      // Draw layout areas
      if (storeLayerRef.current) {
        drawStoreLayout(storeLayerRef.current, features);
      }
      
      toast.success('Store areas automatically detected');
    } catch (error) {
      console.error('Error auto-detecting areas:', error);
      toast.error('Failed to detect store areas');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Toggle heatmap visibility
  const toggleHeatmap = () => {
    setShowHeatmap(prev => !prev);
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-subtle flex flex-col"
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium">Store Layout Analysis</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleHeatmap}
            className="flex items-center gap-1"
          >
            {showHeatmap ? <EyeOff size={16} /> : <Eye size={16} />}
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoDetect}
            disabled={isAnalyzing || !storeLayout.imageUrl}
            className="flex items-center gap-1"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            {isAnalyzing ? 'Analyzing...' : 'Auto-Detect Areas'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 h-full">
        <div className="relative w-2/3 overflow-hidden">
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
          
          {/* Store areas layer */}
          <canvas 
            ref={storeLayerRef} 
            className="absolute top-0 left-0 w-full h-full z-20"
          />
          
          {/* Heatmap canvas */}
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full z-30 mix-blend-multiply"
          />
          
          {/* Loading indicator */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/20 grid place-items-center z-40">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
                <Loader2 size={30} className="animate-spin text-primary mb-2" />
                <p>Analyzing store layout...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-1/3 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="space-y-4">
            <h4 className="font-medium text-base">Store Analysis</h4>
            
            {storeFeatures ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Areas detected:</span> {storeFeatures.areas.length}</p>
                <p><span className="font-semibold">Resolution:</span> {storeFeatures.resolution}px</p>
                <div>
                  <p className="font-semibold mb-1">Area types:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    {Object.entries(
                      storeFeatures.areas.reduce<Record<string, number>>((acc, area) => {
                        acc[area.type] = (acc[area.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <li key={type}>{type}: {count}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No analysis available yet. Click "Auto-Detect Areas" to analyze the store layout.</p>
            )}
            
            {insights && (
              <>
                <h4 className="font-medium text-base mt-4">Customer Insights</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Key observations:</p>
                    <ul className="list-disc list-inside pl-2 space-y-1">
                      {insights.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">Recommendations:</p>
                    <ul className="list-disc list-inside pl-2 space-y-1">
                      {insights.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">Area statistics:</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {insights.areaStats
                        .filter(stat => stat.visits > 0)
                        .sort((a, b) => b.visits - a.visits)
                        .map((stat, i) => (
                          <div 
                            key={i} 
                            className={`p-2 rounded-md bg-opacity-20 border border-opacity-30 text-center
                              ${stat.type === 'walkway' ? 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700' :
                                stat.type === 'shelf' ? 'bg-amber-100 border-amber-300 dark:bg-amber-900 dark:border-amber-700' :
                                stat.type === 'counter' ? 'bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-700' :
                                stat.type === 'cashier' ? 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700' :
                                stat.type === 'entrance' ? 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700' :
                                stat.type === 'exit' ? 'bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700' :
                                'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                              }`
                          }>
                            <p className="font-medium capitalize">{stat.type}</p>
                            <p className="text-xs">{stat.visits} visits</p>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 z-40 shadow-subtle border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Map Legend</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-blue-300/30" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Walkway</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-amber-800/30" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Shelf</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-gray-300/30" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Counter</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-400/50" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Cashier</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-green-300/50" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Entrance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-red-300/50" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorMapView;
