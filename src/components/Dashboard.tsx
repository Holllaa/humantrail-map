
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import Header from './Header';
import VideoProcessor from './VideoProcessor';
import TrackingView from './TrackingView';
import HeatmapView from './HeatmapView';
import AnalyticsPanel from './AnalyticsPanel';
import TrackingModel from './TrackingModel';
import FloorMapView from './FloorMapView';

const Dashboard: React.FC = () => {
  return (
    <AnalyticsProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Video */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-medium tracking-tight">Video Processing</h2>
              <VideoProcessor />
            </div>
            
            {/* Right Column - Analytics */}
            <div className="space-y-6">
              <h2 className="text-2xl font-medium tracking-tight">Analytics</h2>
              <AnalyticsPanel />
              <TrackingModel />
            </div>
          </div>
          
          {/* Visualization Tabs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-medium tracking-tight">Visualization</h2>
            <Tabs defaultValue="tracks" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="tracks">Path Tracking</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                <TabsTrigger value="floormap">Floor Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="tracks" className="mt-4">
                <div className="aspect-video w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-subtle border border-gray-100 dark:border-gray-700">
                  <TrackingView />
                </div>
              </TabsContent>
              <TabsContent value="heatmap" className="mt-4">
                <div className="aspect-video w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-subtle border border-gray-100 dark:border-gray-700">
                  <HeatmapView />
                </div>
              </TabsContent>
              <TabsContent value="floormap" className="mt-4">
                <div className="aspect-video w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-subtle border border-gray-100 dark:border-gray-700">
                  <FloorMapView />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AnalyticsProvider>
  );
};

export default Dashboard;
