# Welcome to Spotify2Mp3
Spotify2Mp3 is a website where you can download songs from you're spotify account
![image](https://user-images.githubusercontent.com/62020687/126032570-809d3b55-809e-4974-bf86-6562b33326fb.png)

## Languages
This is a basic/experimental website which uses Python(flask) as a backend and html, css, and Javascript on the frontend . 

## Description
The goal of this website is that you will sign into your Spotify account and you will be taken to the inventory page
where you will see 5 buttons (saved songs, top songs, recent songs, saved playlists, and saved albums). You can then 
press any of them and will be redirected to a page which displays the information of the songs in a table format. From
there you willbe able to download any song you choose or you can press the download all button to, well, download all
the songs. 

## Implementation 
I use the Spotify api in order to get the user's data, then I used youtube_dl in order to download the the audio of the songs from youtube videos, and used a third party 
module in order to search for the urls of the youtube vidoes. 

## Future Features
In the future I plan on writing my own "youtube scrapper" in order to search for the song urls on youtube.
