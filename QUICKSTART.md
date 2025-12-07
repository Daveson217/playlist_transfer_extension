# Quick Start Guide

## Installation in 5 Minutes

### Step 1: Get Your Spotify Credentials (2 minutes)

1. Go to https://developer.spotify.com/dashboard
2. Sign in or create an account
3. Create a new app
4. Copy your **Client ID**
5. Go to "Edit Settings" and add a Redirect URI: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
   (You'll get the extension ID after loading the extension in Chrome)

### Step 2: Load the Extension (1 minute)

1. Open Chrome and go to `chrome://extensions/`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `playlist_transfer_extension` folder
5. Copy the **Extension ID** that appears

### Step 3: Update Spotify Credentials (1 minute)

1. In the extension folder, open `background.js`
2. Find this line: `const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';`
3. Replace it with: `const SPOTIFY_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID';`
4. Go back to your Spotify app settings and update the Redirect URI to:
   `https://{your_extension_id}.chromiumapp.org/`

### Step 4: Use the Extension (1 minute)

1. Click the extension icon in your Chrome toolbar
2. Click "Login with Spotify" and authorize
3. Click "Login with YouTube" and make sure YouTube Music is open
4. Select a Spotify playlist and click "Transfer Playlist"
5. Watch the magic happen! ✨

## What Happens During Transfer

```
1. Extension reads all songs from your Spotify playlist
2. Creates a new playlist on YouTube Music with the same name
3. For each song:
   - Searches YouTube Music with the song title + artist
   - Adds the best matching result to the new playlist
4. Shows you results with match statistics
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension won't load | Make sure all files are in the same folder and manifest.json is valid |
| Spotify login fails | Check your Client ID is correct and Redirect URI matches extension ID |
| YouTube songs not found | Not all songs exist on YouTube Music - transfers typically match 80-95% |
| Extension crashes | Open Chrome DevTools (F12) and check the console for error messages |

## Tips for Best Results

- ✅ Start with a small playlist (10-20 songs) to test
- ✅ Keep YouTube Music tab open during transfer
- ✅ Use songs with unique titles (less likely to get wrong match)
- ✅ Check your internet connection
- ⚠️ Large playlists (1000+ songs) may take 1+ hours
- ⚠️ YouTube region restrictions may prevent some songs from being added

## Common Questions

**Q: Is my data secure?**
A: All data stays in your browser. Tokens are stored locally in Chrome storage. Consider using the backend server for additional security.

**Q: Can I transfer back to Spotify?**
A: Not yet - this is planned for a future version.

**Q: Why are some songs not found?**
A: YouTube Music may not have certain songs, or they might be under different names/artists.

**Q: Can I schedule automatic transfers?**
A: Not yet - planned for v2.0

## Next Steps

- Read the full [README.md](./README.md) for advanced features
- Set up the [backend server](./backend-server.js) for production use
- Check out the [GitHub repository](https://github.com/your-username/playlist-transfer-extension) for updates

## Need Help?

- Check error messages in Chrome's Developer Tools (F12 → Console)
- Verify your Spotify credentials and extension ID
- Make sure YouTube Music is loaded and you're logged in
- Restart Chrome and try again

---

**Enjoy transferring playlists! 🎵**
