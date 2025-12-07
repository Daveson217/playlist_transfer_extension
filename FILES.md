# Project Structure & File Overview

## Chrome Extension Files (Required)

### `manifest.json`
- Extension configuration and metadata
- Defines permissions, APIs, and file references
- Specifies Spotify and YouTube Music host permissions

### `popup.html`
- Main user interface (popup window)
- Authentication buttons, playlist selection dropdown
- Progress bar and transfer results display
- Transfer history section

### `popup.js`
- Handles all popup interactions
- Manages authentication flow
- Controls playlist transfer process
- Updates UI with progress and results
- Loads and displays transfer history from storage

### `background.js`
- Service worker (background process)
- Handles Spotify API calls
- Manages OAuth token exchange
- Routes messages between popup and content scripts
- Manages local storage for tokens and transfer history

### `youtube-content.js`
- Content script that runs on YouTube Music
- Handles playlist creation via automation
- Searches for songs on YouTube Music
- Adds songs to playlists
- Interacts with YouTube Music DOM elements

### `styles.css`
- Responsive design for popup window
- Modern gradient styling with purple theme
- Button styles, form elements, progress bar
- Scrollbar customization

## Documentation Files

### `README.md`
- Complete project documentation
- Setup instructions with Spotify API registration
- Architecture overview with diagrams
- Limitations and troubleshooting guide
- Security considerations
- API references and future improvements

### `QUICKSTART.md`
- Fast 5-minute setup guide
- Step-by-step instructions for beginners
- Troubleshooting table
- Common questions and answers
- Tips for best results

## Backend Files (Optional but Recommended)

### `backend-server.js`
- Node.js/Express server for secure token exchange
- OAuth token handling endpoints
- Proxied Spotify API calls
- CORS configuration for security

### `package.json`
- Node.js project configuration
- Dependencies: express, axios, cors, dotenv
- Scripts for running the backend

### `.env.template`
- Configuration template file
- Copy to `.env` and fill in your credentials
- Stores Spotify API keys, redirect URI, backend URL

## Additional Files

### `.gitignore`
- Prevents sensitive files from being committed
- Excludes node_modules, .env, logs, IDE files

### `index.html` (deprecated)
- Old placeholder file, can be deleted
- Replaced by popup.html

### `script.js` (deprecated)
- Old script file with unrelated API calls
- Replaced by popup.js and background.js

## File Purpose Matrix

| File | Purpose | Runs In |
|------|---------|---------|
| manifest.json | Configuration | N/A (metadata) |
| popup.html/css | UI Layout | Extension Popup |
| popup.js | UI Logic | Extension Popup |
| background.js | API & Logic | Service Worker |
| youtube-content.js | YouTube Automation | YouTube Music Tab |
| backend-server.js | Secure Token Exchange | Node.js Server |

## Data Flow

```
User clicks extension icon
    ↓
popup.html displays UI
    ↓
popup.js handles user interactions
    ↓
Sends messages to background.js
    ↓
background.js communicates with:
    ├→ Spotify API (playlist data)
    └→ youtube-content.js (via messages)
    ↓
youtube-content.js automates YouTube Music
    ↓
Data stored in Chrome local storage
```

## Setup Checklist

- [ ] Update `SPOTIFY_CLIENT_ID` in `background.js`
- [ ] Install extension in Chrome via `chrome://extensions/`
- [ ] Get extension ID and update Spotify redirect URI
- [ ] (Optional) Set up `backend-server.js` for production
- [ ] Test with a small playlist first
- [ ] View results in transfer history

---

All files are ready to use! Start with the QUICKSTART.md guide.
