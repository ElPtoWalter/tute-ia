(() => {
  "use strict";

  const VERSION = 20.2;
  const REGISTRY_KEY = "salaCeroAuthV202";
  const ACTIVE_KEY = "salaCeroActiveUserV202";
  const USER_PREFIX = "salaCeroUser:";
  const GUEST_PREFIX = "salaCeroGuest:";
  const SCOPED_PREFIXES = ["salaCero", "tuteIa", "tuteTutorialComplete:"];
  const AVATARS = ["♠", "♣", "♦", "★", "♛", "⚄", "T", "G", "C", "15", "P"];

  const proto = Storage.prototype;
  const native = {
    get: proto.getItem,
    set: proto.setItem,
    remove: proto.removeItem,
    key: proto.key,
    clear: proto.clear
  };

  const rawGet = key => native.get.call(window.localStorage, key);
  const rawSet = (key, value) => native.set.call(window.localStorage, key, value);
  const rawRemove = key => native.remove.call(window.localStorage, key);
  const rawKey = index => native.key.call(window.localStorage, index);

  function parse(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    try { const parsed = JSON.parse(value); return parsed === null ? fallback : parsed; } catch (_) { return fallback; }
  }

  function registry() {
    const data = parse(rawGet(REGISTRY_KEY), null);
    return {
      version: VERSION,
      legacyMigrated: Boolean(data?.legacyMigrated),
      profiles: Array.isArray(data?.profiles) ? data.profiles.filter(profile => profile?.id && profile?.name) : []
    };
  }

  function saveRegistry(data) {
    data.version = VERSION;
    rawSet(REGISTRY_KEY, JSON.stringify(data));
  }

  function activeId() {
    const id = rawGet(ACTIVE_KEY) || "";
    return registry().profiles.some(profile => profile.id === id) ? id : "";
  }

  function isScopedKey(key) {
    const text = String(key);
    if (text === REGISTRY_KEY || text === ACTIVE_KEY || text.startsWith(USER_PREFIX) || text.startsWith(GUEST_PREFIX)) return false;
    return SCOPED_PREFIXES.some(prefix => text.startsWith(prefix));
  }

  function namespacedKey(key, userId = activeId()) {
    return `${userId ? `${USER_PREFIX}${userId}:` : GUEST_PREFIX}${key}`;
  }

  // Aísla automáticamente partidas, preferencias, carrera y estadísticas por usuario.
  proto.getItem = function patchedGetItem(key) {
    if (this === window.localStorage && isScopedKey(key)) return native.get.call(this, namespacedKey(String(key)));
    return native.get.call(this, key);
  };
  proto.setItem = function patchedSetItem(key, value) {
    if (this === window.localStorage && isScopedKey(key)) return native.set.call(this, namespacedKey(String(key)), String(value));
    return native.set.call(this, key, String(value));
  };
  proto.removeItem = function patchedRemoveItem(key) {
    if (this === window.localStorage && isScopedKey(key)) return native.remove.call(this, namespacedKey(String(key)));
    return native.remove.call(this, key);
  };

  function randomId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, "").slice(0, 18);
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  function randomSalt() {
    const bytes = new Uint8Array(12);
    if (window.crypto?.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  }

  async function hashPin(pin, salt) {
    const value = `${salt}:${pin}`;
    if (window.crypto?.subtle && window.TextEncoder) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
  }

  function profileData(profile) {
    const club = parse(rawGet(namespacedKey("salaCeroClubV18", profile.id)), {});
    const xp = Math.max(0, Number(club?.xp) || 0);
    return {
      ...profile,
      name: club?.profile?.name || profile.name,
      avatar: club?.profile?.avatar || profile.avatar,
      level: Math.floor(xp / 250) + 1,
      xp
    };
  }

  function syncClubProfile(profile) {
    const key = namespacedKey("salaCeroClubV18", profile.id);
    const current = parse(rawGet(key), {});
    current.version = VERSION;
    current.profile = { ...(current.profile || {}), name: profile.name, avatar: profile.avatar };
    rawSet(key, JSON.stringify(current));
  }

  function copyLegacyKeys(userId) {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = rawKey(i);
      if (key && isScopedKey(key)) keys.push(key);
    }
    keys.forEach(key => {
      const value = rawGet(key);
      if (value !== null && rawGet(namespacedKey(key, userId)) === null) rawSet(namespacedKey(key, userId), value);
    });
  }

  function detectLegacyProfile() {
    const club = parse(rawGet("salaCeroClubV18"), {});
    const prefs = parse(rawGet("salaCeroGeneralaPrefsV17") || rawGet("salaCeroGeneralaPrefsV16"), {});
    const stats = rawGet("tuteIaStats");
    const hasLegacy = Boolean(rawGet("salaCeroClubV18") || rawGet("salaCeroCareerV19") || rawGet("salaCeroGeneralaSaveV17") || stats);
    if (!hasLegacy) return null;
    const name = String(club?.profile?.name || prefs?.name || "Eduardo").trim().slice(0, 18) || "Jugador";
    const avatar = AVATARS.includes(club?.profile?.avatar) ? club.profile.avatar : "♠";
    return { name, avatar };
  }

  function migrateLegacy() {
    const data = registry();
    if (data.legacyMigrated) return;
    const legacy = detectLegacyProfile();
    if (legacy && !data.profiles.length) {
      const profile = {
        id: randomId(), name: legacy.name, avatar: legacy.avatar,
        pinHash: "", salt: "", createdAt: new Date().toISOString(), lastLoginAt: ""
      };
      data.profiles.push(profile);
      copyLegacyKeys(profile.id);
      syncClubProfile(profile);
    }
    data.legacyMigrated = true;
    saveRegistry(data);
    // Tras actualizar desde la versión antigua se obliga a escoger usuario una vez.
    if (legacy) rawRemove(ACTIVE_KEY);
  }

  migrateLegacy();

  const fileName = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isHome = fileName === "" || fileName === "index.html";
  if (!activeId() && !isHome && fileName !== "offline.html" && fileName !== "card-preview.html") {
    const target = new URL("index.html#entrar", location.href);
    location.replace(target.href);
  }

  function getActiveProfile() {
    const id = activeId();
    if (!id) return null;
    const profile = registry().profiles.find(item => item.id === id);
    return profile ? profileData(profile) : null;
  }

  async function createProfile({ name, avatar, pin }) {
    const cleanName = String(name || "").trim().replace(/\s+/g, " ").slice(0, 18);
    if (cleanName.length < 2) throw new Error("Escribe un nombre de al menos dos caracteres.");
    const data = registry();
    if (data.profiles.some(profile => profile.name.toLocaleLowerCase("es") === cleanName.toLocaleLowerCase("es"))) {
      throw new Error("Ya existe un usuario con ese nombre.");
    }
    const cleanPin = String(pin || "").trim();
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) throw new Error("El PIN debe tener exactamente cuatro números.");
    const salt = cleanPin ? randomSalt() : "";
    const profile = {
      id: randomId(), name: cleanName, avatar: AVATARS.includes(avatar) ? avatar : "♠",
      pinHash: cleanPin ? await hashPin(cleanPin, salt) : "", salt,
      createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString()
    };
    data.profiles.push(profile);
    saveRegistry(data);
    syncClubProfile(profile);
    rawSet(ACTIVE_KEY, profile.id);
    return profile;
  }

  async function login(profileId, pin = "") {
    const data = registry();
    const profile = data.profiles.find(item => item.id === profileId);
    if (!profile) throw new Error("Ese usuario ya no existe.");
    if (profile.pinHash) {
      const candidate = await hashPin(String(pin).trim(), profile.salt);
      if (candidate !== profile.pinHash) throw new Error("PIN incorrecto.");
    }
    profile.lastLoginAt = new Date().toISOString();
    saveRegistry(data);
    syncClubProfile(profile);
    rawSet(ACTIVE_KEY, profile.id);
    return profile;
  }

  function logout() {
    rawRemove(ACTIVE_KEY);
    location.href = new URL("index.html#entrar", location.href).href;
  }

  function updateAccountProfile({ name, avatar }) {
    const id = activeId();
    if (!id) return null;
    const data = registry();
    const profile = data.profiles.find(item => item.id === id);
    if (!profile) return null;
    const cleanName = String(name || profile.name).trim().replace(/\s+/g, " ").slice(0, 18) || profile.name;
    const duplicate = data.profiles.some(item => item.id !== id && item.name.toLocaleLowerCase("es") === cleanName.toLocaleLowerCase("es"));
    if (!duplicate) profile.name = cleanName;
    if (AVATARS.includes(avatar)) profile.avatar = avatar;
    saveRegistry(data);
    syncClubProfile(profile);
    return profile;
  }

  async function deleteProfile(profileId) {
    const data = registry();
    const profile = data.profiles.find(item => item.id === profileId);
    if (!profile) return false;
    data.profiles = data.profiles.filter(item => item.id !== profileId);
    saveRegistry(data);
    const prefix = `${USER_PREFIX}${profileId}:`;
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = rawKey(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(rawRemove);
    if (rawGet(ACTIVE_KEY) === profileId) rawRemove(ACTIVE_KEY);
    return true;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function avatarOptions(selected = "♠") {
    return AVATARS.map(avatar => `<label><input type="radio" name="scAvatar" value="${escapeHtml(avatar)}" ${avatar === selected ? "checked" : ""}><span>${escapeHtml(avatar)}</span></label>`).join("");
  }

  function createAuthLayer() {
    let layer = document.getElementById("scAuthLayer");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "scAuthLayer";
    layer.className = "sc-auth-layer hidden";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    document.body.appendChild(layer);
    return layer;
  }

  function message(container, text, type = "error") {
    const node = container.querySelector("[data-auth-message]");
    if (!node) return;
    node.textContent = text || "";
    node.className = `sc-auth-message ${text ? "visible" : ""} ${type}`;
  }

  function renderLogin({ allowClose = false } = {}) {
    const layer = createAuthLayer();
    const profiles = registry().profiles.map(profileData);
    layer.classList.remove("hidden");
    document.documentElement.classList.add("sc-auth-open");
    layer.innerHTML = `<section class="sc-auth-card sc-login-card">
      ${allowClose ? '<button class="sc-auth-close" type="button" data-auth-close aria-label="Cerrar">×</button>' : ""}
      <header class="sc-auth-header"><span class="sc-auth-seal">SC</span><div><small>SALA CERO · SESIONES LOCALES</small><h1>¿Quién juega hoy?</h1><p>Cada usuario conserva por separado sus partidas, estadísticas, carrera y personalización.</p></div></header>
      <div class="sc-profile-list">${profiles.length ? profiles.map(profile => `<button class="sc-profile-choice" type="button" data-login-id="${profile.id}"><span>${escapeHtml(profile.avatar)}</span><div><strong>${escapeHtml(profile.name)}</strong><small>Nivel ${profile.level} · ${profile.xp} XP${profile.pinHash ? " · PIN" : ""}</small></div><b>Entrar →</b></button>`).join("") : '<div class="sc-auth-empty"><b>Todavía no hay usuarios</b><span>Crea el primero para empezar a jugar.</span></div>'}</div>
      <div class="sc-pin-panel hidden" data-pin-panel><button type="button" data-pin-back>← Volver</button><span data-pin-avatar>♠</span><strong data-pin-name>Jugador</strong><label>PIN de cuatro cifras<input inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="current-password" data-pin-input></label><button class="sc-auth-primary" type="button" data-pin-submit>Iniciar sesión</button></div>
      <button class="sc-auth-create-link" type="button" data-auth-create>＋ Crear otro usuario</button>
      <p class="sc-auth-message" data-auth-message></p>
      <footer>Los perfiles se guardan únicamente en este navegador. El PIN evita accesos casuales, pero no sustituye a una contraseña de una cuenta online.</footer>
    </section>`;

    layer.querySelectorAll("[data-login-id]").forEach(button => button.addEventListener("click", async () => {
      const profile = profiles.find(item => item.id === button.dataset.loginId);
      if (!profile) return;
      if (!profile.pinHash) {
        try { await login(profile.id); location.reload(); } catch (error) { message(layer, error.message); }
        return;
      }
      const panel = layer.querySelector("[data-pin-panel]");
      panel.dataset.profileId = profile.id;
      panel.querySelector("[data-pin-avatar]").textContent = profile.avatar;
      panel.querySelector("[data-pin-name]").textContent = profile.name;
      panel.classList.remove("hidden");
      layer.querySelector(".sc-profile-list").classList.add("dimmed");
      const input = panel.querySelector("[data-pin-input]");
      input.value = "";
      setTimeout(() => input.focus(), 50);
    }));
    layer.querySelector("[data-pin-back]")?.addEventListener("click", () => {
      layer.querySelector("[data-pin-panel]").classList.add("hidden");
      layer.querySelector(".sc-profile-list").classList.remove("dimmed");
      message(layer, "");
    });
    const submitPin = async () => {
      const panel = layer.querySelector("[data-pin-panel]");
      try {
        await login(panel.dataset.profileId, panel.querySelector("[data-pin-input]").value);
        location.reload();
      } catch (error) {
        message(layer, error.message);
        panel.querySelector("[data-pin-input]").select();
      }
    };
    layer.querySelector("[data-pin-submit]")?.addEventListener("click", submitPin);
    layer.querySelector("[data-pin-input]")?.addEventListener("keydown", event => { if (event.key === "Enter") submitPin(); });
    layer.querySelector("[data-auth-create]")?.addEventListener("click", () => renderCreate({ allowBack: profiles.length > 0, allowClose }));
    layer.querySelector("[data-auth-close]")?.addEventListener("click", closeAuthLayer);
  }

  function renderCreate({ allowBack = true, allowClose = false } = {}) {
    const layer = createAuthLayer();
    layer.classList.remove("hidden");
    document.documentElement.classList.add("sc-auth-open");
    layer.innerHTML = `<section class="sc-auth-card sc-create-card">
      ${allowClose ? '<button class="sc-auth-close" type="button" data-auth-close aria-label="Cerrar">×</button>' : ""}
      <header class="sc-auth-header"><span class="sc-auth-seal">＋</span><div><small>NUEVO MIEMBRO</small><h1>Crea tu usuario</h1><p>El progreso de esta persona quedará aislado del resto.</p></div></header>
      <form class="sc-create-form" data-create-form>
        <label><span>Nombre visible</span><input name="scName" maxlength="18" autocomplete="nickname" placeholder="Ej. Álvaro" required></label>
        <fieldset><legend>Emblema</legend><div class="sc-avatar-picker">${avatarOptions()}</div></fieldset>
        <div class="sc-pin-grid"><label><span>PIN opcional</span><input name="scPin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" placeholder="4 cifras"></label><label><span>Repetir PIN</span><input name="scPinRepeat" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" placeholder="4 cifras"></label></div>
        <p class="sc-auth-help">Puedes dejar ambos campos de PIN vacíos para entrar con un solo toque.</p>
        <button class="sc-auth-primary" type="submit">Crear e iniciar sesión</button>
      </form>
      ${allowBack ? '<button class="sc-auth-create-link" type="button" data-auth-back>← Volver a usuarios</button>' : ""}
      <p class="sc-auth-message" data-auth-message></p>
    </section>`;
    const form = layer.querySelector("[data-create-form]");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const pin = form.elements.scPin.value.trim();
      if (pin !== form.elements.scPinRepeat.value.trim()) { message(layer, "Los dos PIN no coinciden."); return; }
      try {
        await createProfile({ name: form.elements.scName.value, avatar: form.querySelector("[name=scAvatar]:checked")?.value, pin });
        location.reload();
      } catch (error) { message(layer, error.message); }
    });
    layer.querySelector("[data-auth-back]")?.addEventListener("click", () => renderLogin({ allowClose }));
    layer.querySelector("[data-auth-close]")?.addEventListener("click", closeAuthLayer);
    setTimeout(() => form.elements.scName.focus(), 50);
  }

  function renderAccountManager() {
    const current = getActiveProfile();
    if (!current) { renderLogin(); return; }
    const layer = createAuthLayer();
    layer.classList.remove("hidden");
    document.documentElement.classList.add("sc-auth-open");
    layer.innerHTML = `<section class="sc-auth-card sc-account-card">
      <button class="sc-auth-close" type="button" data-auth-close aria-label="Cerrar">×</button>
      <header class="sc-auth-header"><span class="sc-auth-seal">${escapeHtml(current.avatar)}</span><div><small>SESIÓN ACTIVA</small><h1>${escapeHtml(current.name)}</h1><p>Nivel ${current.level} · ${current.xp} XP. Todo lo que juegues se guardará en este usuario.</p></div></header>
      <div class="sc-account-actions"><button type="button" data-auth-switch>⇄ Cambiar de usuario</button><button type="button" data-auth-create>＋ Crear usuario</button><button class="danger" type="button" data-auth-logout>Salir de la sesión</button></div>
      <details class="sc-auth-danger"><summary>Administrar este usuario</summary><p>Al eliminarlo se borrarán sus partidas, estadísticas, trofeos y ajustes de este navegador.</p><button type="button" data-auth-delete>Eliminar ${escapeHtml(current.name)}</button></details>
      <p class="sc-auth-message" data-auth-message></p>
    </section>`;
    layer.querySelector("[data-auth-close]").addEventListener("click", closeAuthLayer);
    layer.querySelector("[data-auth-switch]").addEventListener("click", () => renderLogin({ allowClose: true }));
    layer.querySelector("[data-auth-create]").addEventListener("click", () => renderCreate({ allowBack: true, allowClose: true }));
    layer.querySelector("[data-auth-logout]").addEventListener("click", logout);
    layer.querySelector("[data-auth-delete]").addEventListener("click", async () => {
      const confirmed = window.confirm(`¿Eliminar definitivamente el usuario ${current.name} y todo su progreso en este navegador?`);
      if (!confirmed) return;
      await deleteProfile(current.id);
      location.href = new URL("index.html#entrar", location.href).href;
    });
  }

  function closeAuthLayer() {
    const layer = document.getElementById("scAuthLayer");
    layer?.classList.add("hidden");
    document.documentElement.classList.remove("sc-auth-open");
  }

  function injectAccountButton() {
    const current = getActiveProfile();
    if (!current) return;
    const existingClubChip = document.querySelector("[data-club-chip]");
    if (existingClubChip) {
      if (!document.getElementById("clubProfileDialog")) existingClubChip.addEventListener("click", renderAccountManager);
      existingClubChip.title = document.getElementById("clubProfileDialog") ? "Abrir perfil" : "Cambiar usuario o cerrar sesión";
      return;
    }
    const candidates = [".topbar-actions", ".g-top-actions", ".sg-actions", ".career-nav", ".local-top-actions", ".multi-actions", ".hub-nav"];
    const host = candidates.map(selector => document.querySelector(selector)).find(Boolean);
    if (!host || host.querySelector("[data-auth-account]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sc-account-chip";
    button.dataset.authAccount = "";
    button.title = "Cambiar usuario o cerrar sesión";
    button.innerHTML = `<span>${escapeHtml(current.avatar)}</span><b>${escapeHtml(current.name)}</b>`;
    button.addEventListener("click", renderAccountManager);
    host.prepend(button);
  }

  function injectProfileDialogActions() {
    const card = document.querySelector("#clubProfileDialog .club-dialog-card");
    if (!card || card.querySelector(".sc-profile-session-actions")) return;
    const actions = document.createElement("div");
    actions.className = "sc-profile-session-actions";
    actions.innerHTML = '<button type="button" data-auth-account>Gestionar sesiones</button><button type="button" data-auth-logout>Cerrar sesión</button>';
    actions.querySelector("[data-auth-account]").addEventListener("click", () => { card.closest("dialog")?.close(); renderAccountManager(); });
    actions.querySelector("[data-auth-logout]").addEventListener("click", logout);
    card.appendChild(actions);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const current = getActiveProfile();
    if (!current && isHome) {
      if (registry().profiles.length) renderLogin();
      else renderCreate({ allowBack: false });
      return;
    }
    injectAccountButton();
    injectProfileDialogActions();
    if (location.hash === "#entrar") renderAccountManager();
  });

  window.SalaCeroAuth = {
    getActiveProfile,
    getProfiles: () => registry().profiles.map(profileData),
    updateAccountProfile,
    show: renderAccountManager,
    showSwitcher: () => renderLogin({ allowClose: Boolean(activeId()) }),
    logout,
    createProfile,
    login,
    deleteProfile,
    version: VERSION
  };
})();
