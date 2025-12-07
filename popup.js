// Popup Script for Playlist Transfer Extension

let spotifyToken = null;
let youtubeToken = null;
let currentPlaylist = null;
let currentPlaylistTracks = [];

// DOM Elements
const spotifyAuthBtn = document.getElementById('spotify-auth-btn');
const youtubeAuthBtn = document.getElementById('youtube-auth-btn');
const authStatus = document.getElementById('auth-status');
const transferSection = document.getElementById('transfer-section');
const sourceService = document.getElementById('source-service');
const playlistSelect = document.getElementById('playlist-select');
const destinationService = document.getElementById('destination-service');
const transferBtn = document.getElementById('transfer-btn');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const matchedCount = document.getElementById('matched-count');
const notFoundCount = document.getElementById('not-found-count');
const resultsSection = document.getElementById('results-section');
const resultsMessage = document.getElementById('results-message');
const closeBtn = document.getElementById('close-btn');
const savedTransfers = document.getElementById('saved-transfers');
const clearStorageBtn = document.getElementById('clear-storage-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAuthStatus();
    loadSavedTransfers();
    attachEventListeners();
});

function attachEventListeners() {
    spotifyAuthBtn.addEventListener('click', authenticateSpotify);
    youtubeAuthBtn.addEventListener('click', authenticateYoutube);
    sourceService.addEventListener('change', handleSourceChange);
    transferBtn.addEventListener('click', handleTransfer);
    closeBtn.addEventListener('click', resetUI);
    clearStorageBtn.addEventListener('click', handleClearStorage);
}

/**
 * Load authentication status from storage
 */
function loadAuthStatus() {
    chrome.storage.local.get(['spotifyToken', 'youtubeToken'], (result) => {
        spotifyToken = result.spotifyToken;
        youtubeToken = result.youtubeToken;
        updateAuthUI();
    });
}

/**
 * Update authentication UI based on token status
 */
function updateAuthUI() {
    if (spotifyToken) {
        spotifyAuthBtn.textContent = '✓ Spotify Connected';
        spotifyAuthBtn.disabled = true;
        spotifyAuthBtn.style.opacity = '0.7';
        showAuthStatus('Spotify authenticated', 'success');
    }

    if (youtubeToken) {
        youtubeAuthBtn.textContent = '✓ YouTube Connected';
        youtubeAuthBtn.disabled = true;
        youtubeAuthBtn.style.opacity = '0.7';
        showAuthStatus('YouTube authenticated', 'success');
    }

    if (spotifyToken && youtubeToken) {
        transferSection.classList.remove('hidden');
        loadSpotifyPlaylists();
    }
}

/**
 * Show authentication status message
 */
function showAuthStatus(message, type) {
    authStatus.textContent = message;
    authStatus.className = `auth-status ${type}`;
}

/**
 * Authenticate with Spotify
 */
async function authenticateSpotify() {
    try {
        showAuthStatus('Authenticating with Spotify...', '');
        const response = await chrome.runtime.sendMessage({ type: 'SPOTIFY_AUTH' });
        
        if (response.error) {
            showAuthStatus('Spotify authentication failed', 'error');
            console.error(response.error);
        } else {
            spotifyToken = response.token;
            chrome.storage.local.set({ spotifyToken: spotifyToken });
            showAuthStatus('Spotify authenticated successfully', 'success');
            updateAuthUI();
        }
    } catch (error) {
        showAuthStatus('Authentication error: ' + error.message, 'error');
        console.error('Auth error:', error);
    }
}

/**
 * Authenticate with YouTube
 */
async function authenticateYoutube() {
    try {
        showAuthStatus('Authenticating with YouTube...', '');
        
        // For YouTube Music, we need to use a different approach
        // Open YouTube Music in a new tab for manual authentication
        const authUrl = 'https://music.youtube.com/';
        chrome.tabs.create({ url: authUrl }, (tab) => {
            youtubeToken = { authenticated: true }; // Placeholder
            chrome.storage.local.set({ youtubeToken: youtubeToken });
            showAuthStatus('Please log in to YouTube Music in the new tab', 'success');
            updateAuthUI();
        });
    } catch (error) {
        showAuthStatus('YouTube authentication error: ' + error.message, 'error');
        console.error('YouTube auth error:', error);
    }
}

/**
 * Load Spotify playlists
 */
async function loadSpotifyPlaylists() {
    if (!spotifyToken) {
        playlistSelect.innerHTML = '<option value="">Please authenticate Spotify first</option>';
        return;
    }

    try {
        playlistSelect.innerHTML = '<option value="">Loading playlists...</option>';
        const response = await chrome.runtime.sendMessage({
            type: 'GET_SPOTIFY_PLAYLISTS',
            token: spotifyToken
        });

        if (response.error) {
            playlistSelect.innerHTML = '<option value="">Error loading playlists</option>';
            console.error(response.error);
        } else {
            playlistSelect.innerHTML = '<option value="">Select a playlist</option>';
            response.forEach(playlist => {
                const option = document.createElement('option');
                option.value = JSON.stringify(playlist);
                option.textContent = `${playlist.name} (${playlist.trackCount} songs)`;
                playlistSelect.appendChild(option);
            });
        }
    } catch (error) {
        playlistSelect.innerHTML = '<option value="">Error loading playlists</option>';
        console.error('Error loading playlists:', error);
    }
}

/**
 * Handle source service change
 */
function handleSourceChange() {
    if (sourceService.value === 'spotify') {
        loadSpotifyPlaylists();
    }
}

/**
 * Handle playlist transfer
 */
async function handleTransfer() {
    if (!playlistSelect.value) {
        alert('Please select a playlist');
        return;
    }

    if (sourceService.value !== 'spotify' || destinationService.value !== 'youtube-music') {
        alert('Currently only Spotify to YouTube Music transfer is supported');
        return;
    }

    currentPlaylist = JSON.parse(playlistSelect.value);
    
    // Hide transfer section, show progress
    transferSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    matchedCount.textContent = '0';
    notFoundCount.textContent = '0';

    try {
        // Step 1: Get playlist tracks from Spotify
        progressText.textContent = 'Fetching playlist tracks from Spotify...';
        const tracks = await chrome.runtime.sendMessage({
            type: 'GET_SPOTIFY_PLAYLIST_TRACKS',
            playlistId: currentPlaylist.id,
            token: spotifyToken
        });

        currentPlaylistTracks = tracks;
        progressText.textContent = `Found ${tracks.length} tracks. Creating YouTube Music playlist...`;
        updateProgress(30);

        // Step 2: Create playlist on YouTube Music
        const playlistCreated = await createYoutubePlaylist(currentPlaylist.name);
        
        if (!playlistCreated) {
            throw new Error('Failed to create YouTube Music playlist');
        }

        progressText.textContent = 'Searching and adding tracks to YouTube Music...';
        updateProgress(40);

        // Step 3: Search and add each track
        let matched = 0;
        let notFound = 0;

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const found = await searchAndAddToYoutube(track, currentPlaylist.name);
            
            if (found) {
                matched++;
            } else {
                notFound++;
            }

            const progress = 40 + (i / tracks.length) * 60;
            updateProgress(progress);
            
            progressText.textContent = `Adding tracks... ${i + 1}/${tracks.length}`;
            matchedCount.textContent = matched;
            notFoundCount.textContent = notFound;
        }

        // Transfer complete
        completeTransfer(matched, notFound);

    } catch (error) {
        progressText.textContent = 'Error: ' + error.message;
        console.error('Transfer error:', error);
        setTimeout(() => {
            resetUI();
        }, 3000);
    }
}

/**
 * Update progress bar
 */
function updateProgress(percent) {
    progressFill.style.width = percent + '%';
}

/**
 * Create playlist on YouTube Music
 */
async function createYoutubePlaylist(playlistName) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: 'YOUTUBE_CREATE_PLAYLIST',
            playlistName: playlistName
        }, (response) => {
            resolve(!response.error);
        });
    });
}

/**
 * Search for track on YouTube Music and add it
 */
async function searchAndAddToYoutube(track, playlistName) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: 'YOUTUBE_SEARCH_AND_ADD',
            track: track,
            playlistName: playlistName
        }, (response) => {
            resolve(!response.error && response.found);
        });
    });
}

/**
 * Complete transfer
 */
async function completeTransfer(matched, notFound) {
    progressSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    const total = matched + notFound;
    const successRate = Math.round((matched / total) * 100);
    
    resultsMessage.innerHTML = `
        <strong>Transfer Complete!</strong><br>
        Playlist: <strong>${currentPlaylist.name}</strong><br>
        Matched: ${matched}/${total} songs (${successRate}%)<br>
        Not found: ${notFound} songs
    `;

    // Save transfer to history
    await chrome.runtime.sendMessage({
        type: 'SAVE_TRANSFER',
        transfer: {
            source: 'Spotify',
            destination: 'YouTube Music',
            playlistName: currentPlaylist.name,
            tracksMatched: matched,
            tracksTotal: total
        }
    });

    loadSavedTransfers();
}

/**
 * Load saved transfers from storage
 */
function loadSavedTransfers() {
    chrome.runtime.sendMessage({ type: 'GET_TRANSFERS' }, (transfers) => {
        savedTransfers.innerHTML = '';
        
        if (transfers && transfers.length > 0) {
            transfers.slice(-5).reverse().forEach(transfer => {
                const date = new Date(transfer.timestamp).toLocaleDateString();
                const html = `
                    <div class="transfer-item">
                        <div class="transfer-item-info">
                            <div class="transfer-item-name">${transfer.playlistName}</div>
                            <div class="transfer-item-date">${date} • ${transfer.tracksMatched}/${transfer.tracksTotal} matched</div>
                        </div>
                    </div>
                `;
                savedTransfers.innerHTML += html;
            });
        } else {
            savedTransfers.innerHTML = '<p style="color: #999; font-size: 13px;">No transfers yet</p>';
        }
    });
}

/**
 * Reset UI to initial state
 */
function resetUI() {
    progressSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    transferSection.classList.remove('hidden');
    progressFill.style.width = '0%';
    matchedCount.textContent = '0';
    notFoundCount.textContent = '0';
    playlistSelect.value = '';
    loadSavedTransfers();
}

/**
 * Handle clear storage
 */
function handleClearStorage() {
    if (confirm('Are you sure you want to clear all data and log out?')) {
        chrome.runtime.sendMessage({ type: 'CLEAR_STORAGE' }, () => {
            spotifyToken = null;
            youtubeToken = null;
            spotifyAuthBtn.textContent = 'Login with Spotify';
            spotifyAuthBtn.disabled = false;
            spotifyAuthBtn.style.opacity = '1';
            youtubeAuthBtn.textContent = 'Login with YouTube';
            youtubeAuthBtn.disabled = false;
            youtubeAuthBtn.style.opacity = '1';
            authStatus.className = 'auth-status';
            transferSection.classList.add('hidden');
            loadSavedTransfers();
        });
    }
}
