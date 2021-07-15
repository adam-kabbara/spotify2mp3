var grid_template = document.getElementById("grid-template"); 
var loadMoreButton = document.getElementById("load-more-button"); 
var gridBase = document.getElementById("grid-base");
var offset = 0; 
var limit = 10; 
var category = document.getElementsByClassName('page-title')[0].textContent.toLowerCase();


async function loadAlbumData(){
    const response = await fetch(`/load-api-data/?offset=${offset}&limit=${limit}&url=https://api.spotify.com/v1/me/albums`)
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

            var album_url = data[i]['album']['external_urls']['spotify']
            var album_image = data[i]['album']['images'][0]['url']
            var album_name = data[i]['album']['name']
            var song_count = data[i]['album']['total_tracks']
            var songs_href = data[i]['album']['tracks']['href']
            
            for (var j = 0;  j < data[i]['album']['artists'].length ; j++){
                var artist_name = data[i]['album']['artists'][j]['name']
                var artist_url = data[i]['album']['artists'][j]['external_urls']['spotify']
                if (j==0){
                    grid_template_clone.querySelector('.artists').innerHTML = `<a href="${artist_url}">${artist_name}</a>`;
                }else{
                    grid_template_clone.querySelector('.artists').innerHTML = ` / <a href="${artist_url}">${artist_name}</a>`; // add a spacer
                }
            }

            grid_template_clone.querySelector('.grid-item').value = `${songs_href},${album_name},${album_url},${data[i]['album']['images'][2]['url']}`
            grid_template_clone.querySelector('.album-image').src = album_image;
            grid_template_clone.querySelector('.album-name').textContent = album_name;
            grid_template_clone.querySelector('.album-name').href = album_url;
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
    loadAlbumData();
}

loadAlbumData();
