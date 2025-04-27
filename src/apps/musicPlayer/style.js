// --- Dynamic Song & Cover Loader ---

const SONGS_PATH = '/assets/apps/musicPlayer/songs/';
const COVERS_PATH = '/assets/apps/musicPlayer/covers/';

// Helper: Get file list from a directory (works if files are known or pre-listed)
// For demo, use a static list if directory is empty
const demoSongs = ['track1.wav', 'track2.wav', 'track3.wav', 'track4.wav'];
const demoCovers = ['cover1.webp', 'cover2.webp', 'cover3.webp', 'cover4.webp'];

// Add this after demoSongs and demoCovers
const demoSongInfo = [
  { band: 'The Gorillaz', song: '19-2000 (Soulchild Remix)' },
  { band: 'Chiddy Bang', song: 'Mind Your Manners' },
  { band: 'Kendrick Lamar', song: 'i' },
  { band: 'Jay-Z, Kanye West, Otis Redding', song: 'Otis' }
];

// If you have a manifest or can fetch file lists, replace this with a fetch or import
// Example: demoSongs = ['song1.mp3', 'song2.mp3'];
//          demoCovers = ['cover1.jpg', 'cover2.png'];

// For now, fallback to demo if empty
const songs = demoSongs.length ? demoSongs : [];
const covers = demoCovers.length ? demoCovers : [];

// Use demoSongInfo if available, otherwise fallback to filename
const songInfo = demoSongInfo.length ? demoSongInfo : songs.map((song, i) => ({
  band: 'Unknown Artist',
  song: song.replace(/\.[^/.]+$/, '')
}));

const audioContainer = document.getElementById('audio-container');
let audioPlayer = [];

function createAudioElements() {
  audioContainer.innerHTML = '';
  audioPlayer = songs.map((song, i) => {
    const audio = document.createElement('audio');
    audio.className = 'audioPlayer';
    audio.src = SONGS_PATH + song;
    audioContainer.appendChild(audio);
    return audio;
  });
}

// Album art logic
function getCover(i) {
  if (covers[i]) return COVERS_PATH + covers[i];
  return 'https://via.placeholder.com/300x300?text=No+Cover';
}

// --- UI/Playback Logic (existing code, adapted) ---

const play = document.querySelector('.play-btn')
const back = document.querySelector('.skip-left')
const forward = document.querySelector('.skip-right')
const volUp = document.querySelector('.vol-up')
const volDown = document.querySelector('.vol-down')
const controlBtn = document.querySelector('.btn-overlay')
const artwork = document.querySelector('.album-artwork')

const songTitle = document.querySelector('#song-title')
const artist = document.querySelector('#artist-name')

let songPlaying = 0

function setSongImg() {
  artwork.style.backgroundImage = `url(${getCover(songPlaying)})`
  songTitle.innerText = songInfo[songPlaying]?.song || 'No Song';
  artist.innerText = songInfo[songPlaying]?.band || '';
}

// --- Controls (existing code, adapted for dynamic audioPlayer) ---

play.addEventListener('click', function() {
  if (audioPlayer[songPlaying]) {
    audioPlayer[songPlaying].volume = 0.1;
    toggleAudio(songPlaying);
  }
});

play.addEventListener("mousedown", function() {
  play.classList.add('pressed')
});
play.addEventListener("mouseup", function() {
  play.classList.remove('pressed')
});

back.addEventListener('click', () => {
  if (songs.length === 0) return;
  if (songPlaying !== 0){
    songPlaying--
  } else{
    songPlaying = songs.length - 1;
  }
  if (audioPlayer[songPlaying]) {
    audioPlayer[songPlaying].volume = 0.1;
    toggleAudio(songPlaying);
    setSongImg();
  }
});
back.addEventListener('mousedown', function() {
  controlBtn.classList.add('left')
});
back.addEventListener('mouseup', function() {
  controlBtn.classList.remove('left')
});

forward.addEventListener('click', () => {
  if (songs.length === 0) return;
  if (songPlaying !== songs.length - 1){
    songPlaying++
  }else{
    songPlaying = 0 
  }
  if (audioPlayer[songPlaying]) {
    audioPlayer[songPlaying].volume = 0.1;
    setSongImg();
    toggleAudio(songPlaying);
  }
});
forward.addEventListener('mousedown', function() {
  controlBtn.classList.add('right')
});
forward.addEventListener('mouseup', function() {
  controlBtn.classList.remove('right')
});

volUp.addEventListener('click', (e) => {
  if (audioPlayer[songPlaying] && audioPlayer[songPlaying].volume < 1) {
    audioPlayer[songPlaying].volume += 0.1;
  }
});
volUp.addEventListener('mousedown', function() {
  controlBtn.classList.add('up')
});
volUp.addEventListener('mouseup', function() {
  controlBtn.classList.remove('up')
});

volDown.addEventListener('click', (e) => {
  if (audioPlayer[songPlaying] && audioPlayer[songPlaying].volume > 0.1) {
    audioPlayer[songPlaying].volume -= 0.1;
  }
});
volDown.addEventListener('mousedown', function() {
  controlBtn.classList.add('down')
});
volDown.addEventListener('mouseup', function() {
  controlBtn.classList.remove('down')
});

let playingAudio = null;
function toggleAudio(idx) {
  if (playingAudio !== null && playingAudio !== audioPlayer[idx]) {
    playingAudio.pause();
  }
  if (audioPlayer[idx].paused) {
    audioPlayer[idx].play();
    playingAudio = audioPlayer[idx];
  } else {
    audioPlayer[idx].pause();
    playingAudio = null;
  }
}

// --- Initialize ---
createAudioElements();
setSongImg();
