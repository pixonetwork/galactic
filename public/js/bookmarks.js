"use strict";

const COOKIE_NAME = "vanguard_bookmarks";

function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/;SameSite=Lax";
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(cname) === 0) {
            try {
                return JSON.parse(c.substring(cname.length, c.length));
            } catch (e) {
                return [];
            }
        }
    }
    return [];
}

function addCurrentAsBookmark() {
    const address = document.getElementById('sj-address').value;
    if (!address) return;

    let bookmarks = getCookie(COOKIE_NAME);
    
    // Prevent duplicates
    if (bookmarks.find(b => b.url === address)) return;

    const name = address.replace(/^https?:\/\//, '').split('/')[0].toUpperCase();
    bookmarks.push({ name, url: address });
    
    setCookie(COOKIE_NAME, bookmarks);
    renderBookmarks();
    
    // Visual feedback
    document.getElementById('bookmark-btn').classList.add('active');
    setTimeout(() => document.getElementById('bookmark-btn').classList.remove('active'), 1000);
}

function deleteBookmark(index) {
    let bookmarks = getCookie(COOKIE_NAME);
    bookmarks.splice(index, 1);
    setCookie(COOKIE_NAME, bookmarks);
    renderBookmarks();
}

function renderBookmarks() {
    const bookmarks = getCookie(COOKIE_NAME);
    const bar = document.getElementById('bookmark-list');
    const grid = document.getElementById('bookmark-grid');

    bar.innerHTML = '';
    grid.innerHTML = '';

    bookmarks.forEach((b, i) => {
        // Render in Bar
        const barItem = document.createElement('div');
        barItem.className = 'bkm-item';
        barItem.textContent = b.name;
        barItem.onclick = () => {
            document.getElementById('sj-address').value = b.url;
            document.getElementById('sj-form').dispatchEvent(new Event('submit'));
        };
        bar.appendChild(barItem);

        // Render in Home Grid
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.innerHTML = `
            <span class="delete-bkm" onclick="event.stopPropagation(); deleteBookmark(${i})">×</span>
            <div class="bkm-name">${b.name}</div>
        `;
        gridItem.onclick = () => {
            document.getElementById('sj-address').value = b.url;
            document.getElementById('sj-form').dispatchEvent(new Event('submit'));
        };
        grid.appendChild(gridItem);
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', renderBookmarks);