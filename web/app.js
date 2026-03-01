/**
 * OSINT Tools Discovery — App Logic
 * Priority sort, sidebar, search, favicons, skeleton, keyboard shortcuts
 */
(function () {
    'use strict';

    const BATCH_SIZE = 60;
    const DEBOUNCE_MS = 200;
    const SKELETON_COUNT = 9;

    // Priority categories — these show first in "All Tools"
    const PRIORITY_CATS = [
        'Reconnaissance', 'Basic OSINT', 'Domain / IP / DNS', 'Search Engines',
        'Toolset', 'Threat Intelligence', 'OSINT Automation', 'Breaches & Leaks',
        'Malware', 'Darknet', 'IoT', 'Username', 'Email', 'Phone',
        'Images & Audio', 'Geolocation', 'Maps', 'Social Media'
    ];

    // DOM
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchKbd = document.getElementById('searchKbd');
    const themeToggle = document.getElementById('themeToggle');
    const toolCountEl = document.getElementById('toolCount');
    const categoryCountEl = document.getElementById('categoryCount');
    const sidebarList = document.getElementById('sidebarList');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    const backToTopBtn = document.getElementById('backToTop');
    const loadMoreSentinel = document.getElementById('loadMoreSentinel');

    // State
    let allTools = [];
    let filteredTools = [];
    let renderedCount = 0;
    let activeCategory = 'All';
    let searchTerm = '';
    let debounceTimer = null;
    let categoryTree = {};

    function init() {
        if (typeof TOOLS_DATA === 'undefined') {
            resultsGrid.innerHTML = '<p style="color:#f66;padding:40px;">Error: tools-data.js not found.</p>';
            return;
        }

        // Show skeleton while processing
        showSkeleton();

        // Init theme
        initTheme();

        // Sort tools: priority categories first
        allTools = sortByPriority(TOOLS_DATA);

        categoryTree = buildCategoryTree();
        const topCats = Object.keys(categoryTree);
        toolCountEl.textContent = allTools.length;
        categoryCountEl.textContent = topCats.length;

        renderSidebar(topCats);
        applyURLState();

        // Small delay to let skeleton render, then show real data
        requestAnimationFrame(() => {
            applyFilters();
        });

        // Events
        searchInput.addEventListener('input', onSearchInput);
        searchInput.addEventListener('keydown', onSearchKeydown);
        searchInput.addEventListener('focus', () => searchKbd && searchKbd.classList.add('hidden'));
        searchInput.addEventListener('blur', () => {
            if (!searchTerm && searchKbd) searchKbd.classList.remove('hidden');
        });
        searchClear.addEventListener('click', clearSearch);
        sidebarToggle.addEventListener('click', openSidebar);
        sidebarClose.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
        window.addEventListener('scroll', onScroll, { passive: true });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // Global keyboard shortcuts
        document.addEventListener('keydown', onGlobalKeydown);

        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);

        // Suggestion chip clicks (no-results state)
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const q = chip.getAttribute('data-query');
                searchInput.value = q;
                searchTerm = q;
                searchClear.classList.add('visible');
                if (searchKbd) searchKbd.classList.add('hidden');
                activeCategory = 'All';
                document.querySelectorAll('.sidebar-group-btn, .sidebar-child-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-cat') === 'All'));
                resultsTitle.textContent = 'All Tools';
                applyFilters();
                updateURL();
                searchInput.focus();
            });
        });

        setupIntersectionObserver();
    }

    // === Priority Sort ===
    function sortByPriority(tools) {
        const priorityMap = {};
        PRIORITY_CATS.forEach((cat, i) => priorityMap[cat] = i);
        const maxPriority = PRIORITY_CATS.length;

        return [...tools].sort((a, b) => {
            const aCat = a.category.split(' > ')[0];
            const bCat = b.category.split(' > ')[0];
            const aPri = priorityMap[aCat] !== undefined ? priorityMap[aCat] : maxPriority;
            const bPri = priorityMap[bCat] !== undefined ? priorityMap[bCat] : maxPriority;
            return aPri - bPri;
        });
    }

    // === Theme ===
    function initTheme() {
        const saved = localStorage.getItem('osint-theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('osint-theme', next);
    }

    // === Skeleton ===
    function showSkeleton() {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < SKELETON_COUNT; i++) {
            const card = document.createElement('div');
            card.className = 'skeleton-card';
            card.innerHTML = '<div class="skeleton-line short"></div><div class="skeleton-line medium"></div><div class="skeleton-line tiny"></div>';
            frag.appendChild(card);
        }
        resultsGrid.innerHTML = '';
        resultsGrid.appendChild(frag);
    }

    // === Category Tree ===
    function buildCategoryTree() {
        const tree = {};
        allTools.forEach(t => {
            const parts = t.category.split(' > ');
            const top = parts[0];
            if (!tree[top]) tree[top] = { count: 0, subs: {} };
            tree[top].count++;
            if (parts.length > 1) {
                const sub = parts[1];
                if (!tree[top].subs[sub]) tree[top].subs[sub] = 0;
                tree[top].subs[sub]++;
            }
        });
        const sorted = {};
        Object.keys(tree).sort((a, b) => tree[b].count - tree[a].count).forEach(k => sorted[k] = tree[k]);
        return sorted;
    }

    // === Sidebar ===
    function renderSidebar(categories) {
        const frag = document.createDocumentFragment();

        const allItem = document.createElement('div');
        allItem.className = 'sidebar-item';
        allItem.innerHTML = `<button class="sidebar-group-btn active" data-cat="All"><span class="sidebar-label">All Tools</span><span class="sidebar-badge">${allTools.length}</span></button>`;
        allItem.querySelector('button').addEventListener('click', () => selectCategory('All'));
        frag.appendChild(allItem);

        categories.forEach(cat => {
            const data = categoryTree[cat];
            const hasSubs = Object.keys(data.subs).length > 0;
            const item = document.createElement('div');
            item.className = 'sidebar-item';

            const btn = document.createElement('button');
            btn.className = 'sidebar-group-btn';
            btn.setAttribute('data-cat', cat);
            btn.innerHTML = `
        ${hasSubs ? '<svg class="sidebar-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>' : '<span style="width:14px;display:inline-block"></span>'}
        <span class="sidebar-label">${escapeHTML(cat)}</span>
        <span class="sidebar-badge">${data.count}</span>
      `;
            btn.addEventListener('click', () => {
                if (hasSubs) toggleGroup(item);
                selectCategory(cat);
            });
            item.appendChild(btn);

            if (hasSubs) {
                const children = document.createElement('div');
                children.className = 'sidebar-children';
                Object.keys(data.subs).sort().forEach(sub => {
                    const childBtn = document.createElement('button');
                    childBtn.className = 'sidebar-child-btn';
                    childBtn.setAttribute('data-cat', cat + ' > ' + sub);
                    childBtn.innerHTML = `<span class="sidebar-label">${escapeHTML(sub)}</span><span class="sidebar-badge">${data.subs[sub]}</span>`;
                    childBtn.addEventListener('click', e => { e.stopPropagation(); selectCategory(cat + ' > ' + sub); });
                    children.appendChild(childBtn);
                });
                item.appendChild(children);
            }
            frag.appendChild(item);
        });

        sidebarList.innerHTML = '';
        sidebarList.appendChild(frag);
    }

    function toggleGroup(item) {
        const btn = item.querySelector('.sidebar-group-btn');
        const children = item.querySelector('.sidebar-children');
        if (!children) return;
        const isOpen = children.classList.contains('open');
        children.classList.toggle('open', !isOpen);
        btn.classList.toggle('expanded', !isOpen);
    }

    function selectCategory(cat) {
        activeCategory = cat;
        document.querySelectorAll('.sidebar-group-btn, .sidebar-child-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-cat') === cat);
        });

        // Auto-expand parent
        if (cat.includes(' > ')) {
            const parentCat = cat.split(' > ')[0];
            document.querySelectorAll('.sidebar-item').forEach(item => {
                const btn = item.querySelector('.sidebar-group-btn');
                if (btn && btn.getAttribute('data-cat') === parentCat) {
                    const children = item.querySelector('.sidebar-children');
                    if (children && !children.classList.contains('open')) {
                        children.classList.add('open');
                        btn.classList.add('expanded');
                    }
                }
            });
        }

        resultsTitle.textContent = cat === 'All' ? 'All Tools' : cat;
        applyFilters();
        updateURL();
        closeSidebar();

        // Smooth scroll to top of results
        const resultsEl = document.querySelector('.results-section');
        if (resultsEl) {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('visible'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('visible'); document.body.style.overflow = ''; }

    // === Search ===
    function onSearchInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchTerm = searchInput.value.trim();
            searchClear.classList.toggle('visible', searchTerm.length > 0);
            if (searchKbd) searchKbd.classList.toggle('hidden', searchTerm.length > 0);
            applyFilters();
            updateURL();
        }, DEBOUNCE_MS);
    }

    function onSearchKeydown(e) {
        if (e.key === 'Escape') clearSearch();
    }

    // Global keyboard shortcut: `/` to focus search
    function onGlobalKeydown(e) {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            clearSearch();
            searchInput.blur();
        }
    }

    function clearSearch() {
        searchInput.value = ''; searchTerm = '';
        searchClear.classList.remove('visible');
        if (searchKbd) searchKbd.classList.remove('hidden');
        applyFilters(); updateURL(); searchInput.focus();
    }

    // === Filtering ===
    function applyFilters() {
        const query = searchTerm.toLowerCase();
        filteredTools = allTools.filter(tool => {
            if (activeCategory !== 'All') {
                if (activeCategory.includes(' > ')) {
                    if (tool.category !== activeCategory) return false;
                } else {
                    if (tool.category.split(' > ')[0] !== activeCategory) return false;
                }
            }
            if (query) {
                return tool.name.toLowerCase().includes(query) ||
                    tool.description.toLowerCase().includes(query) ||
                    tool.category.toLowerCase().includes(query);
            }
            return true;
        });

        toolCountEl.textContent = filteredTools.length;
        resultsCount.textContent = `${filteredTools.length} tools`;
        renderedCount = 0;
        resultsGrid.innerHTML = '';
        renderBatch();
        noResults.hidden = filteredTools.length > 0;
    }

    // === Rendering ===
    function renderBatch() {
        if (renderedCount >= filteredTools.length) return;
        const frag = document.createDocumentFragment();
        const end = Math.min(renderedCount + BATCH_SIZE, filteredTools.length);
        for (let i = renderedCount; i < end; i++) {
            frag.appendChild(createToolCard(filteredTools[i], i));
        }
        resultsGrid.appendChild(frag);
        renderedCount = end;
    }

    function createToolCard(tool, index) {
        const card = document.createElement('article');
        card.className = 'tool-card';
        card.style.animationDelay = `${(index % BATCH_SIZE) * 12}ms`;

        const domain = getDomain(tool.link);
        const faviconURL = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : '';
        const faviconImg = faviconURL ? `<img class="tool-card-favicon" src="${faviconURL}" alt="" loading="lazy" width="16" height="16" onerror="this.style.display='none'">` : '';

        card.innerHTML = `
      <h3 class="tool-card-name"><a href="${escapeAttr(tool.link)}" target="_blank" rel="noopener noreferrer">${faviconImg}${escapeHTML(tool.name)}</a></h3>
      <p class="tool-card-desc">${escapeHTML(tool.description)}</p>
      <span class="tool-card-category">${escapeHTML(tool.category.split(' > ')[0])}</span>
    `;
        return card;
    }

    function setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting && renderedCount < filteredTools.length) renderBatch(); });
        }, { rootMargin: '400px' }).observe(loadMoreSentinel);
    }

    // === Scroll ===
    function onScroll() { backToTopBtn.classList.toggle('visible', window.scrollY > 300); }

    // === URL State ===
    function updateURL() {
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.set('cat', activeCategory);
        if (searchTerm) params.set('q', searchTerm);
        history.replaceState(null, '', location.pathname + (params.toString() ? '#' + params.toString() : ''));
    }

    function applyURLState() {
        const hash = location.hash.slice(1);
        if (!hash) return;
        const params = new URLSearchParams(hash);
        if (params.get('cat')) activeCategory = params.get('cat');
        if (params.get('q')) { searchTerm = params.get('q'); searchInput.value = searchTerm; searchClear.classList.add('visible'); if (searchKbd) searchKbd.classList.add('hidden'); }
    }

    // === Utils ===
    function escapeHTML(s) { const d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
    function escapeAttr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function getDomain(url) {
        try { return new URL(url).hostname; } catch { return ''; }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
