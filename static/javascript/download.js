var stop_loading = false;
var song_list = [];

function download(btn_id, song_name, artists_names){

    var id_num = btn_id.split('-').pop();
    var download_status = document.getElementById(`download-status-${id_num}`)
    song_name = unescape(song_name);
    artists_names = unescape(artists_names).replace(',', ', ');
    
    if(! song_list.includes(`${song_name}, ${artists_names}`)){
        download_status.style.display = 'block';

        fetch(`/download-song/?song=${song_name}&artists=${artists_names}`)
        .then(response => response.blob())
        .then(blob => {
            var url = window.URL.createObjectURL(blob);
            console.log(url);
            var element = document.createElement('a');
            element.setAttribute('href', url);
            element.setAttribute('download', `${song_name} ${artists_names}.mp3`);  
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            download_status.style.display = 'none';
        });

        song_list.push(`${song_name}, ${artists_names}`)
    }
}

async function downloadAll(){
    approval = await confirmDownloadAll();    
    if (approval){
        var download_btns = document.getElementsByClassName('download-btn');
        for (var i=0; i<download_btns.length; i++){
            download_btns[i].click();
        }
    }
}

async function confirmDownloadAll(){
    document.getElementById('CenterDIV').style.display = 'block';
    while(moreDataAvailable){
        await loadSongData();
        if (stop_loading){
            return;
        }
    }
    stop_loading = false; //reset the stop var 
    closePopUp();
    var num_of_songs = document.getElementsByClassName('song-name').length;
    var approval = window.confirm(`Are you sure you want to download all ${num_of_songs} songs?`);
    return approval;
}

function closePopUp(){
    document.getElementById('CenterDIV').style.display = 'none';
    stop_loading = true;
}


