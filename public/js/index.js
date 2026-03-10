"use strict";
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
    files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" },
});
scramjet.init();

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
    const activeTab = document.querySelector('.tab.active');
    const tabId = activeTab.id;
    if (tabStore[tabId].controller) tabStore[tabId].controller.frame.remove();
    const frame = document.createElement('iframe');
    document.getElementById('viewport').appendChild(frame);
    tabStore[tabId].controller = { frame: frame, go: (u) => frame.src = u };
    tabStore[tabId].url = name.toUpperCase();
    frame.src = `/games/${urlPath}`;
    updateTabMetadata(tabId, name, name, false);
};

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab || !address.value) return;
    try {
        await registerSW();
        let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
        const url = search(address.value, "https://www.google.com/search?q=%s");
        let frameObj = tabStore[activeTab.id].controller?.go ? tabStore[activeTab.id].controller : scramjet.createFrame();
        if (!tabStore[activeTab.id].controller?.go) {
            tabStore[activeTab.id].controller = frameObj;
            document.getElementById('viewport').appendChild(frameObj.frame);
        }
        frameObj.frame.style.visibility = 'visible';
        await frameObj.go(url);
    } catch (err) { console.error(err); }
});
