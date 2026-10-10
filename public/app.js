const API_BASE = '';

const platformPatterns = [
    { name: 'youtube', api: 'youtube', pattern: /(?:youtube\.com|youtu\.be)/i, icon: 'fab fa-youtube' },
    { name: 'tiktok', api: 'tiktok', pattern: /tiktok\.com/i, icon: 'fab fa-tiktok' },
    { name: 'instagram', api: 'meta', pattern: /instagram\.com/i, icon: 'fab fa-instagram' },
    { name: 'facebook', api: 'meta', pattern: /facebook\.com|fb\.watch|fb\.com/i, icon: 'fab fa-facebook' },
    { name: 'twitter', api: 'twitter', pattern: /(?:twitter\.com|x\.com)/i, icon: 'fab fa-x-twitter' },
    { name: 'spotify', api: 'spotify', pattern: /spotify\.com/i, icon: 'fab fa-spotify' },
    { name: 'reddit', api: 'reddit', pattern: /reddit\.com/i, icon: 'fab fa-reddit' },
    { name: 'pinterest', api: 'pinterest', pattern: /pinterest\./i, icon: 'fab fa-pinterest' },
    { name: 'snapchat', api: 'snapchat', pattern: /snapchat\.com/i, icon: 'fab fa-snapchat' },
    { name: 'linkedin', api: 'linkedin', pattern: /linkedin\.com/i, icon: 'fab fa-linkedin' },
    { name: 'soundcloud', api: 'soundcloud', pattern: /soundcloud\.com/i, icon: 'fab fa-soundcloud' },
    { name: 'dailymotion', api: 'dailymotion', pattern: /dailymotion\.com|dai\.ly/i, icon: 'fas fa-play' },
    { name: 'threads', api: 'threads', pattern: /threads\.net/i, icon: 'fas fa-at' },
    { name: 'bluesky', api: 'bluesky', pattern: /bsky\.app/i, icon: 'fas fa-cloud' },
    { name: 'douyin', api: 'douyin', pattern: /douyin\.com/i, icon: 'fas fa-music' },
    { name: 'kuaishou', api: 'kuaishou', pattern: /kuaishou\.com/i, icon: 'fas fa-video' },
    { name: 'tumblr', api: 'tumblr', pattern: /tumblr\.com/i, icon: 'fab fa-tumblr' },
    { name: 'terabox', api: 'terabox', pattern: /terabox\.com|1024terabox|freemibox/i, icon: 'fas fa-box' },
    { name: 'capcut', api: 'capcut', pattern: /capcut\.com/i, icon: 'fas fa-scissors' },
];

let downloadHistory = [];
let currentFilter = 'all';

function detectPlatform(url) {
    for (const platform of platformPatterns) {
        if (platform.pattern.test(url)) {
            return platform;
        }
    }
    return { name: 'other', api: null, icon: 'fas fa-globe' };
}

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

let historyTotal = 0;
let useLocalFallback = false;
const PAGE_SIZE = 20;
let currentPage = 1;
let totalPages = 1;

function loadLocalHistory() {
    try {
        const saved = localStorage.getItem('downloadHistory');
        const all = saved ? JSON.parse(saved) : [];
        historyTotal = all.length;
        totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * PAGE_SIZE;
        downloadHistory = all.slice(start, start + PAGE_SIZE);
    } catch (e) {
        downloadHistory = [];
        historyTotal = 0;
        totalPages = 1;
    }
    renderHistory();
}

async function loadHistory(page = currentPage) {
    currentPage = Math.max(1, page);
    try {
        const offset = (currentPage - 1) * PAGE_SIZE;
        const res = await fetch(`/api/history?platform=${encodeURIComponent(currentFilter)}&limit=${PAGE_SIZE}&offset=${offset}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'API error');
        downloadHistory = json.data.items;
        historyTotal = json.data.total;
        totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));
        if (currentPage > totalPages) {
            currentPage = totalPages;
            return loadHistory(currentPage);
        }
        useLocalFallback = false;
        renderHistory();
        migrateLocalHistory();
    } catch (e) {
        // Sin backend disponible: seguir con localStorage
        useLocalFallback = true;
        loadLocalHistory();
    }
}

function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    loadHistory(page);
    document.querySelector('.history-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveHistory() {
    if (!useLocalFallback) return;
    try {
        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory.slice(0, 200)));
    } catch (e) { /* almacenamiento lleno o bloqueado */ }
}

// Migra una sola vez el historial viejo de localStorage a SQLite
let migrationDone = false;
async function migrateLocalHistory() {
    if (migrationDone || historyTotal > 0) return;
    migrationDone = true;
    try {
        const saved = localStorage.getItem('downloadHistory');
        const items = saved ? JSON.parse(saved) : [];
        if (!items.length) return;
        await Promise.all(items.map((item) =>
            fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            })
        ));
        localStorage.removeItem('downloadHistory');
        loadHistory();
    } catch (e) { /* migración opcional, se ignora */ }
}

async function addToHistory(item) {
    if (useLocalFallback) {
        try {
            const saved = localStorage.getItem('downloadHistory');
            const all = saved ? JSON.parse(saved) : [];
            all.unshift(item);
            localStorage.setItem('downloadHistory', JSON.stringify(all.slice(0, 200)));
        } catch (e) { /* almacenamiento lleno o bloqueado */ }
        currentPage = 1;
        loadLocalHistory();
        return;
    }
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
    } catch (e) { /* se muestra igual con recarga */ }
    loadHistory(1);
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const countEl = document.getElementById('historyCount');

    if (historyTotal > 0) {
        const start = (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, historyTotal);
        countEl.textContent = `${start}-${end} de ${historyTotal} · Pág. ${currentPage}/${totalPages}`;
    } else {
        countEl.textContent = '';
    }

    if (downloadHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-history"><i class="fas fa-inbox"></i><p>No hay descargas aún</p></div>';
        renderPagination();
        return;
    }

    historyList.innerHTML = downloadHistory.map((item) => `
        <div class="history-item">
            <div class="history-item-icon ${escapeHtml(item.platform)}">
                <i class="${escapeHtml(item.icon)}"></i>
            </div>
            <div class="history-item-info">
                <div class="history-item-title">${escapeHtml(item.title || 'Sin título')}</div>
                <div class="history-item-url">${escapeHtml(item.url)}</div>
            </div>
            <div class="history-item-date">${escapeHtml(item.date || '')}</div>
        </div>
    `).join('');
    renderPagination();
}

function renderPagination() {
    const el = document.getElementById('historyPagination');
    if (!el) return;
    if (totalPages <= 1) {
        el.innerHTML = '';
        return;
    }

    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    for (let p = start; p <= end; p++) pages.push(p);

    el.innerHTML = `
        <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹ Anterior</button>
        ${pages.map((p) => `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`).join('')}
        <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente ›</button>
    `;
    el.querySelectorAll('.page-btn').forEach((btn) => {
        btn.addEventListener('click', () => goToPage(Number(btn.dataset.page)));
    });
}

function showPlatformBadge(platform) {
    const badge = document.getElementById('platformBadge');
    badge.classList.remove('hidden');
    const label = platform.name.charAt(0).toUpperCase() + platform.name.slice(1);
    badge.innerHTML = `<i class="${escapeHtml(platform.icon)}"></i><span>${escapeHtml(label)}</span>`;
}

function hidePlatformBadge() {
    document.getElementById('platformBadge').classList.add('hidden');
}

function showLoading() {
    document.getElementById('loadingSection').classList.remove('hidden');
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('errorSection').classList.add('hidden');
    document.getElementById('downloadBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loadingSection').classList.add('hidden');
    document.getElementById('downloadBtn').disabled = false;
}

function showError(message) {
    hideLoading();
    const errorSection = document.getElementById('errorSection');
    document.getElementById('errorMessage').textContent = message;
    errorSection.classList.remove('hidden');
}

function getTitle(data) {
    const raw = data.title || data.desc || data.caption || data.text || data.author || data.owner || data.username || 'Sin título';
    const clean = String(raw).replace(/^ssstik\.io_?/i, "").trim();
    return clean || 'Sin título';
}

function getThumbnail(data) {
    const t = data.thumbnail || data.thumb || data.cover || data.image || data.picture || data.avatar || '';
    if (Array.isArray(t)) return t[0] || '';
    if (typeof t === 'object' && t !== null) return t.url || '';
    return typeof t === 'string' ? t : '';
}

function collectDownloadLinks(data) {
    const links = [];
    const seen = new Set();

    function labelFor(obj) {
        const parts = [];
        if (obj.text) parts.push(obj.text);
        if (obj.quality) parts.push(obj.quality);
        if (obj.format) parts.push(obj.format);
        if (obj.type) parts.push(obj.type);
        if (obj.qualityLabel) parts.push(obj.qualityLabel);
        if (obj.resolution) parts.push(obj.resolution);
        return parts.join(' · ') || 'Descargar';
    }

    function push(url, label) {
        if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return;
        if (seen.has(url)) return;
        seen.add(url);
        links.push({ url, label: label || 'Descargar' });
    }

    function walk(node) {
        if (!node) return;
        if (typeof node === 'string') {
            if (/^https?:\/\//i.test(node) && /\.(mp4|mp3|m4a|webm|mov|avi|mkv|jpg|jpeg|png|webp|gif)(\?|$)/i.test(node)) {
                push(node, 'Archivo');
            }
            return;
        }
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (typeof node === 'object') {
            const urlKeys = ['download_url', 'downloadUrl', 'download_link', 'url', 'link', 'href', 'src', 'file', 'media_url'];
            for (const k of urlKeys) {
                if (typeof node[k] === 'string' && /^https?:\/\//i.test(node[k])) {
                    if (/thumbnail|thumb|avatar|cover|image|picture/i.test(k) && node[k].length < 500) {
                        // Podría ser miniatura, igual se agrega solo si no hay otros links
                        continue;
                    }
                    push(node[k], labelFor(node));
                }
            }
            Object.values(node).forEach(walk);
        }
    }

    ['videos', 'audios', 'downloads', 'formats', 'medias', 'links', 'resources', 'files', 'results'].forEach((k) => {
        if (data && data[k]) walk(data[k]);
    });

    if (links.length === 0 && data) walk(data);

    return links.slice(0, 30);
}

function showResult(data, platform, originalUrl) {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('hidden');

    const thumbnail = getThumbnail(data);
    const title = getTitle(data);
    const thumbEl = document.getElementById('resultThumbnail');
    if (thumbnail && /^https?:\/\//i.test(thumbnail)) {
        thumbEl.src = thumbnail;
        thumbEl.style.display = 'block';
    } else {
        thumbEl.style.display = 'none';
    }

    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultPlatform').textContent =
        platform.name.charAt(0).toUpperCase() + platform.name.slice(1);

    const links = collectDownloadLinks(data);
    const listEl = document.getElementById('downloadList');
    if (links.length === 0) {
        listEl.innerHTML = '<p class="no-links">No se encontraron enlaces directos. Revisa el detalle JSON abajo.</p>';
    } else {
        listEl.innerHTML = links.map((l) => `
            <a href="${escapeHtml(l.url)}" class="btn-download" target="_blank" rel="noopener">
                <i class="fas fa-download"></i> ${escapeHtml(l.label)}
            </a>
        `).join('');
    }

    document.getElementById('rawJson').textContent = JSON.stringify(data, null, 2);

    addToHistory({
        url: originalUrl,
        title: title,
        platform: platform.name,
        icon: platform.icon,
        thumbnail: thumbnail || null,
        date: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    });
}

async function downloadVideo() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
        showError('Por favor, pega un enlace.');
        return;
    }

    const platform = detectPlatform(url);
    showPlatformBadge(platform);

    if (!platform.api) {
        showError('Plataforma no soportada. Prueba con YouTube, TikTok, Instagram, Facebook, Twitter/X, Spotify, etc.');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`/api/${platform.api}/download?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.success) {
            hideLoading();
            showResult(data.data, platform, url);
        } else {
            showError(data.error || 'Error desconocido del servidor.');
        }
    } catch (error) {
        showError('No se pudo conectar con el servidor. ¿Está corriendo en el puerto 3000? (' + error.message + ')');
    } finally {
        hideLoading();
        document.getElementById('resultSection').classList.toggle('hidden', document.getElementById('downloadList').innerHTML === '' && document.getElementById('errorSection').classList.contains('hidden') === false);
    }
}

function init() {
    loadHistory();

    document.getElementById('downloadBtn').addEventListener('click', downloadVideo);

    document.getElementById('urlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') downloadVideo();
    });

    document.getElementById('urlInput').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) showPlatformBadge(detectPlatform(url));
        else hidePlatformBadge();
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadHistory(1);
        });
    });

    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            const scope = currentFilter === 'all' ? 'todo el historial' : `el historial de ${currentFilter}`;
            if (!confirm(`¿Borrar ${scope}?`)) return;
            if (useLocalFallback) {
                try {
                    localStorage.removeItem('downloadHistory');
                } catch (e) { /* ignorar */ }
                currentPage = 1;
                loadLocalHistory();
                return;
            }
            try {
                await fetch(`/api/history?platform=${encodeURIComponent(currentFilter)}`, { method: 'DELETE' });
            } catch (e) { /* igual se recarga */ }
            loadHistory(1);
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
