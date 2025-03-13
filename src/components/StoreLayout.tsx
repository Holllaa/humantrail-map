
import React from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import UploadZone from './UploadZone';

const StoreLayout: React.FC = () => {
  const { storeLayout } = useAnalytics();
  
  return (
    <div className="w-full space-y-4">
      {!storeLayout.imageUrl ? (
        // Layout upload zone
        <UploadZone type="layout" />
      ) : (
        // Display the store layout
        <div className="glass-panel p-4 space-y-4">
          <h3 className="text-lg font-medium">Store Layout</h3>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <img 
              src={storeLayout.imageUrl}
              alt="Store Layout"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Dimensions: {storeLayout.width} x {storeLayout.height}</span>
            <span>Scale: {storeLayout.scale}x</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLayout;
