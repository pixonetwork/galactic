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
            const imgName = game.url.replace('.html', '.png');

            card.innerHTML = `
                <img src="images/${imgName}" class="game-img" onerror="this.src='bg.png'">
                <div class="game-name-overlay">${game.name.toUpperCase()}</div>
            `;
            
            card.onclick = () => {
                switchView('browser');
                window.launchGame(game.url, game.name);
            };
            grid.appendChild(card);
        });
    } catch (e) { console.error(e); }
    
    setTimeout(() => document.getElementById('global-loader').classList.add('hidden'), 1000);
}

window.switchView = function(viewId) {
    const loader = document.getElementById('global-loader');
    loader.classList.remove('hidden');

    setTimeout(() => {
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none';
        });

        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.style.display = 'block';
            target.classList.add('active');
        }
        setTimeout(() => loader.classList.add('hidden'), 500);
    }, 400);
};

document.addEventListener('DOMContentLoaded', initGames);
