// Background Service Worker for Playlist Transfer Extension

const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
const SPOTIFY_REDIRECT_URI = chrome.identity.getRedirectURL();
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Initialize on extension install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Playlist Transfer Extension installed');
    chrome.storage.local.set({ 
        transfers: [],
        spotifyToken: null,
        youtubeToken: null
    });
});

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'SPOTIFY_AUTH':
            handleSpotifyAuth().then(sendResponse).catch(err => sendResponse({ error: err.message }));
            return true;

        case 'GET_SPOTIFY_PLAYLISTS':
            getSpotifyPlaylists(request.token).then(sendResponse).catch(err => sendResponse({ error: err.message }));
            return true;

        case 'GET_SPOTIFY_PLAYLIST_TRACKS':
            getSpotifyPlaylistTracks(request.playlistId, request.token).then(sendResponse).catch(err => sendResponse({ error: err.message }));
            return true;

        case 'YOUTUBE_CREATE_PLAYLIST':
            chrome.tabs.query({ url: '*://music.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, request, sendResponse);
                } else {
                    sendResponse({ error: 'YouTube Music tab not found' });
                }
            });
            return true;

        case 'YOUTUBE_SEARCH_AND_ADD':
            chrome.tabs.query({ url: '*://music.youtube.com/*' }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, request, sendResponse);
                } else {
                    sendResponse({ error: 'YouTube Music tab not found' });
                }
            });
            return true;

        case 'SAVE_TRANSFER':
            saveTransferToStorage(request.transfer).then(sendResponse).catch(err => sendResponse({ error: err.message }));
            return true;

        case 'GET_TRANSFERS':
            chrome.storage.local.get('transfers', (result) => {
                sendResponse(result.transfers || []);
            });
            return true;

        case 'CLEAR_STORAGE':
            chrome.storage.local.set({ transfers: [], spotifyToken: null, youtubeToken: null });
            sendResponse({ success: true });
            return true;

        default:
            sendResponse({ error: 'Unknown request type' });
    }
});

/**
 * Handle Spotify OAuth authentication
 */
async function handleSpotifyAuth() {
    const scope = 'playlist-read-private playlist-read-collaborative';
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.append('scope', scope);

    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true }, (redirectUrl) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (!redirectUrl) {
                reject(new Error('Auth cancelled'));
                return;
            }

            // Extract authorization code from redirect URL
            const url = new URL(redirectUrl);
            const code = url.searchParams.get('code');

            if (!code) {
                reject(new Error('No authorization code received'));
                return;
            }

            // Exchange code for token
            exchangeCodeForToken(code).then(token => {
                chrome.storage.local.set({ spotifyToken: token }, () => {
                    resolve({ token: token, success: true });
                });
            }).catch(reject);
        });
    });
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code) {
    // Note: This requires a backend server for security reasons
    // Client-side requests won't work due to CORS restrictions
    // You'll need to implement a backend endpoint to handle this
    throw new Error('Token exchange must be handled by your backend server');
}

/**
 * Get user's Spotify playlists
 */
async function getSpotifyPlaylists(token) {
    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks.total,
        image: playlist.images?.[0]?.url
    }));
}

/**
 * Get all tracks from a Spotify playlist
 */
async function getSpotifyPlaylistTracks(playlistId, token) {
    let allTracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    while (url) {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const data = await response.json();
        const tracks = data.items.map(item => ({
            title: item.track.name,
            artist: item.track.artists.map(a => a.name).join(', '),
            album: item.track.album.name,
            duration: item.track.duration_ms,
            spotifyId: item.track.id,
            isrc: item.track.external_ids?.isrc
        }));

        allTracks = allTracks.concat(tracks);
        url = data.next; // Pagination
    }

    return allTracks;
}

/**
 * Save transfer history to storage
 */
async function saveTransferToStorage(transfer) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('transfers', (result) => {
            const transfers = result.transfers || [];
            transfer.timestamp = new Date().toISOString();
            transfers.push(transfer);
            
            chrome.storage.local.set({ transfers }, () => {
                resolve({ success: true });
            });
        });
    });
}
