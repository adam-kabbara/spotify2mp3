var table_template = document.getElementById("song-data-template"); 
var loadMoreButton = document.getElementById("load-more-button"); 
var table = document.getElementById("main-table");
var offset = 0; 
var limit = 50;
var moreDataAvailable = true;
var category = document.getElementsByClassName('page-title')[0].textContent.toLowerCase();
var loadDataUrl;
var margin;

if (category == "saved songs"){
    loadDataUrl = 'https://api.spotify.com/v1/me/tracks';
}else if (category == "recently played songs"){
    loadDataUrl = 'https://api.spotify.com/v1/me/player/recently-played';
}else if (category == "top songs"){
    loadDataUrl = 'https://api.spotify.com/v1/me/top/tracks';
    limit = 49 // there is a bug with spotify api which doesnt let me get the data if offset is more that 50 in the top tracks so we set limit to 49 so offset will be 49
}else{
    loadDataUrl = document.getElementById('href').textContent;
    console.log(loadDataUrl);
}


async function loadSongData(url=loadDataUrl){
    const response = await fetch(`/load-api-data/?offset=${offset}&limit=${limit}&url=${url}`)
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
            let table_template_clone = table_template.content.cloneNode(true);
            var artists_names = [];
            offset++;

            //some data (ex top songs) dont have a ['track'] key 
            if ('track' in data[i]){
                var song_name = data[i]['track']['name'];
                var song_url = data[i]['track']['external_urls']['spotify'];
                var album_name = data[i]['track']['album']['name'];
                var album_url = data[i]['track']['album']['external_urls']['spotify'];
                var album_image = data[i]['track']['album']['images'][2]['url'];
                var artists = data[i]['track']['artists']
            }else{
                var song_name = data[i]['name'];
                var song_url = data[i]['external_urls']['spotify'];
                var album_name = data[i]['album']['name'];
                var album_url = data[i]['album']['external_urls']['spotify'];
                var album_image = data[i]['album']['images'][2]['url'];
                var artists = data[i]['artists']
            }

            for (var j = 0; j < artists.length; j++){ //artists names 
                var artist_url = artists[j]['external_urls']['spotify'];
                var artist_name = artists[j]['name'];
                artists_names.push(artist_name);
                if (j==0){margin=0}else{margin=-10}
                table_template_clone.querySelector('.artists-names').innerHTML += `<div class="artists-names-${offset}" style="margin-top:${margin}px"><a id="artists-names-${offset}" class="song-context" href="${artist_url}">${artist_name}</a></div>`;
            }

            table_template_clone.querySelector('.numbering').innerHTML += offset; //numbers  
            table_template_clone.querySelector('.album-image').innerHTML += `<div><button id="download-button-${offset}" class="btn download-btn" onclick="download(this.id, '${escape(song_name)}', '${escape(artists_names)}')"><div id="download-status-${offset}" class="spinner-border download-status" style="color: white;" role="status"><span class="visually-hidden">Loading...</span></div><img src=${album_image} valign="middle" vspace="5" hspace="5" /></button></div>`;
            //album image
            
            if (Object.keys(song_name).length > 25){ //song name
                table_template_clone.querySelector('.song-name').innerHTML = `<div class="max-width"><marquee width="100%" behavior="scroll" direction="left"><a id="song-name-${offset}" href="${song_url}" class="song-context">${song_name}</a></marquee></div>`;
            }else{
                table_template_clone.querySelector('.song-name').innerHTML = `<div><a id="song-name-${offset}" href="${song_url}" class="song-context">${song_name}</a></div>`;
            }

            if (Object.keys(album_name).length > 25){ //album name
                table_template_clone.querySelector('.album-name').innerHTML = `<div class="max-width"><marquee width="100%" behavior="scroll" direction="left"><a id="album-name-${offset}" class="song-context" href="${album_url}">${album_name}</a></marquee></div>`;
            }else{
                table_template_clone.querySelector('.album-name').innerHTML = `<div><a id="album-name-${offset}" class="song-context" href="${album_url}">${album_name}</a></div>`;
            } 
            table.appendChild(table_template_clone);

        }
        loadMoreButton.innerHTML = `<input class="btn" type="button" value="Load More", onclick="loadMore()"></input>`;
    }if (Object.keys(data).length != limit || category == "recently played songs"){ // the second part is put since we cant get more than 50 songs back (note this is a problem from the sptify api and they are working on fixing it)
        loadMoreButton.innerHTML = `<p>no more data to load</p>`;
        moreDataAvailable = false;
    }
}

function loadMore(){
    loadMoreButton.innerHTML = `<div class="spinner-border" style="color: #1DB954;" role="status"><span class="visually-hidden">Loading...</span></div>`;
    loadSongData();
}

loadSongData();
