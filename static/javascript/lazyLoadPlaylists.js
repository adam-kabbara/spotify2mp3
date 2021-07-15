var grid_template = document.getElementById("grid-template"); 
var loadMoreButton = document.getElementById("load-more-button"); 
var gridBase = document.getElementById("grid-base");
var offset = 0; 
var limit = 10; 
var category = document.getElementsByClassName('page-title')[0].textContent.toLowerCase();


async function loadPlaylistData(){
    const response = await fetch(`/load-api-data/?offset=${offset}&limit=${limit}&url=https://api.spotify.com/v1/me/playlists`)
    const data = await response.json()
    console.log(data);

    if (Object.keys(data).length == 1 && data[0] == 'logout'){  //logout if the session is over
        element = document.createElement('a');
        element.setAttribute('href', `/login/`);
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

    }else if (Object.keys(data).length != 0){
        for (var i = 0; i < data.length; i++){
            let grid_template_clone = grid_template.content.cloneNode(true);
            offset++;

            var description = data[i]['description']
            var playlist_url = data[i]['external_urls']['spotify']
            var playlist_image = data[i]['images'][0]['url']
            var playlist_name = data[i]['name']
            var author_name = data[i]['owner']['display_name']
            var author_url = data[i]['owner']['external_urls']['spotify']
            var songs_href = data[i]['tracks']['href']
            var song_count = data[i]['tracks']['total']

            //grid_template_clone.querySelector('.grid-item').onclick = `loadPlaylistSongs(${songs_href}, ${playlist_name})`
            grid_template_clone.querySelector('.grid-item').value = `${songs_href},${playlist_name}`
            grid_template_clone.querySelector('.playlist-image').src = playlist_image;
            grid_template_clone.querySelector('.playlist-description').textContent += description;
            grid_template_clone.querySelector('.playlist-name').textContent = playlist_name;
            grid_template_clone.querySelector('.playlist-name').href = playlist_url;
            grid_template_clone.querySelector('.playlist-author').textContent = author_name;
            grid_template_clone.querySelector('.playlist-author').href = author_url;
            grid_template_clone.querySelector('.song-count').textContent += song_count;

            gridBase.appendChild(grid_template_clone);

        }
        loadMoreButton.innerHTML = `<input class="btn" type="button" value="Load More", onclick="loadMore()"></input>`;
    }if (Object.keys(data).length != limit || category == "recently played songs"){ // the second part is put since we cant get more than 50 songs back (note this is a problem from the sptify api and they are working on fixing it)
        loadMoreButton.innerHTML = `<p>no more data to load</p>`;
        moreDataAvailable = false;
    }
}

function loadMore(){
    loadMoreButton.innerHTML = `<div class="spinner-border" style="color: #1DB954;" role="status"><span class="visually-hidden">Loading...</span></div>`;
    loadPlaylistData();
}

loadPlaylistData();
