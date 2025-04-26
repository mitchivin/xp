// Balloon Tooltip Demo JS
let balloonTimeouts = [];
function showBalloon() {
  clearBalloon();
  const root = document.getElementById('balloon-root');
  const balloon = document.createElement('div');
  balloon.className = 'balloon';
  balloon.innerHTML = `
    <button class="balloon__close" aria-label="Close"></button>
    <div class="balloon__header">
      <img class="balloon__header__img" src="risk.png" alt="risk" />
      <span class="balloon__header__text">Your computer might be at risk</span>
    </div>
    <p class="balloon__text__first">Antivirus software might not be installed</p>
    <p class="balloon__text__second">Click this balloon to fix this problem.</p>
  `;
  // Close button
  balloon.querySelector('.balloon__close').onclick = () => hideBalloon();
  // Balloon click (simulate action)
  balloon.onclick = (e) => {
    if (!e.target.classList.contains('balloon__close')) {
      alert('Balloon clicked!');
    }
  };
  root.appendChild(balloon);
  // Show/fade logic
  balloonTimeouts.push(setTimeout(() => balloon.classList.remove('hide'), 10));
  balloonTimeouts.push(setTimeout(() => balloon.classList.add('hide'), 15000));
  balloonTimeouts.push(setTimeout(() => hideBalloon(), 16000));
}
function hideBalloon() {
  const root = document.getElementById('balloon-root');
  const balloon = root.querySelector('.balloon');
  if (balloon) {
    balloon.classList.add('hide');
    balloonTimeouts.push(setTimeout(() => clearBalloon(), 1000));
  }
}
function clearBalloon() {
  balloonTimeouts.forEach(t => clearTimeout(t));
  balloonTimeouts = [];
  const root = document.getElementById('balloon-root');
  root.innerHTML = '';
}
// Show balloon automatically after 3 seconds
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(showBalloon, 3000);
});
