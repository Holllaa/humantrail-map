/**
 * Tracking utilities for monitoring customer movement
 */

// Generate random demonstration data for development purposes
function generateDemoData(width, height, numPeople = 10, pointsPerPerson = 100) {
  const tracks = [];
  
  for (let i = 0; i < numPeople; i++) {
    const id = `person-${i}`;
    const path = [];
    
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
}

// Smooth a path by removing noise and jitter
function smoothPath(path, windowSize = 5) {
  if (path.length <= windowSize) {
    return path;
  }

  const smoothedPath = [];
  
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
}

// Calculate analytics from tracks
function calculateAnalytics(tracks) {
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
  
  // Find popular areas
  let popularAreas = "Not enough data";
  if (tracks.length > 0) {
    // This is simplified - in a real app we'd use clustering
    if (averageDistance < 500) popularAreas = "Store Entrance";
    else if (averageDistance < 1000) popularAreas = "Center Aisles";
    else popularAreas = "All Store Areas";
  }
  
  return {
    totalVisitors,
    averageTimeSeconds,
    averageDistance: Math.round(averageDistance),
    totalDistance: Math.round(totalDistance),
    popularAreas
  };
}

// Draw tracks on a canvas
function drawTracks(ctx, tracks, selectedTrack = null) {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw each track
  tracks.forEach(track => {
    const isSelected = selectedTrack && selectedTrack.id === track.id;
    
    // Set line style
    ctx.strokeStyle = isSelected ? '#ff3b30' : track.active ? '#34c759' : '#8e8e93';
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Draw path
    if (track.path.length > 1) {
      ctx.beginPath();
      ctx.moveTo(track.path[0].x, track.path[0].y);
      
      for (let i = 1; i < track.path.length; i++) {
        ctx.lineTo(track.path[i].x, track.path[i].y);
      }
      
      ctx.stroke();
    }
    
    // Draw current position (last point)
    if (track.path.length > 0) {
      const lastPoint = track.path[track.path.length - 1];
      
      ctx.fillStyle = isSelected ? '#ff3b30' : track.active ? '#34c759' : '#8e8e93';
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
