// content.js - Main functionality with repeat feature

// Initialize variables to store the marked timestamp and video element
let markedTimestamp = null;
let videoElement = null;
let repeatEnabled = false;
// Function to find the video element on YouTube
function findVideoElement() {
  const video = document.querySelector('video.html5-main-video');
  if (video) {
    videoElement = video;
    return true;
  }
  return false;
}

// Function to mark the current timestamp
function markTimestamp() {
  if (videoElement) {
    markedTimestamp = videoElement.currentTime;
    
    // Show a visual confirmation
    showNotification(`Timestamp marked at ${formatTime(markedTimestamp)}`);
    
    // Save timestamp to storage in case of page refresh
    chrome.storage.local.set({
      [window.location.href]: markedTimestamp
    });
    
    return true;
  }
  return false;
}

// Function to return to the marked timestamp
function returnToTimestamp() {
  if (videoElement && markedTimestamp !== null) {
    videoElement.currentTime = markedTimestamp;
    showNotification(`Returned to ${formatTime(markedTimestamp)}`);
    return true;
  } else if (videoElement) {
    showNotification("No timestamp marked yet. Press Ctrl+E to mark a timestamp.");
    return false;
  }
  return false;
}

// Toggle repeat mode
// Add a flag to track if we're processing a toggle
let isToggling = false;

function toggleRepeat() {
  if (isToggling) return false; // Prevent re-entry
  isToggling = true;

  if (!videoElement) {
    showNotification("No video element found");
    isToggling = false;
    return false;
  }

  if (markedTimestamp === null) {
    showNotification("No timestamp marked yet. Press Ctrl+E to mark a timestamp first.");
    isToggling = false;
    return false;
  }

  repeatEnabled = !repeatEnabled;
  console.log("Repeat enabled set to:", repeatEnabled);

  if (repeatEnabled) {
    videoElement.addEventListener('ended', handleVideoEnded);
    showNotification(`Repeat mode ON - Will repeat from ${formatTime(markedTimestamp)}`);
  } else {
    videoElement.removeEventListener('ended', handleVideoEnded);
    showNotification("Repeat mode OFF");
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

// Handle video ended event for repeat functionality
function handleVideoEnded() {
  if (repeatEnabled && markedTimestamp !== null) {
    // Small delay to ensure the video has fully ended
    setTimeout(() => {
      videoElement.currentTime = markedTimestamp;
      videoElement.play();
      showNotification(`Repeating from ${formatTime(markedTimestamp)}`);
    }, 100);
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

// Create and show a notification on the YouTube player
function showNotification(message) {
  // Remove any existing notification
  const existingNotification = document.getElementById('timestamp-marker-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'timestamp-marker-notification';
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'absolute',
    top: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    zIndex: '9999',
    transition: 'opacity 0.3s ease-in-out',
    opacity: '1'
  });
  
  // Add to DOM
  const playerContainer = document.querySelector('.html5-video-container');
  if (playerContainer) {
    playerContainer.appendChild(notification);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// Set up keyboard event listener
function setupKeyboardListeners() {
  document.addEventListener('keydown', (event) => {
    // Check if we're in an input field - if so, don't intercept keys
    if (document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA' || 
         document.activeElement.isContentEditable)) {
      return;
    }
    
    // Ctrl+E or Command+E (for Mac) to mark timestamp
    if (event.metaKey && event.key === 'e') {
      showNotification("Ctrl-E pressed");
      if (markTimestamp()) {
        event.preventDefault(); // Prevent default browser behavior
      }
    }
    
    // E to return to timestamp
    if (!event.metaKey && event.key === 'e' && !event.shiftKey && !event.altKey) {
      if (returnToTimestamp()) {
        event.preventDefault(); // Prevent default browser behavior
      }
    }
    
    // R to toggle repeat mode
    if (!event.metaKey && event.key === 'r' && !event.shiftKey && !event.altKey) {
      if (toggleRepeat()) {
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
            // Check if there's a saved timestamp for this URL
            chrome.storage.local.get([window.location.href, `${window.location.href}_repeat`], (result) => {
              if (result[window.location.href]) {
                markedTimestamp = result[window.location.href];
                showNotification(`Previous timestamp loaded: ${formatTime(markedTimestamp)}`);
                
                // Restore repeat status if it exists
                if (result[`${window.location.href}_repeat`]) {
                  repeatEnabled = result[`${window.location.href}_repeat`];
                  if (repeatEnabled) {
                    videoElement.addEventListener('ended', handleVideoEnded);
                    showNotification(`Repeat mode is ON - Will repeat from ${formatTime(markedTimestamp)}`);
                  }
                }
              }
            });
          }
        }
      }, 500);
    } else {
      // Check if there's a saved timestamp for this URL
      chrome.storage.local.get([window.location.href, `${window.location.href}_repeat`], (result) => {
        if (result[window.location.href]) {
          markedTimestamp = result[window.location.href];
          showNotification(`Previous timestamp loaded: ${formatTime(markedTimestamp)}`);
          
          // Restore repeat status if it exists
          if (result[`${window.location.href}_repeat`]) {
            repeatEnabled = result[`${window.location.href}_repeat`];
            if (repeatEnabled) {
              videoElement.addEventListener('ended', handleVideoEnded);
              showNotification(`Repeat mode is ON - Will repeat from ${formatTime(markedTimestamp)}`);
            }
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
  if (videoElement && repeatEnabled) {
    videoElement.removeEventListener('ended', handleVideoEnded);
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