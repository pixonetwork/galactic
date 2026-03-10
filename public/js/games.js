"use strict";
async function initGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    try {
        const response = await fetch('/games.json');
        const games = await response.json();
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card shiny';
            const imgPath = game.url.replace('.html', '.png');
            card.innerHTML = `
                <img src="images/${imgPath}" class="game-img" onerror="this.src='bg.png'">
                <div class="game-name-overlay">${game.name.toUpperCase()}</div>
            `;
            card.onclick = () => {
                switchView('browser');
                window.launchGame(game.url, game.name);
            };
            grid.appendChild(card);
        });
    } catch (e) {}
}
window.switchView = function(viewId) {
    const loader = document.getElementById('global-loader');
    loader.classList.add('active');
    setTimeout(() => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        setTimeout(() => loader.classList.remove('active'), 500);
    }, 600);
};
document.addEventListener('DOMContentLoaded', initGames);
