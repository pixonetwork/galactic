let tabCount = 0;
window.tabStore = {};

function addTab() {
    const tabList = document.getElementById('tab-list');
    tabCount++;
    const tabId = `tab-${tabCount}`;
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.id = tabId;
    tab.innerHTML = `<div class="tab-trapezoid"></div><div class="tab-mini-ring"></div><span class="tab-label">NEW NODE</span><span class="tab-close" onclick="deleteTab(event, '${tabId}')">×</span>`;
    tab.onclick = () => switchTab(tabId);
    tabList.appendChild(tab);
    tabStore[tabId] = { controller: null, url: "", title: "NEW NODE", loading: false, interval: null };
    switchTab(tabId);
}

function switchTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (document.getElementById(id)) document.getElementById(id).classList.add('active');
    document.getElementById('viewport').querySelectorAll('iframe').forEach(f => f.style.visibility = 'hidden');
    if (tabStore[id]?.controller) {
        tabStore[id].controller.frame.style.visibility = 'visible';
        document.getElementById('sj-address').value = tabStore[id].url;
    } else {
        document.getElementById('sj-address').value = "";
    }
}

function updateTabMetadata(id, url, title, isLoading) {
    const data = tabStore[id];
    const el = document.getElementById(id);
    if (!data || !el) return;
    if (url !== undefined) data.url = url;
    if (title !== undefined && title !== "") {
        data.title = title;
        el.querySelector('.tab-label').textContent = title.length > 12 ? title.substring(0, 12).toUpperCase() + ".." : title.toUpperCase();
    }
    if (isLoading !== undefined) isLoading ? el.classList.add('loading') : el.classList.remove('loading');
    if (el.classList.contains('active')) document.getElementById('sj-address').value = data.url;
}

function deleteTab(e, id) {
    e.stopPropagation();
    if (tabStore[id]?.controller) tabStore[id].controller.frame.remove();
    delete tabStore[id];
    document.getElementById(id).remove();
    const tabs = document.querySelectorAll('.tab');
    tabs.length > 0 ? switchTab(tabs[tabs.length - 1].id) : addTab();
}

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
    if (frame) { const s = frame.src; frame.src = "about:blank"; setTimeout(() => frame.src = s, 10); }
};

window.onload = () => addTab();
