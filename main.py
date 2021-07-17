from logging import raiseExceptions
from flask import Flask, redirect, url_for, render_template, request, session, jsonify, make_response, send_file
import requests
import datetime
from datetime import timedelta
import time
from youtubesearchpython import VideosSearch
import youtube_dl
import os
import pytz
import private


app = Flask(__name__)
app.secret_key = private.secret_key
base_url = f'http://{private.ip}:5000'

scope = "user-library-read user-read-recently-played user-top-read user-read-private playlist-read-collaborative playlist-read-private"
client_id = private.client_id
client_secret = private.client_secret
utc=pytz.UTC


# FLASK ROUTS 

@app.route('/', methods=['POST', 'GET'])
def home():
    return render_template('home.html')

@app.route('/login/', methods=['POST', 'GET'])
def login():
    if 'access_token' in session:
        refresh_token_if_expired()
        return redirect(url_for('inventory'))

    else: 
        redirect_uri = base_url + url_for('inventory')
        auth_url = requests.Request("GET", "https://accounts.spotify.com/authorize", params={
            'scope': scope,
            'response_type': 'code',
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'show_dialog': 'True'  # forces user to sgin in again...
        }).prepare().url
        return redirect(auth_url)
        

@app.route('/logout/')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.route('/inventory/', methods=['POST', 'GET'])
def inventory():
    if session == {}: #just signed in
        spotify_callback()

    if request.method == 'POST' and request.form.to_dict()['logout_btn']: # logout 
        session.clear()
        return redirect(url_for('home'))

    if 'access_token' in session:  # render user_song page if logged in
        refresh_token_if_expired()
        return render_template('inventory.html', usr_name=session['user-name'])

    else:
        return redirect(url_for('login'))  # if not logged in go to home page



@app.route('/saved-songs-download/', endpoint="saved-songs-download")
@app.route('/top-songs-download/', endpoint="top-songs-download")
@app.route('/recently-played-songs-download/', endpoint="recently-played-songs-download")
@app.route('/<playlist_name>-playlist/', endpoint='playlist-download-page')
def songs_download_page(playlist_name=None, href=None):
    if playlist_name:
        href = request.args.get('href')
    if playlist_name is not None:
        category = playlist_name.replace('-', ' ')
    else:
        category = get_category_from_route(request.path)

    if 'access_token' in session:
        refresh_token_if_expired()
        return render_template('/download pages/download-songs.html', category=category, href=href)
    else:
        session.clear() 
        return redirect(url_for('login'))


@app.route('/<album_name>-album/', endpoint='album-download-page')
def saved_album_songs(album_name):
    href = request.args.get('href')
    album_url = request.args.get('album_url')
    album_image = request.args.get('album_image')
    if 'access_token' in session:
        refresh_token_if_expired()
        return render_template('/download pages/saved-album-songs.html', href=href, album_name=album_name, album_url=album_url, album_image=album_image)
    else:
        session.clear() 
        return redirect(url_for('login'))


@app.route('/load-saved-playlists/', methods=['POST', 'GET'], endpoint="load-saved-playlists")
@app.route('/load-saved-albums/', methods=['POST', 'GET'], endpoint="load-saved-albums")
def load_saved_playlists():
    if request.path == '/load-saved-playlists/':
        html_page = 'saved-playlists.html'
    else:
        html_page = 'saved-albums.html'

    if 'access_token' in session:
        refresh_token_if_expired()
        if request.method == 'GET':
            return render_template(f'/download pages/{html_page}')
        else:

            if request.path == '/load-saved-playlists/':
                href, playlist_name = request.form.to_dict()['data'].split(',')
                playlist_name = playlist_name.replace(' ', '-')
                return redirect(url_for('playlist-download-page', href=href, playlist_name=playlist_name))
            else:
                href, album_name, album_url, album_image = request.form.to_dict()['data'].split(',')
                album_name = album_name.replace(' ', '-')
                return redirect(url_for('album-download-page', href=href, album_name=album_name, album_url=album_url, album_image=album_image))
    else:
        session.clear()
        return redirect(url_for('login'))


@app.route('/load-api-data/')
def load_song_data():
    if 'access_token' in session:
        refresh_token_if_expired()
        if request.args:
            offset = int(request.args.get("offset"))
            limit = int(request.args.get("limit")) 
            url = str(request.args.get("url")) # gets url for sepecific category 
            #after = int(time.mktime((datetime.datetime.now()-timedelta(days=5)).timetuple())) # used for recently played but there is a problem with that api request rn so not gonna pass it wit the url

            data = get_api_request(url, limit=limit, offset=offset)
            return make_response(jsonify(data['items']), 200)
    else:
        return make_response(jsonify(['logout']), 200)
            

@app.route('/download-song/')
def download_song():
    if 'access_token' in session:
        refresh_token_if_expired()
        if request.args:
            song = string_parser(str(request.args.get('song')))
            artists = string_parser(str(request.args.get('artists')))
            search_query = f'{song} {artists} lyrics'
            directory = os.path.join(os.getcwd(), 'temp', search_query+'.mp3')

            if not os.path.isfile(directory):
                url = VideosSearch(search_query, limit=1).result()['result'][0]['link']
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': f'{directory}',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }],
                }     
                
                while True:
                    try:
                        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                            ydl.download([url])
                        break
                    except youtube_dl.utils.DownloadError as exc:
                        print(f'error {exc}')
                        print(f'trying to download {song} {artists} again')
                    

            return send_file(directory, as_attachment=True)
    else:
        return redirect(url_for('login'))


@app.route('/attribution/')
def attribution():
    return render_template('attribution.html')


# SPOTIFY API HELPER FUNCTIONS 

def get_api_request(url, **kwargs):
    headers = headers={"Content-Type": "application/json", "Authorization": f"Bearer {session['access_token']}"}
    res = requests.get(url, headers=headers, params=kwargs).json()
    return res


def spotify_callback():
    code = request.args.get('code')
    redirect_uri = base_url + url_for('inventory')
    response = requests.post("https://accounts.spotify.com/api/token", data={
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri,
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret
    }).json()
    
    if response.get('error') is None:
        session['access_token'] = response.get('access_token')
        session['refresh_token'] = response.get('refresh_token')
        session['token_type'] = response.get('token_type')
        session['expires_at'] = (datetime.datetime.now() + timedelta(seconds=response.get('expires_in'))).replace(tzinfo=utc)
        session['user-name'] = get_api_request("https://api.spotify.com/v1/me")['display_name']
        session['user-id'] = get_api_request("https://api.spotify.com/v1/me")['id']

    else:
        print(f'\n\nerror: {response.get("error")}') # todo
        print(response)


def refresh_token_if_expired():
    if (session['expires_at']).replace(tzinfo=utc) <= datetime.datetime.now().replace(tzinfo=utc):
        print('refreshing access token')
        response = requests.post("https://accounts.spotify.com/api/token", data={
            'grant_type': 'refresh_token',
            'refresh_token': session['refresh_token'],
            'client_id': client_id,
            'client_secret': client_secret
        }).json()


        if response.get('error') is None:
            session['access_token'] = response.get('access_token')
            session['token_type'] = response.get('token_type')
            session['expires_at'] = (datetime.datetime.now() + timedelta(seconds=response.get('expires_in'))).replace(tzinfo=utc)
        else:
            print(f'\n\nerror: {response.get("error")}') # todo
            print(response)
            session.clear()
            return redirect(url_for('login'))


# HELPER FUNCTIONS

def string_parser(string: str):
    string = string.replace('\\', ' ').replace('/', ' ').replace(':', ' ').replace('*', ' ').replace('?', ' ') \
            .replace('"', ' ').replace('<', ' ').replace('>', ' ').replace('|', ' ')
    return string

def get_category_from_route(route):
    if route == "/saved-songs-download/":
        return 'SAVED SONGS'
    elif route == "/top-songs-download/":
        return 'TOP SONGS'
    elif route == "/recently-played-songs-download/":
        return 'RECENTLY PLAYED SONGS'
    return Exception("category not found, must be a playlist or album name")


if __name__ == '__main__':
    app.run(host=private.ip, debug=True, threaded=True)
    #app.run(debug=True, threaded=True)