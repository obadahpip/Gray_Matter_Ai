/* =========================================================
   Gray Matter AI — shared utilities
   - data loading (with localStorage overlay)
   - toasts
   - easter eggs (Konami, console art, cookie button)
   ========================================================= */

const GMAI = (() => {
  const DATA_URL = "assets/data/data.json";
  const LS_OVERLAY_KEY = "gmai_overlay_v1";
  const LS_SESSION_KEY = "gmai_session_v1";

  // ---- data layer ----
  let _baseData = null;

  async function loadBaseData() {
    if (_baseData) return _baseData;
    if (typeof window !== "undefined" && window.GMAI_DATA) {
      _baseData = JSON.parse(JSON.stringify(window.GMAI_DATA));
      return _baseData;
    }
    const candidates = [DATA_URL, "../" + DATA_URL, "../../" + DATA_URL];
    for (const url of candidates) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) { _baseData = await r.json(); return _baseData; }
      } catch (_) { /* try next */ }
    }
    throw new Error("Could not load data.json");
  }

  function loadOverlay() {
    try { return JSON.parse(localStorage.getItem(LS_OVERLAY_KEY)) || {}; }
    catch (_) { return {}; }
  }

  function saveOverlay(overlay) {
    localStorage.setItem(LS_OVERLAY_KEY, JSON.stringify(overlay));
  }

  function clearOverlay() {
    localStorage.removeItem(LS_OVERLAY_KEY);
  }

  async function loadData() {
    const base = await loadBaseData();
    const overlay = loadOverlay();
    const merged = JSON.parse(JSON.stringify(base));
    if (overlay.clients) {
      for (const [id, c] of Object.entries(overlay.clients)) {
        if (c === null) { delete merged.clients[id]; continue; }
        merged.clients[id] = { ...(merged.clients[id] || {}), ...c };
      }
    }
    if (overlay.users) {
      for (const [id, u] of Object.entries(overlay.users)) {
        if (u === null) { delete merged.users[id]; continue; }
        merged.users[id] = u;
      }
    }
    if (overlay.lastUpdated) merged.lastUpdated = overlay.lastUpdated;
    return merged;
  }

  async function patchData(patch) {
    const overlay = loadOverlay();
    if (patch.clients) {
      overlay.clients = overlay.clients || {};
      for (const [id, c] of Object.entries(patch.clients)) {
        overlay.clients[id] = { ...(overlay.clients[id] || {}), ...c };
      }
    }
    if (patch.users) {
      overlay.users = { ...(overlay.users || {}), ...patch.users };
    }
    overlay.lastUpdated = new Date().toISOString().slice(0, 10);
    saveOverlay(overlay);
    return loadData();
  }

  async function setClient(clientId, clientData) {
    const overlay = loadOverlay();
    overlay.clients = overlay.clients || {};
    overlay.clients[clientId] = clientData;
    overlay.lastUpdated = new Date().toISOString().slice(0, 10);
    saveOverlay(overlay);
    return loadData();
  }

  async function removeClient(clientId) {
    const overlay = loadOverlay();
    overlay.clients = overlay.clients || {};
    overlay.clients[clientId] = null;
    saveOverlay(overlay);
    return loadData();
  }

  // ---- session ----
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(LS_SESSION_KEY)) || null; }
    catch (_) { return null; }
  }
  function setSession(s) { sessionStorage.setItem(LS_SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { sessionStorage.removeItem(LS_SESSION_KEY); }

  function requireAuth(role) {
    const s = getSession();
    if (!s) { window.location.href = "login.html"; return null; }
    if (role && s.role !== role) { window.location.href = "login.html"; return null; }
    return s;
  }

  // ---- toasts ----
  function ensureToastContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "toast-container";
      document.body.appendChild(c);
    }
    return c;
  }
  function toast(msg, type, ms) {
    type = type || "info"; ms = ms || 2400;
    const c = ensureToastContainer();
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .25s ease";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 280);
    }, ms);
  }

  // ---- helpers ----
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function fmtDate(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(); }
    catch (_) { return String(iso); }
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }

  // ---- easter eggs ----
  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let konamiBuf = [];
  function installKonami() {
    window.addEventListener("keydown", (e) => {
      konamiBuf.push(e.key);
      if (konamiBuf.length > KONAMI.length) konamiBuf.shift();
      if (KONAMI.every((k, i) => konamiBuf[i] && k.toLowerCase() === konamiBuf[i].toLowerCase())) {
        konamiBuf = [];
        triggerKonami();
      }
    });
  }
  function triggerKonami() {
    const el = document.createElement("div");
    el.className = "konami-overlay";
    el.innerHTML =
      '<div class="konami-overlay__inner panel">' +
        '<h2 class="gradient-text">// access::granted</h2>' +
        '<p class="muted">You found the secret. Coffee level just hit 110%. Productivity briefly violated the laws of physics.</p>' +
        '<pre class="mono mt-3" style="text-align:left;font-size:.78rem;color:var(--text-2);">' +
'$ whoami\n' +
'> obadah — fixer of every thing\n' +
'$ cat /etc/motd\n' +
'> we make your vision come true.\n' +
'> the coffee machine runs 23/7 (don\'t ask).' +
        '</pre>' +
        '<button class="btn btn--ghost mt-3" id="konami-close">close</button>' +
      '</div>';
    document.body.appendChild(el);
    document.getElementById("konami-close").addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => { if (e.target === el) el.remove(); });
  }

  function installCookieButton() {
    if (document.querySelector(".cookie-btn")) return;
    const b = document.createElement("button");
    b.className = "cookie-btn";
    b.title = "?";
    b.textContent = "🍪";
    let clicks = 0;
    const messages = [
      "meow.",
      "Mrs. Cookie says hi.",
      "Mrs. Cookie wants treats.",
      "Mrs. Cookie reviewed your code. She approves. Mostly.",
      "Mrs. Cookie has filed a PR. Please review.",
      "Mrs. Cookie demands more pets.",
      "Mrs. Cookie has been promoted to CTO."
    ];
    b.addEventListener("click", () => {
      toast(messages[Math.min(clicks, messages.length - 1)], "info", 2200);
      clicks++;
      if (clicks === 7) {
        b.style.transform = "scale(1.4) rotate(20deg)";
        setTimeout(() => b.style.transform = "", 600);
      }
    });
    document.body.appendChild(b);
  }

  function consoleArt() {
    if (window.__gmai_console_done) return;
    window.__gmai_console_done = true;
    const css1 = "color:#60a5fa;font-family:monospace;font-size:14px;";
    const css2 = "color:#94a3b8;font-family:monospace;font-size:12px;";
    console.log("%cgray matter ai", css1 + "font-size:24px;font-weight:700;");
    console.log("%c// whatever your software is, we can make it.", css2);
    console.log("%c// curious? say hi -> obadahabuodeh@gmail.com", css2);
    console.log("%c// pssst -- try the konami code on this page.", css2);
  }

  function init() {
    installKonami();
    installCookieButton();
    consoleArt();
  }

  return {
    loadData: loadData,
    patchData: patchData,
    setClient: setClient,
    removeClient: removeClient,
    loadOverlay: loadOverlay,
    saveOverlay: saveOverlay,
    clearOverlay: clearOverlay,
    loadBaseData: loadBaseData,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    requireAuth: requireAuth,
    toast: toast,
    escapeHtml: escapeHtml,
    fmtDate: fmtDate,
    uid: uid,
    init: init
  };
})();

document.addEventListener("DOMContentLoaded", function () { GMAI.init(); });
