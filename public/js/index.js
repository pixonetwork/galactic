"use strict";
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
    files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" },
});
scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let transportInitialized = false;

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

window.launchGame = function(urlPath, name) {
    const activeTab = document.querySelector('.tab.active') || { id: 'tab-1' };
    const tabId = activeTab.id;
    if (tabStore[tabId]?.controller) tabStore[tabId].controller.frame.remove();
    const frame = document.createElement('iframe');
    frame.id = "sj-frame"; 
    document.getElementById('viewport').appendChild(frame);
    tabStore[tabId].controller = { frame: frame, go: (u) => frame.src = u };
    tabStore[tabId].url = name.toUpperCase();
    frame.style.visibility = 'visible';
    frame.src = `/games/${urlPath}`;
    updateTabMetadata(tabId, name.toUpperCase(), name.toUpperCase(), false);
};

function startMetadataTracker(tabId, iframe) {
    const data = tabStore[tabId];
    if (data.interval) clearInterval(data.interval);
    data.interval = setInterval(() => {
        try {
            const win = iframe.contentWindow;
            const cleanUrl = getCleanUrl(win.location.href);
            if (cleanUrl && cleanUrl !== data.url && !cleanUrl.includes('about:blank')) {
                updateTabMetadata(tabId, cleanUrl, win.document.title, undefined);
            }
        } catch (e) {}
    }, 1000);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab || !address.value) return;
    const tabId = activeTab.id;
    try {
        await registerSW();
        if (!transportInitialized) {
            let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
            await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
            transportInitialized = true;
        }
        const url = search(address.value, searchEngine.value);
        let frameObj;
        if (tabStore[tabId].controller && tabStore[tabId].controller.go && tabStore[tabId].controller.frame.tagName !== 'IFRAME') {
            frameObj = tabStore[tabId].controller;
        } else {
            if (tabStore[tabId].controller) tabStore[tabId].controller.frame.remove();
            frameObj = scramjet.createFrame();
            tabStore[tabId].controller = frameObj;
            document.getElementById('viewport').appendChild(frameObj.frame);
        }
        frameObj.frame.style.visibility = 'visible';
        await frameObj.go(url);
        startMetadataTracker(tabId, frameObj.frame);
    } catch (err) { console.error(err); }
});
