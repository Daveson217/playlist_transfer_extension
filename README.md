# Playlist Transfer Extension

A Chrome extension that transfers playlists between Spotify and YouTube Music seamlessly.

## Features

- 🎵 Transfer playlists from Spotify to YouTube Music
- 🔍 Intelligent song matching using track information
- 💾 Local storage of transfer history
- 🔐 Secure OAuth authentication
- 📊 Real-time transfer progress tracking
- ⏭️ Automatic track search and adding

## Setup Instructions

### Prerequisites

- Google Chrome browser
- Spotify account
- YouTube Music account

### Installation Steps

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd playlist_transfer_extension
   ```

2. **Register a Spotify Application**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Sign in with your Spotify account
   - Click "Create an App"
   - Accept the terms and create the app
   - Copy your **Client ID**
   - In app settings, set the Redirect URI to: `https://<your-extension-id>.chromiumapp.org/`

3. **Update Configuration**
   - Open `background.js`
   - Replace `YOUR_SPOTIFY_CLIENT_ID` with your Client ID from step 2
   - Find your extension ID after installing (see step 6)

4. **Set up Backend Server (Optional but Recommended)**
   
   For security, implement a backend server to handle Spotify token exchange. The extension currently requires backend support for OAuth. Here's a simple Node.js example:

   ```javascript
   // backend/routes/spotify-auth.js
   const express = require('express');
   const axios = require('axios');
   const router = express.Router();

   const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
   const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
   const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

   router.post('/token-exchange', async (req, res) => {
       try {
           const { code } = req.body;
           const response = await axios.post('https://accounts.spotify.com/api/token', null, {
               params: {
                   grant_type: 'authorization_code',
                   code: code,
                   redirect_uri: SPOTIFY_REDIRECT_URI,
                   client_id: SPOTIFY_CLIENT_ID,
                   client_secret: SPOTIFY_CLIENT_SECRET
               }
           });

           res.json(response.data);
       } catch (error) {
           res.status(500).json({ error: error.message });
       }
   });

   module.exports = router;
   ```

5. **Load the Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `playlist_transfer_extension` folder
   - The extension is now installed!

6. **Get Your Extension ID**
   - After loading, you'll see your extension with an ID
   - Copy this ID and update the Redirect URI in your Spotify app settings to:
     `https://{extension-id}.chromiumapp.org/`

## How to Use

### First Time Setup

1. Click the extension icon in Chrome
2. Click "Login with Spotify" and authorize the app
3. Click "Login with YouTube" and ensure you're logged into YouTube Music
4. The extension will show a "Transfer Playlist" section once both are authenticated

### Transferring a Playlist

1. Select "Spotify" as the source
2. Choose the playlist you want to transfer from the dropdown
3. Select "YouTube Music" as the destination
4. Click "Transfer Playlist"
5. Watch the progress bar as the extension:
   - Fetches all songs from your Spotify playlist
   - Creates a new playlist with the same name on YouTube Music
   - Searches for each song and adds it to the new playlist
6. View results showing matched songs and any songs that couldn't be found

### Transfer History

- The extension keeps a record of your last 5 transfers
- Click "Clear All Data" to remove all stored information and log out

## File Structure

```
playlist_transfer_extension/
├── manifest.json          # Extension configuration
├── popup.html             # Main UI
├── popup.js              # Popup logic
├── background.js         # Service worker and API handling
├── youtube-content.js    # YouTube Music automation
├── styles.css            # UI styling
└── README.md            # This file
```

## Architecture

### Components

1. **manifest.json** - Extension manifest with permissions and configuration
2. **popup.html/js** - Main user interface for authentication and transfer control
3. **background.js** - Service worker handling:
   - Spotify API communication
   - OAuth token management
   - Message routing between components
   - Storage management
4. **youtube-content.js** - Content script for YouTube Music automation:
   - Playlist creation
   - Track searching
   - Adding songs to playlists

### Data Flow

```
Popup (User Interface)
  ↓
Background Service Worker (API Logic)
  ↓
  ├→ Spotify API (Playlist & Track Data)
  └→ YouTube Music Content Script (Browser Automation)
  ↓
Local Storage (Transfer History & Tokens)
```

## Limitations & Notes

### Current Limitations

1. **YouTube Music Automation**: Currently uses content script automation (clicking, searching). YouTube Music doesn't have a public API for playlist creation, so browser automation is necessary.
2. **Song Matching**: The extension searches by title + artist name. Complex songs or covers might not match perfectly.
3. **Rate Limiting**: Large playlists may take time due to individual song searches.
4. **YouTube Login**: Manual YouTube login required (automated OAuth not available for YouTube Music)

### Future Improvements

- [ ] Two-way sync (YouTube Music to Spotify)
- [ ] Batch operations for faster transfers
- [ ] Better song matching using ISRC codes
- [ ] Apple Music support
- [ ] Scheduled automatic syncing
- [ ] Duplicate detection
- [ ] Playlist merging options

## Security Considerations

1. **Token Storage**: Tokens are stored in Chrome's local storage
2. **Backend Recommended**: For production use, implement a secure backend for token exchange
3. **Permissions**: The extension requests minimal necessary permissions
4. **No Data Collection**: All data stays local to your browser

## Troubleshooting

### "Spotify Authentication Failed"
- Ensure your Client ID is correct in `background.js`
- Check that the Redirect URI matches your extension ID
- Clear browser cache and try again

### "YouTube Tab Not Found"
- Open YouTube Music in a tab before transferring
- Ensure you're logged into your YouTube account

### Songs Not Being Found
- Check spelling of song titles (exact names work best)
- Try with a smaller playlist first
- Some region-specific songs might not be available

### Extension Not Loading
- Check the extension ID matches your Spotify redirect URI
- Verify all files are in the correct folder
- Check Chrome's console for error messages (Ctrl+Shift+J)

## API References

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [YouTube Music (Unofficial)](https://github.com/sigma67/ytmusicapi)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the developer.

---

**Note**: This extension is not affiliated with Spotify, YouTube, or Google. Use at your own risk and comply with the terms of service of both platforms.
