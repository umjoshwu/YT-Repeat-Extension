// content.js - Main functionality with section repeat feature and help message

// Initialize variables to store the timestamps and video element
let startTimestamp = null;
let endTimestamp = null;
let videoElement = null;
let repeatEnabled = false;
let sectionRepeatInterval = null;

// Function to find the video element on YouTube
function findVideoElement() {
  const video = document.querySelector('video.html5-main-video');
  if (video) {
    videoElement = video;
    return true;
  }
  return false;
}

// Function to mark the start timestamp (previously markedTimestamp)
function markStartTimestamp() {
  if (videoElement) {
    startTimestamp = videoElement.currentTime;
    
    // Show a visual confirmation
    showNotification(`Start timestamp marked at ${formatTime(startTimestamp)}`);
    
    // Save timestamp to storage in case of page refresh
    chrome.storage.local.set({
      [`${window.location.href}_start`]: startTimestamp
    });
    
    return true;
  }
  return false;
}

// Function to mark the end timestamp
function markEndTimestamp() {
  if (videoElement) {
    endTimestamp = videoElement.currentTime;
    
    // Show a visual confirmation
    showNotification(`End timestamp marked at ${formatTime(endTimestamp)}`);
    
    // Save timestamp to storage in case of page refresh
    chrome.storage.local.set({
      [`${window.location.href}_end`]: endTimestamp
    });
    
    return true;
  }
  return false;
}

// Function to return to the start timestamp
function returnToStartTimestamp() {
  if (videoElement && startTimestamp !== null) {
    videoElement.currentTime = startTimestamp;
    showNotification(`Returned to ${formatTime(startTimestamp)}`);
    return true;
  } else if (videoElement) {
    showNotification("No start timestamp marked yet. Press Ctrl+E to mark a start timestamp.");
    return false;
  }
  return false;
}

// Toggle section repeat mode
let isToggling = false;

function toggleSectionRepeat() {
  if (isToggling) return false; // Prevent re-entry
  isToggling = true;

  if (!videoElement) {
    showNotification("No video element found");
    isToggling = false;
    return false;
  }

  if (startTimestamp === null) {
    showNotification("No start timestamp marked yet. Press Ctrl+E to mark a start timestamp first.");
    isToggling = false;
    return false;
  }

  if (endTimestamp === null) {
    showNotification("No end timestamp marked yet. Press Ctrl+R to mark an end timestamp first.");
    isToggling = false;
    return false;
  }

  // Make sure timestamps are in the correct order
  if (startTimestamp >= endTimestamp) {
    showNotification("Start timestamp must be before end timestamp");
    isToggling = false;
    return false;
  }

  repeatEnabled = !repeatEnabled;
  console.log("Section repeat enabled set to:", repeatEnabled);

  if (repeatEnabled) {
    // Set up the repeating section
    startSectionRepeat();
    showNotification(`Section repeat ON - ${formatTime(startTimestamp)} to ${formatTime(endTimestamp)}`);
  } else {
    // Stop repeating
    stopSectionRepeat();
    showNotification("Section repeat OFF");
  }

  chrome.storage.local.set({
    [`${window.location.href}_repeat`]: repeatEnabled
  }, () => {
    console.log("Repeat status saved:", repeatEnabled);
  });

  // Reset toggle flag after a short delay
  setTimeout(() => { isToggling = false; }, 200);
  return true;
}

// Start section repeat
function startSectionRepeat() {
  // Clear any existing interval first
  stopSectionRepeat();
  
  // Set up timeupdate listener to check when we reach the end timestamp
  videoElement.addEventListener('timeupdate', checkEndTimestamp);
}

// Stop section repeat
function stopSectionRepeat() {
  if (videoElement) {
    videoElement.removeEventListener('timeupdate', checkEndTimestamp);
  }
}

// Check if we've reached the end timestamp
function checkEndTimestamp() {
  if (repeatEnabled && videoElement && startTimestamp !== null && endTimestamp !== null) {
    if (videoElement.currentTime >= endTimestamp) {
      // Jump back to start timestamp
      videoElement.currentTime = startTimestamp;
      showNotification(`Repeating section from ${formatTime(startTimestamp)}`);
    }
  }
}

// Format seconds to MM:SS or HH:MM:SS
function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Show help message with all keyboard shortcuts
function showHelpMessage() {
  showNotification(
    `YouTube Timestamp Marker Shortcuts:\n` +
    `• Ctrl+E: Mark start timestamp\n` +
    `• E: Jump to start timestamp\n` +
    `• Ctrl+R: Mark end timestamp\n` +
    `• R: Toggle section repeat\n` +
    `• H: Show this help`,
    6000 // Show help for longer
  );
  return true;
}

// Create and show a notification on the YouTube player
// Modified to support multiline text
function showNotification(message, duration = 2000) {
  // Remove any existing notification
  const existingNotification = document.getElementById('timestamp-marker-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'timestamp-marker-notification';
  
  // Handle multiline text by replacing \n with <br>
  if (message.includes('\n')) {
    // Split by newlines and create paragraph elements
    const lines = message.split('\n');
    lines.forEach((line, index) => {
      const p = document.createElement('p');
      p.textContent = line;
      
      // Add margin only between paragraphs
      if (index > 0) {
        p.style.marginTop = '4px';
      }
      
      notification.appendChild(p);
    });
  } else {
    // Single line message
    notification.textContent = message;
  }
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'absolute',
    top: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '4px',
    fontSize: '14px',
    zIndex: '9999',
    transition: 'opacity 0.3s ease-in-out',
    opacity: '1',
    maxWidth: '80%',
    textAlign: 'left',
    lineHeight: '1.4'
  });
  
  // Add to DOM
  const playerContainer = document.querySelector('.html5-video-container');
  if (playerContainer) {
    playerContainer.appendChild(notification);
    
    // Auto-hide after specified duration
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
}

// Set up keyboard event listeners
function setupKeyboardListeners() {
  document.addEventListener('keydown', (event) => {
    // Check if we're in an input field - if so, don't intercept keys
    // if (document.activeElement && 
    //     (document.activeElement.tagName === 'INPUT' || 
    //      document.activeElement.tagName === 'TEXTAREA' || 
    //      document.activeElement.isContentEditable)) {
    //   return;
    // }
    // H to show help message
    if (event.key === 'h') {
      showNotification('hi'); // doesnt show up??
      event.preventDefault();
    }
    // Ctrl+E or Command+E (for Mac) to mark start timestamp
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      if (markStartTimestamp()) {
        event.preventDefault(); // Prevent default browser behavior
      }
    }
    
    // E to return to start timestamp
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.key === 'e') {
      if (returnToStartTimestamp()) {
        event.preventDefault(); // Prevent default browser behavior
      }
    }
    
    // Ctrl+R or Command+R (for Mac) to mark end timestamp
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      if (markEndTimestamp()) {
        event.preventDefault(); // Prevent default browser behavior
      }
    }
    
    // R to toggle section repeat mode
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.key === 'r') {
      if (toggleSectionRepeat()) {
        event.preventDefault(); // Prevent default browser behavior
      }
    }
    

  });
}

// Function to initialize the extension
function initExtension() {
  // Check if we're on a YouTube watch page
  if (window.location.href.includes('youtube.com/watch')) {
    
    // Try to find video element
    if (!findVideoElement()) {
      // If not found, retry a few times
      let attempts = 0;
      const videoFinder = setInterval(() => {
        attempts++;
        if (findVideoElement() || attempts > 10) {
          clearInterval(videoFinder);
          
          if (videoElement) {
            // Check if there are saved timestamps for this URL
            chrome.storage.local.get([
              `${window.location.href}_start`, 
              `${window.location.href}_end`, 
              `${window.location.href}_repeat`
            ], (result) => {
              if (result[`${window.location.href}_start`]) {
                startTimestamp = result[`${window.location.href}_start`];
                showNotification(`Previous start timestamp loaded: ${formatTime(startTimestamp)}`);
              }
              
              if (result[`${window.location.href}_end`]) {
                endTimestamp = result[`${window.location.href}_end`];
                showNotification(`Previous end timestamp loaded: ${formatTime(endTimestamp)}`);
              }
              
              // Restore repeat status if it exists
              if (result[`${window.location.href}_repeat`] && startTimestamp !== null && endTimestamp !== null) {
                repeatEnabled = result[`${window.location.href}_repeat`];
                if (repeatEnabled) {
                  startSectionRepeat();
                  showNotification(`Section repeat is ON - ${formatTime(startTimestamp)} to ${formatTime(endTimestamp)}`);
                }
              }
            });
          }
        }
      }, 500);
    } else {
      // Check if there are saved timestamps for this URL
      chrome.storage.local.get([
        `${window.location.href}_start`, 
        `${window.location.href}_end`, 
        `${window.location.href}_repeat`
      ], (result) => {
        if (result[`${window.location.href}_start`]) {
          startTimestamp = result[`${window.location.href}_start`];
          showNotification(`Previous start timestamp loaded: ${formatTime(startTimestamp)}`);
        }
        
        if (result[`${window.location.href}_end`]) {
          endTimestamp = result[`${window.location.href}_end`];
          showNotification(`Previous end timestamp loaded: ${formatTime(endTimestamp)}`);
        }
        
        // Restore repeat status if it exists
        if (result[`${window.location.href}_repeat`] && startTimestamp !== null && endTimestamp !== null) {
          repeatEnabled = result[`${window.location.href}_repeat`];
          if (repeatEnabled) {
            startSectionRepeat();
            showNotification(`Section repeat is ON - ${formatTime(startTimestamp)} to ${formatTime(endTimestamp)}`);
          }
        }
      });
    }
    
    // Set up keyboard listeners
    setupKeyboardListeners();
  }
}

// Function to clean up when navigating away or reloading
function cleanUp() {
  if (repeatEnabled) {
    stopSectionRepeat();
  }
}

// Initialize when the page loads
window.addEventListener('load', initExtension);
window.addEventListener('beforeunload', cleanUp);

// Also handle YouTube's SPA (Single Page Application) navigation
let lastUrl = window.location.href;
new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    // Clean up before changing page
    cleanUp();
    
    lastUrl = window.location.href;
    setTimeout(initExtension, 1000); // Delay to allow YouTube to load the video
  }
}).observe(document.body, { subtree: true, childList: true });

// Initialize immediately in case the page is already loaded
initExtension();