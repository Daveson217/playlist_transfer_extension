async function fetchPlaylistsFromSource() {
    // Simulate fetching playlists from the source service
    const url = 'https://concerts-artists-events-tracker.p.rapidapi.com/search?city=Pennsylvania&types=event&starts_at=2026-02-08&filter=physical&genre=christian-gospel';
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '98d9f84dfcmshd22c180343663efp1009ebjsnfdfb04823673', // Revoked key
            'x-rapidapi-host': 'concerts-artists-events-tracker.p.rapidapi.com'
        }
    };

    let result;
    try {
        const response = await fetch(url, options);
        result = await response.json();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
    // return data.playlists; // Assuming the response has a 'playlists' field
    document.getElementById("playlist").innerHTML = result.events.map(item => `<li>${item.title} - ${item.starts_at}</li>`).join('');
}

fetchPlaylistsFromSource();