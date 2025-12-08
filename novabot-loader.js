/* ===========================================================
   NovaBot v6.9.5 – Premium Shadow DOM Loader
   Works with: ui.css + ui.html inside same repository
   Author: Mohammed Abu Snaina – NOVALINK.AI
   =========================================================== */

(function () {
  const script = document.currentScript;
  if (!script) return;

  const API_URL = script.getAttribute("data-novabot-api") || "";
  const LOCALE = script.getAttribute("data-novabot-locale") || "ar";

  /* -----------------------------
     1) Create Shadow Host 
  ----------------------------- */
  const host = document.createElement("div");
  host.id = "novabot-shadow-host";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "999999";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  /* -----------------------------
     2) Load UI files
  ----------------------------- */
  const baseUrl = script.src.replace(/[^\/]+$/, "");
  const cssUrl = baseUrl + "ui.css";
  const htmlUrl = baseUrl + "ui.html";

  Promise.all([
    fetch(cssUrl).then((r) => r.text()),
    fetch(htmlUrl).then((r) => r.text())
  ])
    .then(([cssText, htmlText]) => {
      shadow.innerHTML = `
        <style>${cssText}</style>
        ${htmlText}
      `;
      initNovaBot(shadow, { apiUrl: API_URL, locale: LOCALE });
    })
    .catch((err) => console.error("NovaBot Loader Error:", err));

  /* ===========================================================
     3) Main Logic
  =========================================================== */

  function initNovaBot(root, opts) {
    const config = {
      BRAND_NAME: "نوفا لينك",
      PRIMARY_COLOR: "#1b577c",
      ACCENT_COLOR: "#fe930e",
      API_PRIMARY: opts.apiUrl,
      API_FALLBACK: opts.apiUrl,
      LOCALE: opts.locale || "ar",
      SOUND_URL:
        "https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/new-notification-3-398649-RwIqiPPdJUta0dpV.mp3",
      SUBSCRIBE_URL: "https://novalink-ai.com/ashtrk-alan",
      SERVICES_URL: "https://novalink-ai.com/services-khdmat-nwfa-lynk",
      CONTACT_EMAIL: "contact@novalink-ai.com",
      FEEDBACK_API: ""
    };

    const lang = config.LOCALE === "en" ? "en" : "ar";

    /* UI Elements */
    const fab = root.getElementById("novaFabBtn");
    const backdrop = root.getElementById("novaBackdrop");
    const closeBtn = root.getElementById("novaCloseBtn");
    const chatBody = root.getElementById("novaChatBody");
    const input = root.getElementById("novaInput");
    const sendBtn = root.getElementById("novaSendBtn");

    if (!fab || !backdrop || !closeBtn || !chatBody || !input || !sendBtn) {
      console.error("NovaBot root elements missing");
      return;
    }

    let chatOpen = false;
    let chatHistory = [];
    let soundCount = 0;
    let typingInterval = null;
    let currentBotRow = null;
    let isTypingActive = false;
    const pendingCards = [];

    const STORAGE_KEY = "novabot_v6.9_conversation";
    const STORAGE_TTL = 12 * 60 * 60 * 1000;

    /* -----------------------------
       Utility Functions
    ----------------------------- */

    function escapeHtml(str) {
      return (str || "").replace(/[&<>"]/g, (c) => {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c;
      });
    }

    function scrollBottom() {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function isMobile() {
      return window.innerWidth <= 640;
    }

    function playSound() {
      if (soundCount >= 3) return;
      try {
        new Audio(config.SOUND_URL).play().catch(() => {});
        soundCount++;
      } catch {}
    }

    function clearTyping() {
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
      }
      isTypingActive = false;
    }

    /* -----------------------------
       Thinking Bubble
    ----------------------------- */
    function startThinking() {
      clearTyping();

      currentBotRow = document.createElement("div");
      currentBotRow.className = "nova-msg-row nova-bot";
      currentBotRow.innerHTML = `
        <div class="nova-bubble nova-bubble-bot">
          <div class="nova-bot-header">
            <div class="nova-bot-header-icon">
              <img src="https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/novabot-2-f081v1SXHunuZjwP.png" />
            </div>
            <div class="nova-bot-name">NOVABOT</div>
          </div>
          <div class="nova-bubble-content">
            <div class="nova-typing">
              <span>${lang === "en" ? "NovaBot is typing" : "نوفا بوت يكتب الآن"}</span>
              <span class="nova-typing-dots">
                <span class="nova-dot-typing"></span>
                <span class="nova-dot-typing"></span>
                <span class="nova-dot-typing"></span>
              </span>
            </div>
          </div>
        </div>
      `;
      chatBody.appendChild(currentBotRow);
      scrollBottom();
    }

    /* -----------------------------
       Typing animation
    ----------------------------- */
    function typeResponse(fullHtml) {
      const content = currentBotRow.querySelector(".nova-bubble-content");
      clearTyping();

      const text = fullHtml.toString();
      const speed =
        text.length <= 80 ? 25 : text.length <= 180 ? 18 : text.length <= 350 ? 12 : 9;

      let i = 0;
      isTypingActive = true;

      typingInterval = setInterval(() => {
        content.innerHTML = text.slice(0, i);
        i++;
        scrollBottom();

        if (i > text.length) {
          clearTyping();
          playSound();
          pendingCards.forEach((cb) => cb());
          pendingCards.length = 0;
        }
      }, speed);
    }

    /* -----------------------------
       Add Messages
    ----------------------------- */
    function addUser(text) {
      const el = document.createElement("div");
      el.className = "nova-msg-row nova-user";
      el.innerHTML = `
        <div class="nova-bubble nova-bubble-user">${escapeHtml(text)}</div>
      `;
      chatBody.appendChild(el);
      scrollBottom();
    }

    function addBotStatic(html) {
      const el = document.createElement("div");
      el.className = "nova-msg-row nova-bot";
      el.innerHTML = `
        <div class="nova-bubble nova-bubble-bot">
          <div class="nova-bot-header">
            <div class="nova-bot-header-icon">
              <img src="https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/novabot-2-f081v1SXHunuZjwP.png" />
            </div>
            <div class="nova-bot-name">NOVABOT</div>
          </div>
          <div class="nova-bubble-content">${html}</div>
        </div>
      `;
      chatBody.appendChild(el);
      scrollBottom();
      playSound();
    }

    /* -----------------------------
       API Call
    ----------------------------- */
    async function callApi(message) {
      try {
        const res = await fetch(config.API_PRIMARY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        });

        if (!res.ok) return { ok: false, reply: "" };

        const data = await res.json();
        return {
          ok: data.ok,
          reply: data.reply,
          actionCard: data.actionCard
        };
      } catch {
        return { ok: false, reply: "" };
      }
    }

    /* -----------------------------
       Save / Restore conversation
    ----------------------------- */
    function saveHistory() {
      try {
        const wrap = { ts: Date.now(), data: chatHistory.slice(-25) };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wrap));
      } catch {}
    }

    function restoreHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const data = JSON.parse(raw);
        if (!data.ts || Date.now() - data.ts > STORAGE_TTL) return;

        chatHistory = data.data;

        chatHistory.forEach((m) => {
          if (m.role === "user") addUser(m.content);
          else addBotStatic(m.content.replace(/\n/g, "<br>"));
        });
      } catch {}
    }

    /* -----------------------------
       Open / Close Chat
    ----------------------------- */
    function openChat() {
      if (chatOpen) return;
      chatOpen = true;

      backdrop.classList.add("nova-open");
      backdrop.style.pointerEvents = "auto";

      if (isMobile()) fab.classList.add("nova-hidden");

      try {
        history.pushState({ nb: true }, "", location.href);
      } catch {}

      if (!chatHistory.length) {
        setTimeout(() => {
          startThinking();
          setTimeout(() => {
            typeResponse(
              lang === "en"
                ? "Welcome to NovaLink 👋<br>I'm NovaBot… ready to help you."
                : "مرحباً بك 👋<br>أنا نوفا بوت… جاهز لمساعدتك."
            );
          }, 800);
        }, 300);
      }

      setTimeout(() => input.focus(), 250);
    }

    function closeChat(evt) {
      if (!chatOpen) return;
      chatOpen = false;

      backdrop.classList.remove("nova-open");
      backdrop.style.pointerEvents = "none";
      fab.classList.remove("nova-hidden");

      if (!(evt && evt.fromBack)) {
        try {
          if (history.state && history.state.nb) history.back();
        } catch {}
      }
    }

    /* -----------------------------
       Handle Send
    ----------------------------- */
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addUser(text);
      chatHistory.push({ role: "user", content: text });
      saveHistory();

      input.value = "";
      input.focus();

      startThinking();

      const apiPromise = callApi(text);
      const minDelay = 900 + Math.random() * 600;

      const [res] = await Promise.all([apiPromise, new Promise((r) => setTimeout(r, minDelay))]);

      let reply =
        res && res.ok && res.reply
          ? res.reply
          : lang === "en"
          ? "NovaBot is in test mode."
          : "نوفا بوت في وضع التجربة حالياً.";

      /* Developer Identity override */
      if (res && res.actionCard === "developer_identity") {
        reply =
          /[A-Za-z]/.test(text)
            ? "✨ This is a quick identity card for the human behind NovaBot."
            : "✨ هذه بطاقة تعريف سريعة بالشخص الذي طوّر نوفا بوت.";
      }

      typeResponse(reply.replace(/\n/g, "<br>"));

      chatHistory.push({ role: "assistant", content: reply });
      saveHistory();
    }

    /* -----------------------------
       Events
    ----------------------------- */
    fab.addEventListener("click", openChat);
    closeBtn.addEventListener("click", closeChat);
    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeChat();
    });

    window.addEventListener("popstate", () => {
      if (chatOpen) closeChat({ fromBack: true });
    });

    restoreHistory();
  }
})();
