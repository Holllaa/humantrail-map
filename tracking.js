
/**
 * Human Tracking Functionality
 * Uses TensorFlow.js and COCO-SSD model for person detection
 */

// Global variables for tracking
let model = null;
let isModelLoading = false;
let isModelLoaded = false;
let personTrackingData = []; // Stores all tracked persons data
let trackingIntervalId = null;
let lastProcessedTime = 0;
const PROCESS_INTERVAL = 100; // Process frames every 100ms
const PERSON_DETECTION_THRESHOLD = 0.6; // Confidence threshold

// Load COCO-SSD model
async function loadTrackingModel() {
  if (isModelLoading || isModelLoaded) return;
  
  isModelLoading = true;
  showModelLoadingIndicator(true);
  
  try {
    model = await cocoSsd.load();
    isModelLoaded = true;
    console.log("Person detection model loaded");
    
    // Enable processing button
    document.getElementById('process-button').disabled = false;
  } catch (error) {
    console.error("Error loading model:", error);
    alert("Failed to load person detection model. Please try again.");
  } finally {
    isModelLoading = false;
    showModelLoadingIndicator(false);
  }
}

// Process video frames to detect and track persons
async function processVideoFrame(videoElement, canvasElement) {
  if (!model || !videoElement || !canvasElement) return;
  
  const ctx = canvasElement.getContext('2d');
  const now = performance.now();
  
  // Only process frames at specified interval
  if (now - lastProcessedTime < PROCESS_INTERVAL) return;
  lastProcessedTime = now;
  
  // Make predictions with model
  try {
    const predictions = await model.detect(videoElement);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Filter for person detections with good confidence
    const persons = predictions.filter(prediction => 
      prediction.class === 'person' && 
      prediction.score >= PERSON_DETECTION_THRESHOLD
    );
    
    // Track persons across frames
    trackPersons(persons, now, videoElement.videoWidth, videoElement.videoHeight);
    
    // Draw tracking results
    drawTrackingResults(ctx, canvasElement.width, canvasElement.height);
    
  } catch (error) {
    console.error("Error processing video frame:", error);
  }
}

// Track persons across frames
function trackPersons(detectedPersons, timestamp, videoWidth, videoHeight) {
  // If this is the first set of detections, initialize tracks
  if (personTrackingData.length === 0) {
    detectedPersons.forEach((person, index) => {
      const bbox = person.bbox;
      const centerX = bbox[0] + bbox[2]/2;
      const centerY = bbox[1] + bbox[3]/2;
      
      personTrackingData.push({
        id: `person_${index}`,
        path: [{
          x: centerX / videoWidth,  // Save as ratio for scalability
          y: centerY / videoHeight,
          timestamp: timestamp
        }],
        lastSeen: timestamp,
        bbox: bbox,
        active: true
      });
    });
    return;
  }
  
  // Match new detections with existing tracks
  const assignedTracks = new Set();
  
  // For each detected person, find the closest track
  detectedPersons.forEach(person => {
    const bbox = person.bbox;
    const centerX = bbox[0] + bbox[2]/2;
    const centerY = bbox[1] + bbox[3]/2;
    
    let closestTrackIndex = -1;
    let closestDistance = Infinity;
    
    // Find closest track
    personTrackingData.forEach((track, index) => {
      if (!track.active) return;
      
      const lastPoint = track.path[track.path.length - 1];
      const trackX = lastPoint.x * videoWidth;
      const trackY = lastPoint.y * videoHeight;
      
      const distance = Math.sqrt(
        Math.pow(centerX - trackX, 2) + 
        Math.pow(centerY - trackY, 2)
      );
      
      // If distance is within threshold, consider it the same person
      if (distance < 100 && distance < closestDistance) {
        closestDistance = distance;
        closestTrackIndex = index;
      }
    });
    
    // Update existing track or create new one
    if (closestTrackIndex >= 0 && !assignedTracks.has(closestTrackIndex)) {
      // Update existing track
      const track = personTrackingData[closestTrackIndex];
      track.path.push({
        x: centerX / videoWidth,
        y: centerY / videoHeight,
        timestamp: timestamp
      });
      track.lastSeen = timestamp;
      track.bbox = bbox;
      assignedTracks.add(closestTrackIndex);
    } else {
      // Create new track
      personTrackingData.push({
        id: `person_${personTrackingData.length}`,
        path: [{
          x: centerX / videoWidth,
          y: centerY / videoHeight,
          timestamp: timestamp
        }],
        lastSeen: timestamp,
        bbox: bbox,
        active: true
      });
    }
  });
  
  // Mark tracks as inactive if not detected for a while
  personTrackingData.forEach(track => {
    if (timestamp - track.lastSeen > 2000) {
      track.active = false;
    }
  });
}

// Draw tracking results on canvas
function drawTrackingResults(ctx, canvasWidth, canvasHeight) {
  personTrackingData.forEach(track => {
    // Draw person bounding box if active
    if (track.active && track.bbox) {
      const [x, y, width, height] = track.bbox;
      const scaledX = (x / track.path[0].x) * canvasWidth;
      const scaledY = (y / track.path[0].y) * canvasHeight;
      const scaledWidth = (width / track.path[0].x) * canvasWidth;
      const scaledHeight = (height / track.path[0].y) * canvasHeight;
      
      ctx.strokeStyle = '#34c759';
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      // Draw ID label
      ctx.fillStyle = '#34c759';
      ctx.fillRect(scaledX, scaledY - 20, 60, 20);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(track.id, scaledX + 5, scaledY - 5);
    }
    
    // Draw movement trail
    if (track.path.length > 1) {
      ctx.beginPath();
      
      // Move to first point
      const firstPoint = track.path[0];
      ctx.moveTo(firstPoint.x * canvasWidth, firstPoint.y * canvasHeight);
      
      // Create line to each subsequent point
      for (let i = 1; i < track.path.length; i++) {
        const point = track.path[i];
        ctx.lineTo(point.x * canvasWidth, point.y * canvasHeight);
      }
      
      // Style and stroke the path
      ctx.strokeStyle = track.active ? '#34c759' : '#8e8e93';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw current position
      const lastPoint = track.path[track.path.length - 1];
      ctx.fillStyle = track.active ? '#34c759' : '#8e8e93';
      ctx.beginPath();
      ctx.arc(
        lastPoint.x * canvasWidth, 
        lastPoint.y * canvasHeight, 
        5, 0, Math.PI * 2
      );
      ctx.fill();
    }
  });
}

// Start continuous tracking
function startTracking(videoElement, canvasElement) {
  if (trackingIntervalId) return;
  
  // Make sure canvas dimensions match video
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  // Process frames continuously while video is playing
  trackingIntervalId = requestAnimationFrame(function processFrame() {
    if (!videoElement.paused && !videoElement.ended) {
      processVideoFrame(videoElement, canvasElement);
    }
    trackingIntervalId = requestAnimationFrame(processFrame);
  });
}

// Stop tracking
function stopTracking() {
  if (trackingIntervalId) {
    cancelAnimationFrame(trackingIntervalId);
    trackingIntervalId = null;
  }
}

// Reset tracking data
function resetTracking() {
  personTrackingData = [];
  lastProcessedTime = 0;
}

// Helper to show model loading indicator
function showModelLoadingIndicator(isLoading) {
  // Check if loading indicator exists, create if not
  let loadingIndicator = document.querySelector('.loading-model');
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-model';
    loadingIndicator.textContent = 'Loading person detection model...';
    document.querySelector('.video-container').appendChild(loadingIndicator);
  }
  
  // Show or hide
  loadingIndicator.classList.toggle('active', isLoading);
}

// Calculate analytics data from tracking results
function calculateAnalytics() {
  const totalVisitors = personTrackingData.length;
  
  // Calculate average time spent (in ms)
  let totalTime = 0;
  personTrackingData.forEach(track => {
    if (track.path.length >= 2) {
      const startTime = track.path[0].timestamp;
      const endTime = track.path[track.path.length - 1].timestamp;
      totalTime += (endTime - startTime);
    }
  });
  const averageTimeMs = totalVisitors > 0 ? totalTime / totalVisitors : 0;
  const averageTimeSeconds = Math.round(averageTimeMs / 1000);
  
  // Identify most visited areas
  // This is a simplified approach - a real implementation would use clustering
  let popularAreas = "Not enough data";
  
  // Find areas with most dense paths
  if (personTrackingData.length > 0) {
    // Divide the store into a 3x3 grid
    const areaGrid = Array(3).fill(0).map(() => Array(3).fill(0));
    
    personTrackingData.forEach(track => {
      track.path.forEach(point => {
        // Convert point to grid position
        const gridX = Math.floor(point.x * 3);
        const gridY = Math.floor(point.y * 3);
        
        // Ensure within bounds
        if (gridX >= 0 && gridX < 3 && gridY >= 0 && gridY < 3) {
          areaGrid[gridY][gridX]++;
        }
      });
    });
    
    // Find the area with highest count
    let maxCount = 0;
    let maxArea = [0, 0];
    
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (areaGrid[y][x] > maxCount) {
          maxCount = areaGrid[y][x];
          maxArea = [x, y];
        }
      }
    }
    
    // Map grid position to store area
    const areas = [
      ["Top Left", "Top Center", "Top Right"],
      ["Middle Left", "Center", "Middle Right"],
      ["Bottom Left", "Bottom Center", "Bottom Right"]
    ];
    
    popularAreas = areas[maxArea[1]][maxArea[0]];
  }
  
  // Calculate peak hours (time with most activity)
  let peakHours = "No data";
  
  if (personTrackingData.length > 0) {
    // Get first and last timestamps
    let minTime = Infinity;
    let maxTime = 0;
    
    personTrackingData.forEach(track => {
      track.path.forEach(point => {
        minTime = Math.min(minTime, point.timestamp);
        maxTime = Math.max(maxTime, point.timestamp);
      });
    });
    
    if (maxTime > minTime) {
      // Calculate activity in 3 time slots
      const timeRange = maxTime - minTime;
      const timeSlots = [
        { label: "Beginning", count: 0 },
        { label: "Middle", count: 0 },
        { label: "End", count: 0 }
      ];
      
      personTrackingData.forEach(track => {
        track.path.forEach(point => {
          // Normalize time to 0-1 range
          const normalizedTime = (point.timestamp - minTime) / timeRange;
          // Determine which time slot
          const slotIndex = Math.min(2, Math.floor(normalizedTime * 3));
          timeSlots[slotIndex].count++;
        });
      });
      
      // Find slot with highest count
      let maxSlot = timeSlots[0];
      timeSlots.forEach(slot => {
        if (slot.count > maxSlot.count) {
          maxSlot = slot;
        }
      });
      
      peakHours = maxSlot.label;
    }
  }
  
  return {
    totalVisitors,
    averageTimeSeconds,
    popularAreas,
    peakHours
  };
}
