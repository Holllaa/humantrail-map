import { HeatmapData, PathPoint, PersonTrack } from "@/context/AnalyticsContext";

// Generate heatmap data from tracks
export const generateHeatmapFromTracks = (
  tracks: PersonTrack[],
  width: number,
  height: number,
  gridSize: number = 20
): HeatmapData[] => {
  // Create a grid to count visits in each cell
  const gridWidth = Math.ceil(width / gridSize);
  const gridHeight = Math.ceil(height / gridSize);
  const grid: number[][] = Array(gridHeight)
    .fill(0)
    .map(() => Array(gridWidth).fill(0));

  // Count visits in each grid cell
  tracks.forEach(track => {
    track.path.forEach(point => {
      const gridX = Math.floor(point.x / gridSize);
      const gridY = Math.floor(point.y / gridSize);
      
      // Ensure we're within grid bounds
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        grid[gridY][gridX]++;
      }
    });
  });

  // Find max value for normalization
  let maxValue = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      maxValue = Math.max(maxValue, grid[y][x]);
    }
  }

  // Convert grid to heatmap data format
  const heatmapData: HeatmapData[] = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] > 0) {
        heatmapData.push({
          x: x * gridSize + gridSize / 2,
          y: y * gridSize + gridSize / 2,
          value: maxValue > 0 ? grid[y][x] / maxValue : 0,
        });
      }
    }
  }

  return heatmapData;
};

// Smooth a path by removing noise and jitter
export const smoothPath = (path: PathPoint[], windowSize: number = 5): PathPoint[] => {
  if (path.length <= windowSize) {
    return path;
  }

  const smoothedPath: PathPoint[] = [];
  
  // Keep first point
  smoothedPath.push(path[0]);
  
  // Smooth middle points
  for (let i = windowSize; i < path.length - windowSize; i++) {
    let sumX = 0;
    let sumY = 0;
    
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      sumX += path[j].x;
      sumY += path[j].y;
    }
    
    smoothedPath.push({
      x: sumX / (windowSize * 2 + 1),
      y: sumY / (windowSize * 2 + 1),
      timestamp: path[i].timestamp,
    });
  }
  
  // Keep last point
  smoothedPath.push(path[path.length - 1]);
  
  return smoothedPath;
};

// Generate a path string for SVG from a track
export const generatePathString = (path: PathPoint[]): string => {
  if (path.length === 0) return "";
  
  let pathString = `M ${path[0].x} ${path[0].y}`;
  
  for (let i = 1; i < path.length; i++) {
    pathString += ` L ${path[i].x} ${path[i].y}`;
  }
  
  return pathString;
};

// Calculate analytics from tracks
export const calculateAnalytics = (tracks: PersonTrack[]) => {
  const totalVisitors = tracks.length;
  
  // Calculate average time spent (in ms)
  let totalTime = 0;
  tracks.forEach(track => {
    if (track.path.length >= 2) {
      const startTime = track.path[0].timestamp;
      const endTime = track.path[track.path.length - 1].timestamp;
      totalTime += (endTime - startTime);
    }
  });
  const averageTimeMs = totalVisitors > 0 ? totalTime / totalVisitors : 0;
  const averageTimeSeconds = Math.round(averageTimeMs / 1000);
  
  // Calculate total distance walked (in pixels)
  let totalDistance = 0;
  tracks.forEach(track => {
    for (let i = 1; i < track.path.length; i++) {
      const dx = track.path[i].x - track.path[i-1].x;
      const dy = track.path[i].y - track.path[i-1].y;
      totalDistance += Math.sqrt(dx*dx + dy*dy);
    }
  });
  const averageDistance = totalVisitors > 0 ? totalDistance / totalVisitors : 0;
  
  return {
    totalVisitors,
    averageTimeSeconds,
    averageDistance: Math.round(averageDistance),
    totalDistance: Math.round(totalDistance),
  };
};

// Generate random demonstration data for development purposes
export const generateDemoData = (
  width: number, 
  height: number, 
  numPeople: number = 10,
  pointsPerPerson: number = 100
): PersonTrack[] => {
  const tracks: PersonTrack[] = [];
  
  for (let i = 0; i < numPeople; i++) {
    const id = `person-${i}`;
    const path: PathPoint[] = [];
    
    // Starting point (usually from entrance)
    const startX = Math.random() < 0.7 ? 0 : width * Math.random();
    const startY = startX === 0 ? height * Math.random() : 0;
    let x = startX;
    let y = startY;
    
    const now = Date.now();
    
    for (let j = 0; j < pointsPerPerson; j++) {
      // Add some "attraction points" to make movement more realistic
      const targetX = j % 20 === 0 ? width * Math.random() : x;
      const targetY = j % 20 === 0 ? height * Math.random() : y;
      
      // Move toward target with some randomness
      x += (targetX - x) * 0.1 + (Math.random() - 0.5) * 10;
      y += (targetY - y) * 0.1 + (Math.random() - 0.5) * 10;
      
      // Keep within bounds
      x = Math.max(0, Math.min(width, x));
      y = Math.max(0, Math.min(height, y));
      
      path.push({
        x,
        y,
        timestamp: now + j * 1000, // One point per second
      });
    }
    
    tracks.push({
      id,
      path,
      active: Math.random() > 0.3, // Some tracks are inactive
    });
  }
  
  return tracks;
};
