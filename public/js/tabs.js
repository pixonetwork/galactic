let tabCount = 0;
window.tabStore = {};

function addTab() {
    const tabList = document.getElementById('tab-list');
    tabCount++;
    const tabId = `tab-${tabCount}`;
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.id = tabId;
    tab.innerHTML = `
        <div class="tab-trapezoid"></div>
        <div class="tab-mini-ring"></div>
        <span class="tab-label">GALACTIC_NODE</span>
        <span class="tab-close" onclick="deleteTab(event, '${tabId}')">×</span>
    `;
    tab.onclick = () => switchTab(tabId);
    tabList.appendChild(tab);
    tabStore[tabId] = { controller: null, url: "galactic://new", title: "GALACTIC_NODE", loading: false, interval: null };
    switchTab(tabId);
}

function switchTab(id) {
    const data = tabStore[id];
    if (!data) return;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    const viewport = document.getElementById('viewport');
    viewport.querySelectorAll('iframe').forEach(f => f.style.visibility = 'hidden');
    document.getElementById('newtab-view').style.display = 'none';
    document.getElementById('games-view').style.display = 'none';

    if (data.url === "galactic://new") {
        document.getElementById('newtab-view').style.display = 'flex';
        document.getElementById('sj-address').value = "galactic://new";
    } else if (data.url === "galactic://games") {
        document.getElementById('games-view').style.display = 'block';
        document.getElementById('sj-address').value = "galactic://games";
    } else if (data.controller && data.controller.frame) {
        data.controller.frame.style.visibility = 'visible';
        document.getElementById('sj-address').value = data.url;
    }
}

window.loadInternal = (url) => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        updateTabMetadata(activeTab.id, url, url.replace('galactic://', '').toUpperCase(), false);
        switchTab(activeTab.id);
    }
};

function updateTabMetadata(id, url, title, isLoading) {
    const data = tabStore[id];
    const el = document.getElementById(id);
    if (!data || !el) return;
    if (url !== undefined) data.url = url;
    if (title !== undefined && title !== "") {
        data.title = title;
        el.querySelector('.tab-label').textContent = title.length > 15 ? title.substring(0, 15).toUpperCase() + ".." : title.toUpperCase();
    }
    if (isLoading !== undefined) {
        data.loading = isLoading;
        isLoading ? el.classList.add('loading') : el.classList.remove('loading');
    }
    if (el.classList.contains('active')) document.getElementById('sj-address').value = data.url;
}

function deleteTab(e, id) {
    e.stopPropagation();
    const data = tabStore[id];
    if (data?.interval) clearInterval(data.interval);
    if (data?.controller) data.controller.frame.remove();
    delete tabStore[id];
    document.getElementById(id).remove();
    const tabs = document.querySelectorAll('.tab');
    tabs.length > 0 ? switchTab(tabs[tabs.length - 1].id) : addTab();
}

// HUD NAVIGATION HANDLERS
window.navBack = () => {
    const frame = tabStore[document.querySelector('.tab.active')?.id]?.controller?.frame;
    if (frame) try { frame.contentWindow.history.back(); } catch(e) {}
};
window.navForward = () => {
    const frame = tabStore[document.querySelector('.tab.active')?.id]?.controller?.frame;
    if (frame) try { frame.contentWindow.history.forward(); } catch(e) {}
};
window.navReload = () => {
    const frame = tabStore[document.querySelector('.tab.active')?.id]?.controller?.frame;
    if (frame) {
        const s = frame.src; 
        frame.src = "about:blank"; 
        setTimeout(() => frame.src = s, 10); 
    }
};

window.onload = () => addTab();
