/**
 * Floor Map Utilities for mapping customer movement to store layout
 */

// Store layout mapping matrix
let floorMapMatrix = null;
let floorMapImage = null;

// Initialize floor map
function initFloorMap() {
  const floorMapImg = document.getElementById('floor-map-img');
  const floorMapCanvas = document.getElementById('floor-map-canvas');
  const floorMapUploadBtn = document.getElementById('upload-floor-map');
  const floorMapInput = document.getElementById('floor-map-input');
  
  // Set up event listeners
  floorMapUploadBtn.addEventListener('click', () => {
    floorMapInput.click();
  });
  
  floorMapInput.addEventListener('change', handleFloorMapUpload);
  
  // Set default placeholder image
  if (!floorMapImg.src || floorMapImg.src.includes('placeholder')) {
    floorMapImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPlVwbG9hZCBTdG9yZSBGbG9vciBNYXA8L3RleHQ+PC9zdmc+';
  }
  
  // Initialize canvas to match image dimensions
  floorMapCanvas.width = floorMapImg.naturalWidth || 800;
  floorMapCanvas.height = floorMapImg.naturalHeight || 600;
  
  // Create default floor map matrix
  createDefaultFloorMapMatrix();
}

// Handle floor map upload
function handleFloorMapUpload(e) {
  const file = e.target.files[0];
  if (!file || !file.type.includes('image/')) return;
  
  const floorMapImg = document.getElementById('floor-map-img');
  const floorMapCanvas = document.getElementById('floor-map-canvas');
  
  // Create object URL for the uploaded image
  const imageUrl = URL.createObjectURL(file);
  floorMapImg.src = imageUrl;
  
  // When image loads, update the canvas dimensions
  floorMapImg.onload = function() {
    floorMapCanvas.width = floorMapImg.naturalWidth;
    floorMapCanvas.height = floorMapImg.naturalHeight;
    
    // Store reference to floor map
    floorMapImage = floorMapImg;
    
    // Generate floor map matrix when image is loaded
    generateFloorMapMatrix();
  };
}

// Create a default floor map matrix
function createDefaultFloorMapMatrix() {
  // Simple 10x10 grid representing store layout
  // 0 = wall/obstacle, 1 = walkable area
  floorMapMatrix = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
}

// Generate floor map matrix from image
// In a real app, this would use computer vision to identify walkable areas
function generateFloorMapMatrix() {
  if (!floorMapImage) return;
  
  // For demo purposes, we'll create a simplified matrix
  // In a real app, this would use ML to detect floor areas vs. shelves/obstacles
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = floorMapImage.naturalWidth;
  canvas.height = floorMapImage.naturalHeight;
  
  // Draw image to canvas to access pixel data
  ctx.drawImage(floorMapImage, 0, 0);
  
  // Create a 20x20 grid for the store layout
  const gridWidth = 20;
  const gridHeight = 20;
  floorMapMatrix = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));
  
  // Simple algorithm: for demo, assume light pixels are walkable areas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      // Get average pixel value in this grid cell
      let totalBrightness = 0;
      let pixelCount = 0;
      
      const startX = Math.floor(x * canvas.width / gridWidth);
      const endX = Math.floor((x + 1) * canvas.width / gridWidth);
      const startY = Math.floor(y * canvas.height / gridHeight);
      const endY = Math.floor((y + 1) * canvas.height / gridHeight);
      
      // Sample pixels in this grid cell
      for (let py = startY; py < endY; py += 4) {
        for (let px = startX; px < endX; px += 4) {
          const i = (py * canvas.width + px) * 4;
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
      
      // Calculate average brightness
      const avgBrightness = totalBrightness / pixelCount;
      
      // Threshold to determine if walkable (light) or obstacle (dark)
      floorMapMatrix[y][x] = avgBrightness > 100 ? 1 : 0;
    }
  }
  
  // Draw the generated floor map matrix for visualization
  drawFloorMapMatrix();
}

// Draw the floor map matrix on canvas
function drawFloorMapMatrix() {
  if (!floorMapMatrix) return;
  
  const canvas = document.getElementById('floor-map-canvas');
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const cellWidth = canvas.width / floorMapMatrix[0].length;
  const cellHeight = canvas.height / floorMapMatrix.length;
  
  // Draw grid
  for (let y = 0; y < floorMapMatrix.length; y++) {
    for (let x = 0; x < floorMapMatrix[0].length; x++) {
      const cellValue = floorMapMatrix[y][x];
      
      // Only draw obstacles with a semi-transparent overlay
      if (cellValue === 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(
          x * cellWidth, 
          y * cellHeight, 
          cellWidth, 
          cellHeight
        );
      }
    }
  }
}

// Map tracking data to floor map coordinates
function mapTrackingToFloorMap(trackingData) {
  if (!floorMapMatrix || !trackingData.length) return [];
  
  // Create a deep copy of tracking data
  const mappedData = JSON.parse(JSON.stringify(trackingData));
  
  // Map each track's path to floor map coordinates
  mappedData.forEach(track => {
    track.floorMapPath = track.path.map(point => {
      // Convert normalized video coordinates to floor map grid
      const gridX = Math.floor(point.x * floorMapMatrix[0].length);
      const gridY = Math.floor(point.y * floorMapMatrix.length);
      
      // Ensure coordinates are within bounds
      const boundedX = Math.max(0, Math.min(floorMapMatrix[0].length - 1, gridX));
      const boundedY = Math.max(0, Math.min(floorMapMatrix.length - 1, gridY));
      
      // Return mapped point
      return {
        x: boundedX / floorMapMatrix[0].length,
        y: boundedY / floorMapMatrix.length,
        timestamp: point.timestamp,
        walkable: floorMapMatrix[boundedY][boundedX] === 1
      };
    });
  });
  
  return mappedData;
}

// Draw tracking data on floor map
function drawTrackingOnFloorMap(mappedTrackingData) {
  const canvas = document.getElementById('floor-map-canvas');
  const ctx = canvas.getContext('2d');
  
  // Clear previous drawings but keep the floor map matrix visualization
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFloorMapMatrix();
  
  // Draw each track
  mappedTrackingData.forEach(track => {
    if (!track.floorMapPath || track.floorMapPath.length < 2) return;
    
    // Draw path
    ctx.beginPath();
    ctx.moveTo(
      track.floorMapPath[0].x * canvas.width, 
      track.floorMapPath[0].y * canvas.height
    );
    
    for (let i = 1; i < track.floorMapPath.length; i++) {
      const point = track.floorMapPath[i];
      ctx.lineTo(
        point.x * canvas.width, 
        point.y * canvas.height
      );
    }
    
    ctx.strokeStyle = track.active ? '#34c759' : '#8e8e93';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw current position
    const lastPoint = track.floorMapPath[track.floorMapPath.length - 1];
    ctx.fillStyle = track.active ? '#34c759' : '#8e8e93';
    ctx.beginPath();
    ctx.arc(
      lastPoint.x * canvas.width, 
      lastPoint.y * canvas.height, 
      5, 0, Math.PI * 2
    );
    ctx.fill();
  });
}

// Draw heatmap on floor map
function drawHeatmapOnFloorMap(mappedTrackingData) {
  const canvas = document.getElementById('floor-map-canvas');
  const ctx = canvas.getContext('2d');
  
  // Generate heatmap data from mapped tracking data
  const heatmapData = [];
  
  mappedTrackingData.forEach(track => {
    if (!track.floorMapPath) return;
    
    track.floorMapPath.forEach(point => {
      // Only add points in walkable areas
      if (point.walkable) {
        heatmapData.push({
          x: point.x,
          y: point.y,
          value: 0.5 // Initial value, will be normalized
        });
      }
    });
  });
  
  // Normalize heatmap values by density
  // Create a grid to count overlapping points
  const gridSize = 0.05; // 5% of floor map dimensions
  const gridWidth = Math.ceil(1 / gridSize);
  const gridHeight = Math.ceil(1 / gridSize);
  const grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));
  
  // Count points in each grid cell
  heatmapData.forEach(point => {
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    
    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
      grid[gridY][gridX]++;
    }
  });
  
  // Find max count for normalization
  let maxCount = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      maxCount = Math.max(maxCount, grid[y][x]);
    }
  }
  
  // Create normalized heatmap data
  const normalizedHeatmap = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] > 0) {
        normalizedHeatmap.push({
          x: (x * gridSize) + (gridSize / 2),
          y: (y * gridSize) + (gridSize / 2),
          value: maxCount > 0 ? grid[y][x] / maxCount : 0
        });
      }
    }
  }
  
  // Draw heatmap
  drawHeatmap(ctx, normalizedHeatmap, canvas.width, canvas.height, 30);
}
