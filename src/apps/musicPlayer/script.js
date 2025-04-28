// --- Dynamic Song & Cover Loader ---

const SONGS_PATH = '../../../assets/apps/musicPlayer/songs/';
const COVERS_PATH = '../../../assets/apps/musicPlayer/covers/';

// Helper: Get file list from a directory (works if files are known or pre-listed)
// For demo, use a static list if directory is empty
const demoSongs = ['track1.mp3', 'track2.mp3', 'track3.mp3', 'track4.mp3'];
const demoCovers = ['cover1.webp', 'cover2.webp', 'cover3.webp', 'cover4.webp'];

// Add this after demoSongs and demoCovers
const demoSongInfo = [
  { band: 'The Gorillaz', song: '19-2000 (Soulchild Remix)' },
  { band: 'Chiddy Bang', song: 'Mind Your Manners' },
  { band: 'Kendrick Lamar', song: 'i' },
  { band: 'Chance the Rapper', song: 'Juice' }
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
let preloadedAudio = null;
let audioPlayer = null; // The one used in the player
let currentAudioIndex = null;

// Preload the first song as soon as the page loads
function preloadAudio(idx) {
  preloadedAudio = document.createElement('audio');
  preloadedAudio.src = SONGS_PATH + songs[idx];
  preloadedAudio.preload = 'auto';
  preloadedAudio.volume = 0.1;
  // Not attached to DOM yet
}

// When the player is opened, move the preloaded audio into the DOM
function attachPreloadedAudio() {
  if (!preloadedAudio) return;
  audioContainer.innerHTML = '';
  audioPlayer = preloadedAudio;
  audioPlayer.className = 'audioPlayer';
  audioContainer.appendChild(audioPlayer);
  preloadedAudio = null; // Clear reference
}

// If the user changes song before opening, update the preloaded audio
function updatePreload(idx) {
  if (preloadedAudio) {
    preloadedAudio.src = SONGS_PATH + songs[idx];
  }
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
  if (audioPlayer) {
    setAudioSource(songPlaying);
  } else {
    updatePreload(songPlaying);
  }
}

function setAudioSource(idx) {
  if (!audioPlayer) return;
  audioPlayer.src = SONGS_PATH + songs[idx];
  currentAudioIndex = idx;
}

// --- Controls (existing code, adapted for dynamic audioPlayer) ---

play.addEventListener('click', function() {
  if (audioPlayer) {
    audioPlayer.volume = 0.1;
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
  setSongImg();
  if (audioPlayer) {
    audioPlayer.volume = 0.1;
    toggleAudio(songPlaying);
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
  setSongImg();
  if (audioPlayer) {
    audioPlayer.volume = 0.1;
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
  if (audioPlayer && audioPlayer.volume < 1) {
    audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.1);
  }
});
volUp.addEventListener('mousedown', function() {
  controlBtn.classList.add('up')
});
volUp.addEventListener('mouseup', function() {
  controlBtn.classList.remove('up')
});

volDown.addEventListener('click', (e) => {
  if (audioPlayer && audioPlayer.volume > 0.1) {
    audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.1);
  }
});
volDown.addEventListener('mousedown', function() {
  controlBtn.classList.add('down')
});
volDown.addEventListener('mouseup', function() {
  controlBtn.classList.remove('down')
});

function toggleAudio(idx) {
  if (!audioPlayer) return;
  if (currentAudioIndex !== idx) {
    setAudioSource(idx);
  }
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
}

// --- Preload audio on page load ---
preloadAudio(songPlaying);

// --- Attach preloaded audio when player becomes visible ---
const playerEl = document.querySelector('.music-player');
if (playerEl) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        playerEl.style.visibility === 'visible' &&
        !audioPlayer
      ) {
        attachPreloadedAudio();
        setAudioSource(songPlaying); // Ensure correct song is set
      }
    });
  });
  observer.observe(playerEl, { attributes: true, attributeFilter: ['style'] });
}

// --- Initialize song info and cover ---
setSongImg();

window.addEventListener('message', (event) => {
  if (event.data?.type === 'pauseMusic') {
    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
    }
  }
}); 