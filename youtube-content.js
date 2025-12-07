// YouTube Music Content Script for Playlist Transfer Extension

let currentPlaylistId = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'YOUTUBE_CREATE_PLAYLIST':
            createPlaylist(request.playlistName).then(playlistId => {
                currentPlaylistId = playlistId;
                sendResponse({ success: true, playlistId: playlistId });
            }).catch(error => {
                sendResponse({ error: error.message });
            });
            return true;

        case 'YOUTUBE_SEARCH_AND_ADD':
            searchAndAddTrack(request.track, request.playlistName).then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ error: error.message, found: false });
            });
            return true;

        default:
            sendResponse({ error: 'Unknown request type' });
    }
});

/**
 * Create a new playlist on YouTube Music
 */
async function createPlaylist(playlistName) {
    try {
        // Wait for page to load
        await waitForElement('ytmusic-nav-bar', 5000);
        
        // Click the "Create playlist" button
        const createBtn = await findElementByText('Create new playlist');
        if (createBtn) {
            createBtn.click();
            await sleep(500);
        }

        // Find and fill the playlist name input
        const nameInput = document.querySelector('input[placeholder*="ame"]');
        if (nameInput) {
            nameInput.value = playlistName;
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(500);
        }

        // Click Create button
        const createConfirm = await findElementByText('Create');
        if (createConfirm) {
            createConfirm.click();
            await sleep(1000);
        }

        // Extract playlist ID from URL or page
        const playlistId = extractPlaylistId();
        if (playlistId) {
            return playlistId;
        } else {
            throw new Error('Could not extract playlist ID');
        }

    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
}

/**
 * Search for a track and add it to the playlist
 */
async function searchAndAddTrack(track, playlistName) {
    try {
        // Search for the track
        const searchResults = await searchYoutubeMusic(track);
        
        if (!searchResults || searchResults.length === 0) {
            return { found: false };
        }

        // Get the most relevant result
        const bestMatch = searchResults[0];

        // Add to playlist
        const added = await addToPlaylist(bestMatch, currentPlaylistId || playlistName);
        
        return { found: added, track: bestMatch };

    } catch (error) {
        console.error('Error searching/adding track:', error);
        return { found: false, error: error.message };
    }
}

/**
 * Search for a track on YouTube Music
 */
async function searchYoutubeMusic(track) {
    try {
        // Click search box
        const searchBox = document.querySelector('input[placeholder*="earch"]');
        if (!searchBox) {
            throw new Error('Search box not found');
        }

        searchBox.focus();
        searchBox.value = `${track.title} ${track.artist}`;
        searchBox.dispatchEvent(new Event('input', { bubbles: true }));
        
        await sleep(800);

        // Wait for results to appear
        const resultsList = await waitForElement('[role="listbox"]', 3000);
        
        // Extract search results
        const results = [];
        const items = resultsList.querySelectorAll('[role="option"]');
        
        items.forEach((item, index) => {
            if (index < 3) { // Get top 3 results
                const titleEl = item.querySelector('[role="button"]');
                results.push({
                    title: titleEl?.textContent || '',
                    element: item
                });
            }
        });

        return results;

    } catch (error) {
        console.error('Error searching:', error);
        return [];
    }
}

/**
 * Add a track to a playlist
 */
async function addToPlaylist(trackElement, playlistName) {
    try {
        // Right-click to open context menu
        trackElement.element?.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        await sleep(500);

        // Look for "Add to playlist" option
        const addToPlaylistBtn = await findElementByText('Add to playlist');
        if (addToPlaylistBtn) {
            addToPlaylistBtn.click();
            await sleep(500);

            // Select the target playlist
            const playlistOption = await findElementByText(playlistName);
            if (playlistOption) {
                playlistOption.click();
                await sleep(300);
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error('Error adding to playlist:', error);
        return false;
    }
}

/**
 * Extract playlist ID from current URL or page
 */
function extractPlaylistId() {
    // Try to get from URL
    const urlMatch = window.location.href.match(/list=([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
        return urlMatch[1];
    }

    // Try to find in page data
    const playlistLink = document.querySelector('a[href*="list="]');
    if (playlistLink) {
        const linkMatch = playlistLink.href.match(/list=([a-zA-Z0-9_-]+)/);
        if (linkMatch) {
            return linkMatch[1];
        }
    }

    return null;
}

/**
 * Find element by text content
 */
function findElementByText(text) {
    const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        return el.textContent.includes(text) && el.children.length === 0;
    });
    return elements[0] || null;
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('YouTube Music content script loaded');
