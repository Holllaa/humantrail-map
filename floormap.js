/**
 * Floor Map Utilities for mapping customer movement to store layout
 */

// Store layout mapping matrix
let floorMapMatrix = null;
let floorMapImage = null;
let floorHeatmapEnabled = false;
let mappedTrackingData = [];

// Initialize floor map
function initFloorMap() {
  const floorMapImg = document.getElementById('floor-map-img');
  const floorMapCanvas = document.getElementById('floor-map-canvas');
  const floorMapUploadBtn = document.getElementById('upload-floor-map');
  const floorMapInput = document.getElementById('floor-map-input');
  const toggleHeatmapBtn = document.getElementById('toggle-heatmap');
  const autoDetectBtn = document.getElementById('auto-detect-areas');
  const floorPlanUpload = document.getElementById('floor-plan-upload');
  const floorPlanInput = document.getElementById('floor-plan-input');
  
  // Set up event listeners
  floorMapUploadBtn.addEventListener('click', () => {
    floorMapInput.click();
  });
  
  floorMapInput.addEventListener('change', handleFloorMapUpload);
  
  // Floor plan upload in the sidebar
  floorPlanUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    floorPlanUpload.classList.add('drag-over');
  });
  
  floorPlanUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    floorPlanUpload.classList.remove('drag-over');
  });
  
  floorPlanUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    floorPlanUpload.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.includes('image/')) {
      handleFloorMapUpload({ target: { files: [file] } });
    }
  });
  
  floorPlanInput.addEventListener('change', handleFloorMapUpload);
  
  // Toggle heatmap view
  toggleHeatmapBtn.addEventListener('click', () => {
    floorHeatmapEnabled = !floorHeatmapEnabled;
    toggleHeatmapBtn.textContent = floorHeatmapEnabled ? 'Show Paths' : 'Show Heatmap';
    
    if (mappedTrackingData.length > 0) {
      if (floorHeatmapEnabled) {
        drawHeatmapOnFloorMap(mappedTrackingData);
      } else {
        drawTrackingOnFloorMap(mappedTrackingData);
      }
    }
  });
  
  // Auto-detect areas in floor map
  autoDetectBtn.addEventListener('click', () => {
    if (!floorMapImage) {
      alert('Please upload a floor map image first');
      return;
    }
    
    // Show loading indicator
    document.getElementById('loading-model').classList.add('active');
    document.querySelector('.loading-progress').style.width = '30%';
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        // Generate floor map matrix from image
        floorMapMatrix = generateFloorMapMatrixFromImage(floorMapImage);
        
        // Update progress
        document.querySelector('.loading-progress').style.width = '70%';
        
        // Draw the generated matrix
        drawFloorMapMatrix();
        
        // Map tracking data to floor map if available
        if (personTrackingData.length > 0) {
          mappedTrackingData = convertTrackingDataToFloorMap(personTrackingData, floorMapMatrix);
          
          if (floorHeatmapEnabled) {
            drawHeatmapOnFloorMap(mappedTrackingData);
          } else {
            drawTrackingOnFloorMap(mappedTrackingData);
          }
        }
        
        // Update analytics with floor map insights
        updateFloorMapInsights();
        
        // Show success message
        document.querySelector('.loading-progress').style.width = '100%';
        setTimeout(() => {
          document.getElementById('loading-model').classList.remove('active');
        }, 500);
      } catch (error) {
        console.error('Error auto-detecting areas:', error);
        document.getElementById('loading-model').classList.remove('active');
        alert('Error detecting areas in floor map');
      }
    }, 100);
  });
  
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
  const floorPlanUpload = document.getElementById('floor-plan-upload');
  
  // Create object URL for the uploaded image
  const imageUrl = URL.createObjectURL(file);
  floorMapImg.src = imageUrl;
  
  // Update upload zone to show success
  floorPlanUpload.classList.add('uploaded');
  
  // When image loads, update the canvas dimensions
  floorMapImg.onload = function() {
    floorMapCanvas.width = floorMapImg.naturalWidth;
    floorMapCanvas.height = floorMapImg.naturalHeight;
    
    // Store reference to floor map
    floorMapImage = floorMapImg;
    
    // Generate floor map matrix when image is loaded
    floorMapMatrix = generateFloorMapMatrixFromImage(floorMapImage);
    
    // Draw the floor map matrix
    drawFloorMapMatrix();
    
    // If we have tracking data, map it to the floor map
    if (personTrackingData && personTrackingData.length > 0) {
      mappedTrackingData = convertTrackingDataToFloorMap(personTrackingData, floorMapMatrix);
      
      if (floorHeatmapEnabled) {
        drawHeatmapOnFloorMap(mappedTrackingData);
      } else {
        drawTrackingOnFloorMap(mappedTrackingData);
      }
    }
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
  
  // Add legend
  addFloorMapLegend(canvas);
}

// Add a legend to the floor map
function addFloorMapLegend(canvas) {
  const ctx = canvas.getContext('2d');
  
  // Create legend container
  const legend = document.createElement('div');
  legend.className = 'floor-map-legend';
  
  // Remove any existing legend
  const existingLegend = canvas.parentElement.querySelector('.floor-map-legend');
  if (existingLegend) {
    existingLegend.remove();
  }
  
  // Add legend items
  const items = [
    { color: 'rgba(255, 255, 255, 0)', label: 'Walkable Area' },
    { color: 'rgba(255, 0, 0, 0.2)', label: 'Obstacles/Shelves' }
  ];
  
  if (floorHeatmapEnabled) {
    items.push(
      { color: 'rgba(173, 216, 230, 0.4)', label: 'Low Traffic' },
      { color: 'rgba(255, 214, 10, 0.5)', label: 'Medium Traffic' },
      { color: 'rgba(255, 69, 58, 0.7)', label: 'High Traffic' }
    );
  } else {
    items.push(
      { color: '#1a73e8', label: 'Customer Paths' }
    );
  }
  
  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'floor-map-legend-item';
    
    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = item.color;
    
    const label = document.createElement('span');
    label.textContent = item.label;
    
    itemElement.appendChild(colorBox);
    itemElement.appendChild(label);
    legend.appendChild(itemElement);
  });
  
  // Add legend to canvas container
  canvas.parentElement.appendChild(legend);
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
  if (!mappedTrackingData || !mappedTrackingData.length) return;
  
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
    
    ctx.strokeStyle = track.active ? '#1a73e8' : '#8e8e93';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw current position
    const lastPoint = track.floorMapPath[track.floorMapPath.length - 1];
    ctx.fillStyle = track.active ? '#1a73e8' : '#8e8e93';
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
  if (!mappedTrackingData || !mappedTrackingData.length) return;
  
  const canvas = document.getElementById('floor-map-canvas');
  const ctx = canvas.getContext('2d');
  
  // Clear canvas and redraw floor map matrix
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFloorMapMatrix();
  
  // Generate heatmap data from floor map paths
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
  
  // Draw heatmap using improved rendering
  renderFloorMapHeatmap(ctx, normalizedHeatmap, canvas.width, canvas.height, 25);
  
  // Restore normal blend mode
  ctx.globalCompositeOperation = 'source-over';
}

// Update floor map insights in the analytics panel
function updateFloorMapInsights() {
  if (!mappedTrackingData || !mappedTrackingData.length) return;
  
  const insightsContainer = document.getElementById('floor-insights');
  if (!insightsContainer) return;
  
  // Clear previous insights
  insightsContainer.innerHTML = '';
  
  // Calculate high traffic areas
  const highTrafficAreas = identifyHighTrafficAreas(mappedTrackingData);
  
  // Calculate bottlenecks
  const bottlenecks = identifyBottlenecks(mappedTrackingData);
  
  // Display insights
  const insightsHTML = `
    <div class="floor-insights">
      <div class="insight-section">
        <h4>High Traffic Areas</h4>
        <p>${highTrafficAreas.length > 0 ? 
           `Identified ${highTrafficAreas.length} high traffic area(s) in your store.` : 
           'No significant high traffic areas detected.'}</p>
      </div>
      <div class="insight-section">
        <h4>Potential Bottlenecks</h4>
        <p>${bottlenecks.length > 0 ? 
           `Found ${bottlenecks.length} potential bottleneck(s) that may affect customer flow.` : 
           'No significant bottlenecks detected.'}</p>
      </div>
      <div class="insight-section">
        <h4>Recommendations</h4>
        <ul>
          ${generateRecommendations(highTrafficAreas, bottlenecks).map(rec => 
            `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
  
  insightsContainer.innerHTML = insightsHTML;
}

// Identify high traffic areas in the floor map
function identifyHighTrafficAreas(mappedTrackingData) {
  if (!floorMapMatrix || !mappedTrackingData.length) return [];
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  const trafficGrid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));
  
  // Count visits in each grid cell
  mappedTrackingData.forEach(track => {
    if (!track.floorMapPath) return;
    
    track.floorMapPath.forEach(point => {
      const gridX = Math.floor(point.x * gridWidth);
      const gridY = Math.floor(point.y * gridHeight);
      
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        trafficGrid[gridY][gridX]++;
      }
    });
  });
  
  // Find average and max traffic
  let totalTraffic = 0;
  let maxTraffic = 0;
  let cellsWithTraffic = 0;
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (trafficGrid[y][x] > 0) {
        totalTraffic += trafficGrid[y][x];
        maxTraffic = Math.max(maxTraffic, trafficGrid[y][x]);
        cellsWithTraffic++;
      }
    }
  }
  
  const avgTraffic = cellsWithTraffic > 0 ? totalTraffic / cellsWithTraffic : 0;
  const highTrafficThreshold = avgTraffic * 1.5; // 50% above average
  
  // Identify high traffic areas (adjacent cells with high traffic)
  const highTrafficAreas = [];
  const visited = Array(gridHeight).fill(false).map(() => Array(gridWidth).fill(false));
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (trafficGrid[y][x] > highTrafficThreshold && !visited[y][x]) {
        // Found a high traffic cell, expand to adjacent cells
        const area = {
          center: { x, y },
          traffic: trafficGrid[y][x],
          cells: []
        };
        
        // Use flood fill to find adjacent high traffic cells
        const queue = [{ x, y }];
        visited[y][x] = true;
        
        while (queue.length > 0) {
          const cell = queue.shift();
          area.cells.push(cell);
          
          // Check adjacent cells
          const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
          ];
          
          for (const dir of directions) {
            const nx = cell.x + dir.dx;
            const ny = cell.y + dir.dy;
            
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && 
                trafficGrid[ny][nx] > highTrafficThreshold && !visited[ny][nx]) {
              queue.push({ x: nx, y: ny });
              visited[ny][nx] = true;
            }
          }
        }
        
        // Only consider areas with multiple cells as significant
        if (area.cells.length >= 2) {
          highTrafficAreas.push(area);
        }
      }
    }
  }
  
  return highTrafficAreas;
}

// Identify potential bottlenecks in customer flow
function identifyBottlenecks(mappedTrackingData) {
  if (!floorMapMatrix || !mappedTrackingData.length) return [];
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  
  // Identify narrow passages by looking for walkable cells with obstacles on multiple sides
  const bottlenecks = [];
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (floorMapMatrix[y][x] === 1) { // Walkable cell
        // Count adjacent obstacles
        let obstacleCount = 0;
        let adjacentWalkable = 0;
        
        // Check all 8 adjacent cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; // Skip self
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
              if (floorMapMatrix[ny][nx] === 0) {
                obstacleCount++;
              } else {
                adjacentWalkable++;
              }
            } else {
              obstacleCount++; // Count out of bounds as obstacles
            }
          }
        }
        
        // A bottleneck is a walkable cell with many obstacles and few walkable neighbors
        if (obstacleCount >= 5 && adjacentWalkable <= 3) {
          // Check if this is a high traffic area
          let traffic = 0;
          mappedTrackingData.forEach(track => {
            if (!track.floorMapPath) return;
            
            track.floorMapPath.forEach(point => {
              const gridX = Math.floor(point.x * gridWidth);
              const gridY = Math.floor(point.y * gridHeight);
              
              if (gridX === x && gridY === y) {
                traffic++;
              }
            });
          });
          
          if (traffic > 0) {
            bottlenecks.push({
              position: { x, y },
              traffic: traffic,
              obstacleCount: obstacleCount
            });
          }
        }
      }
    }
  }
  
  return bottlenecks;
}

// Generate retail recommendations based on analysis
function generateRecommendations(highTrafficAreas, bottlenecks) {
  const recommendations = [];
  
  if (highTrafficAreas.length > 0) {
    recommendations.push('Consider placing high-margin products in high traffic areas for maximum visibility.');
    recommendations.push('Ensure sufficient space in high traffic areas to prevent congestion.');
  }
  
  if (bottlenecks.length > 0) {
    recommendations.push('Widen narrow passages where customer flow is restricted.');
    recommendations.push('Consider rearranging store fixtures to eliminate bottlenecks.');
  }
  
  if (highTrafficAreas.length === 0 && bottlenecks.length === 0) {
    recommendations.push('Your store layout appears to have good flow. Continue monitoring for changes.');
  }
  
  // Add general recommendations
  recommendations.push('Update floor plan analysis regularly as store layout changes.');
  
  return recommendations;
}

// Create a placeholder floor map for testing
function createPlaceholderFloorMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  // Draw store layout
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 800, 600);
  
  // Outer walls
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 50, 700, 500);
  
  // Entrance
  ctx.fillStyle = '#1a73e8';
  ctx.fillRect(390, 550, 20, 4);
  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.fillText('Entrance', 370, 580);
  
  // Shelves and display areas
  ctx.fillStyle = '#ccc';
  
  // Left shelves
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(100, 100 + i * 120, 150, 50);
  }
  
  // Right shelves
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(550, 100 + i * 120, 150, 50);
  }
  
  // Center display
  ctx.fillRect(325, 200, 150, 150);
  
  // Checkout area
  ctx.fillStyle = '#b3e5fc';
  ctx.fillRect(100, 480, 200, 40);
  ctx.fillStyle = '#666';
  ctx.fillText('Checkout', 170, 505);
  
  return canvas.toDataURL('image/jpeg');
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

// Render heatmap with transparency on a floor plan image
function renderFloorMapHeatmap(ctx, heatmapData, width, height, radius = 20) {
  // Use drawHeatmap with floor map specific settings
  drawHeatmap(ctx, heatmapData, width, height, radius);
  
  // Optionally, we can add overlay blend mode for better visibility
  ctx.globalCompositeOperation = 'multiply';
}

// Convert tracking data to a format that can be used with the floor map
function convertTrackingDataToFloorMap(trackingData, floorMapMatrix) {
  if (!trackingData || !trackingData.length || !floorMapMatrix) {
    return [];
  }
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  
  // Create a deep copy of tracking data and map to floor map coordinates
  const mappedData = JSON.parse(JSON.stringify(trackingData));
  
  mappedData.forEach(track => {
    track.floorMapPath = track.path.map(point => {
      // Convert normalized video coordinates to floor map grid
      const gridX = Math.floor(point.x * gridWidth);
      const gridY = Math.floor(point.y * gridHeight);
      
      // Ensure coordinates are within bounds
      const boundedX = Math.max(0, Math.min(gridWidth - 1, gridX));
      const boundedY = Math.max(0, Math.min(gridHeight - 1, gridY));
      
      // Check if this position is walkable
      const isWalkable = floorMapMatrix[boundedY] && 
                         floorMapMatrix[boundedY][boundedX] === 1;
      
      // Return mapped point with additional walkable flag
      return {
        x: boundedX / gridWidth,
        y: boundedY / gridHeight,
        timestamp: point.timestamp,
        walkable: isWalkable
      };
    });
  });
  
  return mappedData;
}

// Automatically generate a floor map matrix from an image
// This uses simple brightness-based analysis - in a real app, you'd use ML
function generateFloorMapMatrixFromImage(image, resolution = 20) {
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Get image data
  const imageData = ctx.getImageData
