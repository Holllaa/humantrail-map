
import React, { useMemo } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { calculateAnalytics } from '@/utils/tracking';
import { Users, Clock, ArrowRight, TrendingUp } from 'lucide-react';

const AnalyticsPanel: React.FC = () => {
  const { tracks } = useAnalytics();
  
  // Calculate analytics metrics from the track data
  const analytics = useMemo(() => {
    return calculateAnalytics(tracks);
  }, [tracks]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-fade-up">
      {/* Visitors Card */}
      <div className="glass-panel p-4 flex items-center">
        <div className="bg-retail-blue/10 p-3 rounded-full mr-4">
          <Users size={24} className="text-retail-blue" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Visitors
          </h3>
          <p className="text-2xl font-bold">{analytics.totalVisitors}</p>
        </div>
      </div>
      
      {/* Average Time Card */}
      <div className="glass-panel p-4 flex items-center">
        <div className="bg-retail-purple/10 p-3 rounded-full mr-4">
          <Clock size={24} className="text-retail-purple" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg. Time in Store
          </h3>
          <p className="text-2xl font-bold">
            {analytics.averageTimeSeconds} <span className="text-sm font-normal">seconds</span>
          </p>
        </div>
      </div>
      
      {/* Average Path Length */}
      <div className="glass-panel p-4 flex items-center">
        <div className="bg-retail-teal/10 p-3 rounded-full mr-4">
          <ArrowRight size={24} className="text-retail-teal" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg. Path Length
          </h3>
          <p className="text-2xl font-bold">
            {analytics.averageDistance} <span className="text-sm font-normal">pixels</span>
          </p>
        </div>
      </div>
      
      {/* Total Distance */}
      <div className="glass-panel p-4 flex items-center">
        <div className="bg-retail-green/10 p-3 rounded-full mr-4">
          <TrendingUp size={24} className="text-retail-green" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Travel Distance
          </h3>
          <p className="text-2xl font-bold">
            {analytics.totalDistance} <span className="text-sm font-normal">pixels</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
