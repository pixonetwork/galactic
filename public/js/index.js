"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const loader = document.getElementById("loading-overlay");

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
    files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" },
});

scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let transportInitialized = false;

// --- ABOUT:BLANK GAME LAUNCHER ---
function launchGame(urlPath, name) {
    const fullUrl = `https://www.linkyhost.com/api/view/this-website-is-so-cool/${urlPath}`;

    // 1. Open the stealth window
    const win = window.open('about:blank', '_blank');
    if (!win) {
        alert('POPUP_BLOCKED: Please enable popups to launch Galactic nodes.');
        return;
    }

    // 2. Technical Cloaking Logic
    win.document.title = `${name.toUpperCase()} // GALACTIC`;
    
    const iframe = win.document.createElement('iframe');
    const style = iframe.style;
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.width = '100vw';
    style.height = '100vh';
    style.border = 'none';
    style.background = '#000';
    
    iframe.src = fullUrl;
    
    win.document.body.appendChild(iframe);
    win.document.body.style.margin = '0';
}

// --- NAVIGATION ---
window.navBack = () => {
    const activeTab = document.querySelector('.tab.active');
    const data = tabStore[activeTab?.id];
    if (data?.controller?.frame) { try { data.controller.frame.contentWindow.history.back(); } catch (e) {} }
};
window.navForward = () => {
    const activeTab = document.querySelector('.tab.active');
    const data = tabStore[activeTab?.id];
    if (data?.controller?.frame) { try { data.controller.frame.contentWindow.history.forward(); } catch (e) {} }
};
window.navReload = () => {
    const activeTab = document.querySelector('.tab.active');
    const data = tabStore[activeTab?.id];
    if (data?.controller?.frame) {
        const currentSrc = data.controller.frame.src;
        data.controller.frame.src = "about:blank";
        setTimeout(() => data.controller.frame.src = currentSrc, 10);
    }
};

function getCleanUrl(proxyUrl) {
    try {
        const urlObj = new URL(proxyUrl);
        if (urlObj.pathname.includes('/scramjet/')) {
            let encoded = urlObj.pathname.split('/scramjet/')[1];
            let decoded = decodeURIComponent(encoded);
            if (!decoded.startsWith('http')) { try { decoded = atob(encoded); } catch(e) {} }
            return decoded;
        }
        return proxyUrl;
    } catch (e) { return proxyUrl; }
}

async function initGames() {
    const grid = document.getElementById('games-grid');
    try {
        const response = await fetch('/games.json');
        const games = await response.json();
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `<div class="game-name">${game.name}</div><div class="game-status">STEALTH_READY</div>`;
            card.onclick = () => launchGame(game.url, game.name);
            grid.appendChild(card);
        });
    } catch (e) {}
}

function startMetadataTracker(tabId, iframe) {
    const data = tabStore[tabId];
    if (data.interval) clearInterval(data.interval);
    data.interval = setInterval(() => {
        try {
            const win = iframe.contentWindow;
            const doc = win.document;
            if (doc.title && doc.title !== data.title && doc.title !== "about:blank") {
                updateTabMetadata(tabId, undefined, doc.title, undefined);
            }
            const cleanUrl = getCleanUrl(win.location.href);
            if (cleanUrl && cleanUrl !== data.url && !cleanUrl.includes('about:blank')) {
                updateTabMetadata(tabId, cleanUrl, undefined, undefined);
            }
        } catch (e) {}
    }, 800);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab || !address.value) return;
    const tabId = activeTab.id;

    if (address.value.startsWith('galactic://')) { loadInternal(address.value); return; }

    loader.classList.add('active');
    updateTabMetadata(tabId, address.value, "DECRYPTING..", true);

    try {
        await registerSW();
        if (!transportInitialized) {
            let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
            await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
            transportInitialized = true;
        }

        const url = search(address.value, searchEngine.value);
        let frameObj;

        if (tabStore[tabId].controller && tabStore[tabId].controller.go) {
            frameObj = tabStore[tabId].controller;
        } else {
            frameObj = scramjet.createFrame();
            tabStore[tabId].controller = frameObj;
            document.getElementById('viewport').appendChild(frameObj.frame);
        }

        document.getElementById('newtab-view').style.display = 'none';
        frameObj.frame.style.visibility = 'visible';
        
        await frameObj.go(url);
        startMetadataTracker(tabId, frameObj.frame);

        setTimeout(() => {
            updateTabMetadata(tabId, undefined, undefined, false);
            loader.classList.remove('active');
        }, 1000);
    } catch (err) {
        updateTabMetadata(tabId, address.value, "ERROR", false);
        loader.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', initGames);