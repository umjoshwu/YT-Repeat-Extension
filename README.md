# YouTube Video Section Repeater

A Chrome extension that allows you to mark and repeat sections of YouTube videos with keyboard shortcuts.

## Features

- Mark start and end timestamps for video sections
- Automatically repeat playback between marked timestamps 
- Save timestamps per video URL
- Keyboard shortcuts for all functions
- Visual notifications for actions
- Bookmark management system

## Installation

1. Clone this repository or download the source code
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Keyboard Shortcuts

- `Ctrl/Cmd + E` - Mark start timestamp
- `E` - Return to start timestamp
- `Ctrl/Cmd + R` - Mark end timestamp  
- `R` - Toggle section repeat mode
- `H` - Show help message

### Bookmarks

- Click the extension icon to view/manage bookmarks
- Add descriptions to saved timestamps
- Play or delete bookmarks from the popup menu

## Technical Details

The extension consists of:

- `contentScript.js` - Handles video control and timestamp management
- `popup.js` - Manages the bookmark interface
- `background.js` - Handles tab events and messaging
- `utils.js` - Contains shared utility functions

Timestamps and repeat settings are saved per video URL using Chrome's storage API.

## Development

To modify the extension:

1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test changes on YouTube video pages

## License

MIT License - feel free to modify and reuse this code.
