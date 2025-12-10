/* ==========================================================
   NovaBot v6.9 – Shadow DOM Loader (PRO Production Build)
   يعمل مع:
   - ui.css
   - ui.html
   ========================================================== */

(function () {
  if (window.__NovaBotShadowLoaded) return;
  window.__NovaBotShadowLoaded = true;

  const scriptEl = document.currentScript;
  if (!scriptEl) return;

  const API_URL = scriptEl.getAttribute("data-novabot-api") || "";
  const LOCALE = scriptEl.getAttribute("data-novabot-locale") || "ar";

  /* ---------------------------------------------------------
     إنشاء الـ Shadow Host
  --------------------------------------------------------- */
  const host = document.createElement("div");
  host.id = "novabot-shadow-host";
  host.style.position = "relative";
  host.style.zIndex = "9999";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const baseUrl = scriptEl.src.replace(/[^\/]+$/, "");
  const cssUrl = baseUrl + "ui.css";
  const htmlUrl = baseUrl + "ui.html";

  Promise.all([
    fetch(cssUrl).then((r) => r.text()),
    fetch(htmlUrl).then((r) => r.text())
  ])
    .then(([cssText, htmlText]) => {
      shadow.innerHTML = `<style>${cssText}</style>${htmlText}`;
      initNovaBot(shadow, { apiUrl: API_URL, locale: LOCALE });
    })
    .catch((err) => console.error("NovaBot loader error:", err));

  /* ==========================================================
     NovaBot Logic
  ========================================================== */
  function initNovaBot(root, options) {
    const config = {
      BRAND_NAME: "نوفا لينك",
      PRIMARY_COLOR: "#1b577c",
      ACCENT_COLOR: "#fe930e",

      API_PRIMARY: options.apiUrl,
      API_FALLBACK: options.apiUrl,

      CHANNEL: "web",
      BUSINESS_TYPE: "blog",
      LOCALE: options.locale || "ar",

      SOUND_URL:
        "https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/new-notification-3-398649-RwIqiPPdJUta0dpV.mp3",

      SUBSCRIBE_URL: "https://novalink-ai.com/ashtrk-alan",
      SERVICES_URL: "https://novalink-ai.com/services-khdmat-nwfa-lynk",
      CONTACT_EMAIL: "contact@novalink-ai.com"
    };

    const lang = config.LOCALE === "en" ? "en" : "ar";

    const WELCOME_HTML =
      lang === "en"
        ? "Welcome to NovaLink 👋<br>I'm NovaBot… ready to help you."
        : "مرحباً بك في نوفا لينك 👋<br>أنا نوفا بوت… جاهز لمساعدتك دائماً.";

    const STORAGE_KEY = "novabot_v6.9_conversation";
    const EMAIL_KEY = "novabot_saved_email";

    /* ---------------------------------------------------------
       عناصر الواجهة داخل الشادو
    --------------------------------------------------------- */
    const fabBtn = root.getElementById("novaFabBtn");
    const backdrop = root.getElementById("novaBackdrop");
    const closeBtn = root.getElementById("novaCloseBtn");
    const chatBody = root.getElementById("novaChatBody");
    const input = root.getElementById("novaInput");
    const sendBtn = root.getElementById("novaSendBtn");

    if (!fabBtn || !backdrop || !closeBtn || !chatBody || !input || !sendBtn) {
      console.error("NovaBot elements missing");
      return;
    }

    /* ---------------------------------------------------------
       حالة النظام
    --------------------------------------------------------- */
    let chatHistory = [];
    let soundCount = 0;
    let novaChatOpen = false;
    let typingIntervalId = null;
    let isTypingAnimationActive = false;
    let currentBotRow = null;
    const pendingCardCallbacks = [];

    /* ---------------------------------------------------------
       Helpers
    --------------------------------------------------------- */
    function isMobileViewport() {
      return window.innerWidth <= 1024;
    }

    function escapeHtml(str) {
      return (str || "").replace(/[&<>"]/g, (c) => {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c;
      });
    }

    function scrollToBottom() {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function playNovaSound() {
      if (!config.SOUND_URL || soundCount >= 3) return;
      try {
        new Audio(config.SOUND_URL).play().catch(() => {});
        soundCount++;
      } catch {}
    }

    function clearTyping() {
      if (typingIntervalId) clearInterval(typingIntervalId);
      typingIntervalId = null;
      isTypingAnimationActive = false;
      pendingCardCallbacks.length = 0;
    }

    /* ---------------------------------------------------------
       Typing Bubble
    --------------------------------------------------------- */
    function startThinkingBubble() {
      clearTyping();

      currentBotRow = document.createElement("div");
      currentBotRow.className = "nova-msg-row nova-bot";

      currentBotRow.innerHTML = `
        <div class="nova-bubble nova-bubble-bot">
          <div class="nova-bot-header">
            <div class="nova-bot-header-icon">
              <img src="https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/novabot-2-f081v1SXHunuZjwP.png"/>
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
        </div>`;

      chatBody.appendChild(currentBotRow);
      scrollToBottom();
    }

    function typeReply(html) {
      if (!currentBotRow) startThinkingBubble();

      const el = currentBotRow.querySelector(".nova-bubble-content");
      if (!el) return;

      clearTyping();

      const txt = html.toString();
      let i = 0;

      typingIntervalId = setInterval(() => {
        el.innerHTML = txt.slice(0, i++);
        scrollToBottom();
        if (i > txt.length) {
          clearTyping();
          playNovaSound();
          while (pendingCardCallbacks.length)
            pendingCardCallbacks.shift()();
        }
      }, 18);
    }

    /* ---------------------------------------------------------
       User Message
    --------------------------------------------------------- */
    function addUserMessage(text) {
      const row = document.createElement("div");
      row.className = "nova-msg-row nova-user";
      row.innerHTML = `<div class="nova-bubble nova-bubble-user">${escapeHtml(
        text
      )}</div>`;
      chatBody.appendChild(row);
      scrollToBottom();
    }

    /* ---------------------------------------------------------
       Bot Message
    --------------------------------------------------------- */
    function addStaticBotMessage(html) {
      const row = document.createElement("div");
      row.className = "nova-msg-row nova-bot";

      row.innerHTML = `
        <div class="nova-bubble nova-bubble-bot">
          <div class="nova-bot-header">
            <div class="nova-bot-header-icon">
              <img src="https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/novabot-2-f081v1SXHunuZjwP.png"/>
            </div>
            <div class="nova-bot-name">NOVABOT</div>
          </div>
          <div class="nova-bubble-content">${html}</div>
        </div>`;

      currentBotRow = row;
      chatBody.appendChild(row);
      scrollToBottom();
      playNovaSound();
    }

    /* ---------------------------------------------------------
       API
    --------------------------------------------------------- */
    async function callNovaApi(msg) {
      if (!config.API_PRIMARY) return { ok: false };

      try {
        const res = await fetch(config.API_PRIMARY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg })
        });

        const data = await res.json();
        return { ok: data.ok, reply: data.reply, actionCard: data.actionCard };
      } catch {
        return { ok: false };
      }
    }

    /* ==========================================================
       Cards + Actions
    ========================================================== */

    /** Insert card inside last bot bubble */
    function appendCardInsideLastBotBubble(cardEl) {
      const botRows = chatBody.querySelectorAll(".nova-msg-row.nova-bot");
      const lastBot = botRows[botRows.length - 1];

      if (!lastBot) {
        chatBody.appendChild(cardEl);
        scrollToBottom();
        return;
      }

      const content = lastBot.querySelector(".nova-bubble-content");

      if (content) {
        const sep = document.createElement("div");
        sep.className = "nova-card-separator";
        content.appendChild(sep);
        content.appendChild(cardEl);
      } else {
        lastBot.insertAdjacentElement("afterend", cardEl);
      }

      scrollToBottom();
    }

    /** Create Subscribe Card */
    function createSubscribeCard() {
      const card = document.createElement("div");
      card.className = "nova-card";

      const savedEmail = localStorage.getItem(EMAIL_KEY) || "";

      card.innerHTML = `
        <div class="nova-card-header">📧 اشترك في نوفا لينك</div>
        <div class="nova-card-text">ابدأ رحلتك معنا… نحو إنتاجيةٍ تنمو كل يوم. ✨</div>
        <input autocomplete="email" type="email" class="nova-card-input" value="${savedEmail}" placeholder="email@example.com">
        <div class="nova-card-actions">
          <button class="nova-card-btn nova-card-btn-primary">اشتراك</button>
          <button class="nova-card-btn nova-card-btn-secondary">صفحة الاشتراك</button>
        </div>`;
      return card;
    }

    /** Create Collaboration Card */
    function createCollaborationCard() {
      const card = document.createElement("div");
      card.className = "nova-card";

      const savedEmail = localStorage.getItem(EMAIL_KEY) || "";

      card.innerHTML = `
        <div class="nova-card-header">🤝 تواصل للتعاون</div>
        <div class="nova-card-text">أرسل وسيلة التواصل المناسبة لنرجع إليك.</div>
        <input autocomplete="email" class="nova-card-input" value="${savedEmail}" placeholder="email أو رقم هاتف">
        <div class="nova-card-actions">
          <button class="nova-card-btn nova-card-btn-primary">تواصل</button>
          <button class="nova-card-btn nova-card-btn-secondary">صفحة الخدمات</button>
        </div>`;
      return card;
    }

    /** Feedback helper */
    function showFeedback(text) {
      const row = document.createElement("div");
      row.className = "nova-action-feedback";
      row.style.cssText = `
        font-size: 12px;
        color: rgba(196,210,230,0.85);
        margin-top: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      row.textContent = text;

      currentBotRow
        ?.querySelector(".nova-bubble-content")
        ?.appendChild(row);
      scrollToBottom();

      setTimeout(() => (row.style.opacity = "1"), 10);

      setTimeout(() => {
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 300);
      }, 2500);
    }

    /** Handle card button click */
    function handleCardAction(btn) {
      const label = btn.textContent.trim();
      const card = btn.closest(".nova-card");
      if (!card) return;

      const inputEl = card.querySelector(".nova-card-input");
      const val = inputEl?.value?.trim() || "";

      if (val) localStorage.setItem(EMAIL_KEY, val);

      /* -------- اشتراك -------- */
      if (label === "اشتراك") {
        showFeedback("✔ تم الاشتراك");
        return;
      }

      if (label === "صفحة الاشتراك") {
        window.open(config.SUBSCRIBE_URL, "_blank");
        showFeedback("✔ تم فتح صفحة الاشتراك");
        return;
      }

      /* -------- صفحة الخدمات -------- */
      if (label === "صفحة الخدمات") {
        window.open(config.SERVICES_URL, "_blank");
        showFeedback("✔ تم فتح صفحة الخدمات");
        return;
      }

      /* -------- تواصل -------- */
      if (label === "تواصل") {
        const mail = config.CONTACT_EMAIL;
        const mailto = `mailto:${mail}?subject=تواصل من نوفا بوت&body=بيانات التواصل: ${encodeURIComponent(
          val
        )}`;
        window.location.href = mailto;
        showFeedback("✔ جاهز لإرسال بريدك الآن");
        return;
      }

      /* fallback */
      showFeedback("✔ تم التنفيذ");
    }

    /* Delegation listener */
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".nova-card-btn");
      if (btn) handleCardAction(btn);
    });

    /* ==========================================================
       Conversation Storage
    ========================================================== */
    function saveConversation() {
      const payload = {
        ts: Date.now(),
        history: chatHistory.slice(-20)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    function restoreConversation() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (!data.ts || !Array.isArray(data.history)) return;

      if (Date.now() - data.ts > 12 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      chatHistory = data.history;

      for (const msg of chatHistory) {
        if (msg.role === "user") addUserMessage(msg.content);
        else addStaticBotMessage(escapeHtml(msg.content).replace(/\n/g, "<br>"));
      }
    }

    /* ==========================================================
       إرسال الرسالة
    ========================================================== */
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(96, Math.max(36, input.scrollHeight)) + "px";
    });

    async function handleSend() {
      const text = input.value.trim();
      if (!text) return;

      addUserMessage(text);
      chatHistory.push({ role: "user", content: text });
      saveConversation();

      input.value = "";
      input.style.height = "36px";

      sendBtn.disabled = true;

      startThinkingBubble();

      let result;
      try {
        const apiPromise = callNovaApi(text);
        const delay = new Promise((r) =>
          setTimeout(r, 900 + Math.random() * 500)
        );
        const [res] = await Promise.all([apiPromise, delay]);
        result = res;
      } catch {
        result = { ok: false };
      }

      sendBtn.disabled = false;

      let reply = result.ok ? result.reply : "✨ واجهة نوفا بوت الآن في وضع التجربة.";

      typeReply(reply.replace(/\n/g, "<br>"));

      chatHistory.push({ role: "assistant", content: reply });
      saveConversation();
    }

    sendBtn.addEventListener("click", () => handleSend());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    /* ==========================================================
       فتح / إغلاق الشات
    ========================================================== */
    function openChat() {
      if (novaChatOpen) return;
      novaChatOpen = true;

      backdrop.classList.add("nova-open");

      if (isMobileViewport()) fabBtn.classList.add("nova-hidden");

      if (!chatHistory.length) {
        setTimeout(() => {
          startThinkingBubble();
          setTimeout(() => {
            typeReply(WELCOME_HTML);
            chatHistory.push({
              role: "assistant",
              content: WELCOME_HTML.replace(/<br>/g, "\n")
            });
            saveConversation();
          }, 900);
        }, 400);
      }

      setTimeout(() => input.focus({ preventScroll: true }), 350);
    }

    function closeChat() {
      if (!novaChatOpen) return;
      novaChatOpen = false;

      backdrop.classList.remove("nova-open");
      if (isMobileViewport())
        setTimeout(() => fabBtn.classList.remove("nova-hidden"), 300);
    }

    fabBtn.addEventListener("click", () =>
      novaChatOpen ? closeChat() : openChat()
    );
    closeBtn.addEventListener("click", () => closeChat());

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeChat();
    });

    /* زر الرجوع على الموبايل */
    window.addEventListener("popstate", () => {
      if (novaChatOpen) closeChat();
    });

    /* ==========================================================
       استعادة الجلسة
    ========================================================== */
    restoreConversation();
  }
})();
