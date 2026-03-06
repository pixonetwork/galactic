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

// Decodes the long Scramjet path so the URL bar looks clean (Google.com)
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

// INTEGRATED GAME LAUNCHER: Loads local games into the browser window tabs
function launchGame(urlPath, name) {
    const activeTab = document.querySelector('.tab.active');
    const tabId = activeTab.id;
    const localUrl = `/games/${urlPath}`;

    loader.classList.add('active');
    updateTabMetadata(tabId, name.toUpperCase(), name.toUpperCase(), true);

    // Wipe current frame if it exists
    if (tabStore[tabId].controller && tabStore[tabId].controller.frame) {
        tabStore[tabId].controller.frame.remove();
    }

    // Create local iframe in the HUD viewport
    const frame = document.createElement('iframe');
    frame.id = "sj-frame"; 
    document.getElementById('viewport').appendChild(frame);

    // Link to Tab Manager
    tabStore[tabId].controller = { frame: frame, go: (u) => frame.src = u };
    tabStore[tabId].url = name.toUpperCase();

    document.getElementById('games-view').style.display = 'none';
    document.getElementById('newtab-view').style.display = 'none';
    frame.style.visibility = 'visible';
    frame.src = localUrl;

    setTimeout(() => {
        updateTabMetadata(tabId, name.toUpperCase(), name.toUpperCase(), false);
        loader.classList.remove('active');
    }, 800);
}

// REAL-TIME SYNC: Keeps URL bar and Tab titles updated while browsing
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
            const ver = Math.floor(Math.random() * 9999);
            await connection.setTransport(`/libcurl/index.mjs?v=${ver}`, [{ websocket: wispUrl }]);
            transportInitialized = true;
        }

        const url = search(address.value, searchEngine.value);
        let frameObj;

        // Reset frame if coming from a local game
        if (tabStore[tabId].controller && tabStore[tabId].controller.frame.tagName === 'IFRAME' && !tabStore[tabId].controller.frame.id === "sj-frame") {
            tabStore[tabId].controller.frame.remove();
            tabStore[tabId].controller = null;
        }

        if (tabStore[tabId].controller && tabStore[tabId].controller.go) {
            frameObj = tabStore[tabId].controller;
        } else {
            frameObj = scramjet.createFrame();
            tabStore[tabId].controller = frameObj;
            document.getElementById('viewport').appendChild(frameObj.frame);
        }

        document.getElementById('newtab-view').style.display = 'none';
        document.getElementById('games-view').style.display = 'none';
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

async function initGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    try {
        const response = await fetch('/games.json');
        const games = await response.json();
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `<div class="game-name">${game.name}</div><div class="game-status">READY</div>`;
            card.onclick = () => launchGame(game.url, game.name);
            grid.appendChild(card);
        });
    } catch (e) {}
}
document.addEventListener('DOMContentLoaded', initGames);
