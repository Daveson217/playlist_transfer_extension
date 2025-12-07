/**
 * Backend Server for Secure Spotify Token Exchange
 * This is an example implementation using Node.js and Express
 * 
 * Installation:
 * npm install express axios cors dotenv
 * 
 * Usage:
 * 1. Update your environment variables (.env file)
 * 2. Run: node backend-server.js
 * 3. Update popup.js to use your backend URL instead of direct API calls
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.EXTENSION_ID ? `chrome-extension://${process.env.EXTENSION_ID}` : '*'
}));

// Spotify Configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

/**
 * Exchange authorization code for access token
 * POST /api/spotify/token-exchange
 * Body: { code: "authorization_code" }
 */
app.post('/api/spotify/token-exchange', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        const response = await axios.post('https://accounts.spotify.com/api/token',
            {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Return the token to the extension
        res.json({
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            token_type: response.data.token_type
        });

    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to exchange authorization code',
            details: error.response?.data?.error_description || error.message
        });
    }
});

/**
 * Refresh access token
 * POST /api/spotify/refresh-token
 * Body: { refresh_token: "refresh_token" }
 */
app.post('/api/spotify/refresh-token', async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const response = await axios.post('https://accounts.spotify.com/api/token',
            {
                grant_type: 'refresh_token',
                refresh_token: refresh_token,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        res.json({
            access_token: response.data.access_token,
            expires_in: response.data.expires_in,
            token_type: response.data.token_type
        });

    } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to refresh token',
            details: error.response?.data?.error_description || error.message
        });
    }
});

/**
 * Get user's Spotify playlists (proxied request)
 * GET /api/spotify/playlists
 * Headers: { Authorization: "Bearer access_token" }
 */
app.get('/api/spotify/playlists', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authorization header missing' });
        }

        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Playlists fetch error:', error.response?.status || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch playlists',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * Get tracks from a Spotify playlist (proxied request)
 * GET /api/spotify/playlists/:playlistId/tracks
 * Headers: { Authorization: "Bearer access_token" }
 */
app.get('/api/spotify/playlists/:playlistId/tracks', async (req, res) => {
    try {
        const { playlistId } = req.params;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authorization header missing' });
        }

        let allTracks = [];
        let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

        // Handle pagination
        while (url) {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const tracks = response.data.items.map(item => ({
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                album: item.track.album.name,
                duration: item.track.duration_ms,
                spotifyId: item.track.id,
                isrc: item.track.external_ids?.isrc,
                image: item.track.album.images?.[0]?.url
            }));

            allTracks = allTracks.concat(tracks);
            url = response.data.next; // Next page URL
        }

        res.json(allTracks);

    } catch (error) {
        console.error('Tracks fetch error:', error.response?.status || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch playlist tracks',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
});
