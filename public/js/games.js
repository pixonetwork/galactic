"use strict";

async function initGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    try {
        const response = await fetch('/games.json');
        if (!response.ok) throw new Error("JSON_NOT_FOUND");
        
        const games = await response.json();

        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card shiny';
            
            // Map .html to .png
            const imgName = game.url.replace('.html', '.png');
            // If image is missing, it uses bg.png as a fallback
            const imgPath = `images/${imgName}`;

            card.innerHTML = `
                <img src="${imgPath}" class="game-img" onerror="this.src='bg.png'; this.onerror=null;">
                <div class="game-name-overlay">${game.name.toUpperCase()}</div>
            `;
            
            card.onclick = () => {
                switchView('browser');
                window.launchGame(game.url, game.name);
            };
            
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Uplink Error: Games list could not be retrieved.", e);
        grid.innerHTML = `<p style="color: var(--neon); text-align: center; width: 100%;">[ ERROR: DATA_LINK_OFFLINE ]</p>`;
    }
}

window.switchView = function(viewId) {
    const loader = document.getElementById('global-loader');
    loader.classList.add('active');

    setTimeout(() => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        setTimeout(() => loader.classList.remove('active'), 500);
    }, 600);
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initGames();
    
    // SAFETY TIMEOUT: Force hide the loader after 3 seconds no matter what
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader.classList.contains('active')) {
            console.log("Forcing loader hide...");
            loader.classList.remove('active');
        }
    }, 3000);
});
