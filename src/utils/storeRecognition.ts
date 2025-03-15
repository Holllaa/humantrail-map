
import { StoreLayout } from "@/context/AnalyticsContext";

// Types for store areas and features
export type StoreArea = {
  id: string;
  type: 'walkway' | 'shelf' | 'counter' | 'entrance' | 'exit' | 'cashier' | 'unknown';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
};

export type StoreFeatures = {
  areas: StoreArea[];
  walkable: boolean[][];
  resolution: number;
};

// Color ranges for different store elements
const COLOR_RANGES = {
  walkway: { min: 200, max: 255 }, // Light areas are walkways
  shelf: { min: 50, max: 150 },    // Medium dark areas are shelves
  counter: { min: 100, max: 180 }, // Medium areas are counters
  entrance: { min: 220, max: 255 }, // Very light areas are entrances
  wall: { min: 0, max: 50 }        // Very dark areas are walls
};

/**
 * Analyzes a store floor plan image to detect areas and features
 */
export const analyzeStoreLayout = (imageElement: HTMLImageElement, resolution: number = 20): Promise<StoreFeatures> => {
  return new Promise((resolve) => {
    // Create canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Set canvas dimensions
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    
    // Draw image to canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Create matrix with specified resolution
    const gridWidth = Math.ceil(canvas.width / resolution);
    const gridHeight = Math.ceil(canvas.height / resolution);
    
    // Initialize walkable array (1 = walkable, 0 = obstacle)
    const walkable: boolean[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));
    
    // Track detected areas
    const areas: StoreArea[] = [];
    let areaCount = 0;
    
    // For each cell in the grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        // Calculate brightness and analyze this grid cell
        const { avgBrightness, avgRed, avgGreen, avgBlue } = analyzeGridCell(
          pixels, 
          x, y, 
          resolution, 
          canvas.width, 
          canvas.height
        );
        
        // Determine area type based on brightness
        let areaType: StoreArea['type'] = 'unknown';
        
        if (avgBrightness > COLOR_RANGES.walkway.min) {
          areaType = 'walkway';
          walkable[y][x] = true;
        } else if (avgBrightness < COLOR_RANGES.wall.max) {
          areaType = 'unknown'; // Wall (not walkable)
          walkable[y][x] = false;
        } else if (avgBrightness > COLOR_RANGES.shelf.min && avgBrightness < COLOR_RANGES.shelf.max) {
          areaType = 'shelf';
          walkable[y][x] = false;
        } else if (avgBrightness > COLOR_RANGES.counter.min && avgBrightness < COLOR_RANGES.counter.max) {
          // Detect counters or cashiers based on color patterns
          if (avgRed > avgBlue + 20 && avgRed > avgGreen + 20) {
            areaType = 'cashier';
            walkable[y][x] = true;
          } else {
            areaType = 'counter';
            walkable[y][x] = false;
          }
        }
        
        // Only add distinct areas
        if (areaType !== 'unknown') {
          areas.push({
            id: `area-${areaCount++}`,
            type: areaType,
            x: x * resolution,
            y: y * resolution,
            width: resolution,
            height: resolution,
            color: `rgb(${avgRed}, ${avgGreen}, ${avgBlue})`
          });
        }
      }
    }
    
    // Detect entrances/exits (typically at the edges of walkable areas)
    detectEntrancesAndExits(areas, walkable, resolution);
    
    // Merge adjacent areas of the same type
    const mergedAreas = mergeAdjacentAreas(areas, resolution);
    
    resolve({
      areas: mergedAreas,
      walkable,
      resolution
    });
  });
};

/**
 * Analyze a grid cell to determine its properties
 */
const analyzeGridCell = (
  pixels: Uint8ClampedArray,
  gridX: number,
  gridY: number,
  resolution: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  let totalBrightness = 0;
  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;
  let sampleCount = 0;
  
  // Define cell boundaries
  const startX = gridX * resolution;
  const endX = Math.min((gridX + 1) * resolution, canvasWidth);
  const startY = gridY * resolution;
  const endY = Math.min((gridY + 1) * resolution, canvasHeight);
  
  // Sample pixels within the cell
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      // Get pixel index (RGBA, 4 bytes per pixel)
      const i = (y * canvasWidth + x) * 4;
      
      // Extract RGB values
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      totalRed += r;
      totalGreen += g;
      totalBlue += b;
      totalBrightness += (r + g + b) / 3;
      sampleCount++;
    }
  }
  
  // Calculate averages
  const avgBrightness = sampleCount > 0 ? totalBrightness / sampleCount : 0;
  const avgRed = sampleCount > 0 ? totalRed / sampleCount : 0;
  const avgGreen = sampleCount > 0 ? totalGreen / sampleCount : 0;
  const avgBlue = sampleCount > 0 ? totalBlue / sampleCount : 0;
  
  return { avgBrightness, avgRed, avgGreen, avgBlue };
};

/**
 * Detect entrances and exits at the edges of walkable areas
 */
const detectEntrancesAndExits = (areas: StoreArea[], walkable: boolean[][], resolution: number) => {
  const height = walkable.length;
  const width = walkable[0].length;
  
  // Check edges for walkable areas that might be entrances/exits
  for (let y = 0; y < height; y++) {
    // Left edge
    if (walkable[y][0]) {
      areas.push({
        id: `entrance-left-${y}`,
        type: 'entrance',
        x: 0,
        y: y * resolution,
        width: resolution,
        height: resolution
      });
    }
    
    // Right edge
    if (walkable[y][width - 1]) {
      areas.push({
        id: `exit-right-${y}`,
        type: 'exit',
        x: (width - 1) * resolution,
        y: y * resolution,
        width: resolution,
        height: resolution
      });
    }
  }
  
  for (let x = 0; x < width; x++) {
    // Top edge
    if (walkable[0][x]) {
      areas.push({
        id: `entrance-top-${x}`,
        type: 'entrance',
        x: x * resolution,
        y: 0,
        width: resolution,
        height: resolution
      });
    }
    
    // Bottom edge
    if (walkable[height - 1][x]) {
      areas.push({
        id: `exit-bottom-${x}`,
        type: 'exit',
        x: x * resolution,
        y: (height - 1) * resolution,
        width: resolution,
        height: resolution
      });
    }
  }
};

/**
 * Merge adjacent areas of the same type for a cleaner representation
 */
const mergeAdjacentAreas = (areas: StoreArea[], resolution: number): StoreArea[] => {
  // Group areas by type
  const areasByType: Record<string, StoreArea[]> = {};
  
  for (const area of areas) {
    if (!areasByType[area.type]) {
      areasByType[area.type] = [];
    }
    areasByType[area.type].push(area);
  }
  
  const mergedAreas: StoreArea[] = [];
  
  // Process each type separately
  Object.keys(areasByType).forEach(type => {
    const typeAreas = areasByType[type];
    
    // Simple merge algorithm to combine adjacent cells
    let processed: boolean[] = Array(typeAreas.length).fill(false);
    
    for (let i = 0; i < typeAreas.length; i++) {
      if (processed[i]) continue;
      
      const baseArea = typeAreas[i];
      let merged = { ...baseArea };
      processed[i] = true;
      
      let mergeHappened = true;
      
      // Continue merging until no more merges are possible
      while (mergeHappened) {
        mergeHappened = false;
        
        for (let j = 0; j < typeAreas.length; j++) {
          if (processed[j]) continue;
          
          const candidateArea = typeAreas[j];
          
          // Check if areas are adjacent
          if (areAreasAdjacent(merged, candidateArea, resolution)) {
            // Merge the areas
            merged = mergeAreas(merged, candidateArea);
            processed[j] = true;
            mergeHappened = true;
          }
        }
      }
      
      mergedAreas.push(merged);
    }
  });
  
  return mergedAreas;
};

/**
 * Check if two areas are adjacent
 */
const areAreasAdjacent = (a: StoreArea, b: StoreArea, resolution: number): boolean => {
  // Two areas are adjacent if they share an edge or are very close
  const tolerance = resolution / 2;
  
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;
  
  // Check horizontal adjacency (left-right)
  const horizontalAdjacent = 
    (Math.abs(aRight - b.x) <= tolerance || Math.abs(a.x - bRight) <= tolerance) &&
    (a.y < bBottom && aBottom > b.y);
  
  // Check vertical adjacency (top-bottom)
  const verticalAdjacent = 
    (Math.abs(aBottom - b.y) <= tolerance || Math.abs(a.y - bBottom) <= tolerance) &&
    (a.x < bRight && aRight > b.x);
  
  return horizontalAdjacent || verticalAdjacent;
};

/**
 * Merge two areas into one
 */
const mergeAreas = (a: StoreArea, b: StoreArea): StoreArea => {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.width, b.x + b.width);
  const y2 = Math.max(a.y + a.height, b.y + b.height);
  
  return {
    id: a.id, // Keep the first area's ID
    type: a.type,
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    color: a.color
  };
};

/**
 * Generate insights from the store layout and tracking data
 */
export const generateStoreInsights = (
  storeFeatures: StoreFeatures,
  heatmapData: { x: number; y: number; value: number }[]
) => {
  // Count hotspots in each area type
  const areaHeatCounts: Record<string, { count: number, maxValue: number }> = {};
  
  // Initialize counters for each area type
  storeFeatures.areas.forEach(area => {
    if (!areaHeatCounts[area.type]) {
      areaHeatCounts[area.type] = { count: 0, maxValue: 0 };
    }
  });
  
  // Count heat points in each area
  heatmapData.forEach(point => {
    storeFeatures.areas.forEach(area => {
      if (
        point.x >= area.x && 
        point.x <= area.x + area.width && 
        point.y >= area.y && 
        point.y <= area.y + area.height
      ) {
        areaHeatCounts[area.type].count++;
        areaHeatCounts[area.type].maxValue = Math.max(areaHeatCounts[area.type].maxValue, point.value);
      }
    });
  });
  
  // Generate insights based on area heat distribution
  const insights = [];
  
  if (areaHeatCounts.walkway?.count > 0) {
    insights.push(`Main walkways have ${areaHeatCounts.walkway.count} traffic points`);
  }
  
  if (areaHeatCounts.shelf?.count > 0) {
    insights.push(`Shelves attract ${areaHeatCounts.shelf.count} customer interactions`);
  }
  
  if (areaHeatCounts.counter?.count > 0) {
    insights.push(`Service counters see ${areaHeatCounts.counter.count} customer visits`);
  }
  
  if (areaHeatCounts.cashier?.count > 0) {
    insights.push(`Checkout areas have ${areaHeatCounts.cashier.count} customer stops`);
  }
  
  // Add recommendations based on heat distribution
  const recommendations = [];
  
  // Find most and least visited areas
  let mostVisitedType = '';
  let leastVisitedType = '';
  let maxCount = 0;
  let minCount = Infinity;
  
  Object.entries(areaHeatCounts).forEach(([type, data]) => {
    if (data.count > maxCount && type !== 'entrance' && type !== 'exit') {
      maxCount = data.count;
      mostVisitedType = type;
    }
    
    if (data.count < minCount && data.count > 0 && type !== 'entrance' && type !== 'exit') {
      minCount = data.count;
      leastVisitedType = type;
    }
  });
  
  if (mostVisitedType) {
    recommendations.push(`Consider adding more products to ${mostVisitedType} areas to capitalize on high traffic`);
  }
  
  if (leastVisitedType) {
    recommendations.push(`${leastVisitedType} areas need attention - consider rearranging or adding promotions`);
  }
  
  // Check if entrance areas lead to good flow
  if (areaHeatCounts.entrance && areaHeatCounts.walkway) {
    if (areaHeatCounts.entrance.maxValue > 0.7 && areaHeatCounts.walkway.maxValue < 0.5) {
      recommendations.push(`Entrance areas are congested - consider widening the entrance or improving flow`);
    }
  }
  
  return {
    insights,
    recommendations,
    areaStats: Object.entries(areaHeatCounts).map(([type, data]) => ({
      type,
      visits: data.count,
      heatLevel: data.maxValue
    }))
  };
};
