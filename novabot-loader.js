// NovaBot v6.9 – Shadow DOM Loader (NovaLink AI)
// يعمل مع WebSite Builder (Hostinger) بدون تضارب CSS أو JS

(function () {
  const script = document.currentScript;
  if (!script) return;

  const API_URL =
    script.getAttribute("data-novabot-api") ||
    script.getAttribute("data-api") ||
    "https://novabot-brain.onrender.com";

  const LOCALE = script.getAttribute("data-novabot-locale") || "ar";

  const baseUrl = script.src.replace(/\/[^/]*$/, "/");
  const htmlUrl = baseUrl + "ui.html";
  const cssUrl = baseUrl + "ui.css";

  function fetchText(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) return "";
      return res.text();
    }).catch(function () {
      return "";
    });
  }

  function init() {
    Promise.all([fetchText(htmlUrl), fetchText(cssUrl)]).then(function ([html, css]) {
      if (!html) {
        console.error("[NovaBot] ui.html لم يتم تحميله correctamente");
        return;
      }

      var host = document.createElement("div");
      host.id = "novabot-widget-host";
      host.style.position = "fixed";
      host.style.bottom = "0";
      host.style.right = "0";
      host.style.zIndex = "99999";
      host.style.width = "0";
      host.style.height = "0";

      document.body.appendChild(host);

      var shadow = host.attachShadow({ mode: "open" });

      shadow.innerHTML = "<style>" + css + "</style>" + html;

      wireLogic(shadow);
    });
  }

  function wireLogic(root) {
    // نفس منطق 6.9 مع تحسينات
    var NOVA_CLIENT_CONFIG = {
      BRAND_NAME: "نوفا لينك",
      PRIMARY_COLOR: "#1b577c",
      ACCENT_COLOR: "#fe930e",
      API_PRIMARY: API_URL,
      API_FALLBACK: API_URL,
      CHANNEL: "web",
      BUSINESS_TYPE: "blog",
      LOCALE: LOCALE,
      SOUND_URL:
        "https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/new-notification-3-398649-RwIqiPPdJUta0dpV.mp3",
      SUBSCRIBE_URL: "https://novalink-ai.com/ashtrk-alan",
      SERVICES_URL: "https://novalink-ai.com/services-khdmat-nwfa-lynk",
      FEEDBACK_API: "",
      CONTACT_EMAIL: "contact@novalink-ai.com",
    };

    var WELCOME_HTML =
      "مرحباً بك في نوفا لينك 👋<br>" +
      "أنا نوفا بوت… جاهز لمساعدتك في أي سؤال حول الذكاء الاصطناعي وتطوير أعمالك.";

    var STORAGE_KEY = "novabot_v6.9_conversation";
    var STORAGE_TTL_MS = 12 * 60 * 60 * 1000;

    var fabBtn = root.getElementById("novaFabBtn");
    var backdrop = root.getElementById("novaBackdrop");
    var closeBtn = root.getElementById("novaCloseBtn");
    var chatBody = root.getElementById("novaChatBody");
    var input = root.getElementById("novaInput");
    var sendBtn = root.getElementById("novaSendBtn");

    if (!fabBtn || !backdrop || !chatBody || !input || !sendBtn) {
      console.error("[NovaBot] عناصر الواجهة غير مكتملة داخل ui.html");
      return;
    }

    var chatHistory = [];
    var soundCount = 0;
    var novaChatOpen = false;

    var currentBotRow = null;
    var typingIntervalId = null;
    var isTypingAnimationActive = false;
    var pendingCardCallbacks = [];

    var subscribeCardShown = false;
    var botCardShown = false;
    var businessCardShown = false;
    var collabCardShown = false;

    function escapeHtml(str) {
      return (str || "").replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c;
      });
    }

    function scrollToBottom() {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function playNovaSound() {
      if (!NOVA_CLIENT_CONFIG.SOUND_URL) return;
      if (soundCount >= 3) return;
      try {
        var a = new Audio(NOVA_CLIENT_CONFIG.SOUND_URL);
        a.play().catch(function () {});
        soundCount++;
      } catch (e) {}
    }

    function isSmallScreen() {
      return window.innerWidth <= 640;
    }

    function clearTypingState() {
      if (typingIntervalId) {
        clearInterval(typingIntervalId);
        typingIntervalId = null;
      }
      isTypingAnimationActive = false;
      pendingCardCallbacks.length = 0;
    }

    function startThinkingBubble() {
      clearTypingState();
      currentBotRow = document.createElement("div");
      currentBotRow.className = "nova-msg-row nova-bot";
      currentBotRow.innerHTML =
        '<div class="nova-bubble nova-bubble-bot">' +
        '  <div class="nova-bot-header">' +
        '    <div class="nova-bot-header-icon">' +
        '      <img src="https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/novabot-2-f081v1SXHunuZjwP.png" alt="NovaBot" />' +
        "    </div>" +
        '    <div class="nova-bot-name">NOVABOT</div>' +
        "  </div>" +
        '  <div class="nova-bubble-content">' +
        '    <div class="nova-typing">' +
        "      <span>نوفا بوت يكتب الآن</span>" +
        '      <span class="nova-typing-dots">' +
        '        <span class="nova-dot-typing"></span>' +
        '        <span class="nova-dot-typing"></span>' +
        '        <span class="nova-dot-typing"></span>' +
        "      </span>" +
        "    </div>" +
        "  </div>" +
        "</div>";

      chatBody.appendChild(currentBotRow);
      scrollToBottom();
    }

    function computeTypingSpeed(length) {
      if (length <= 80) return 25;
      if (length <= 180) return 18;
      if (length <= 350) return 12;
      return 9;
    }

    function typeReplyInCurrentBubble(html) {
      if (!currentBotRow) {
        startThinkingBubble();
      }
      var contentEl = currentBotRow.querySelector(".nova-bubble-content");
      if (!contentEl) return;

      clearTypingState();

      var full = (html || "").toString();
      var length = full.length || 1;
      var speed = computeTypingSpeed(length);

      var i = 0;
      isTypingAnimationActive = true;

      typingIntervalId = setInterval(function () {
        contentEl.innerHTML = full.slice(0, i);
        i++;
        scrollToBottom();
        if (i > length) {
          clearInterval(typingIntervalId);
          typingIntervalId = null;
          isTypingAnimationActive = false;
          playNovaSound();
          while (pendingCardCallbacks.length > 0) {
            var cb = pendingCardCallbacks.shift();
            try {
              cb();
            } catch (e) {}
          }
        }
      }, speed);
    }

    function addUserMessage(text) {
      var row = document.createElement("div");
      row.className = "nova-msg-row nova-user";
      row.innerHTML =
        '<div class="nova-bubble nova-bubble-user">' +
        escapeHtml(text) +
        "</div>";
      chatBody.appendChild(row);
      scrollToBottom();
    }

    function addStaticBotMessage(html) {
      var row = document.createElement("div");
      row.className = "nova-msg-row nova-bot";
      row.innerHTML =
        '<div class="nova-bubble nova-bubble-bot">' +
        '  <div class="nova-bot-header">' +
        '    <div class="nova-bot-header-icon">' +
        '      <img src="https://assets.zyrosite.com/YD0w46zZ5ZIrwlP8/novabot-2-f081v1SXHunuZjwP.png" alt="NovaBot" />' +
        "    </div>" +
        '    <div class="nova-bot-name">NOVABOT</div>' +
        "  </div>" +
        '  <div class="nova-bubble-content">' +
        html +
        "</div>" +
        "</div>";
      currentBotRow = row;
      chatBody.appendChild(row);
      scrollToBottom();
      playNovaSound();
    }

    async function callNovaApi(message) {
      try {
        var response = await fetch(NOVA_CLIENT_CONFIG.API_PRIMARY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
          return { ok: false, reply: "" };
        }

        var data = await response.json();
        return {
          ok: !!data.ok,
          reply: data.reply,
          actionCard: data.actionCard || null,
        };
      } catch (e) {
        console.error("❌ NovaBot API Error:", e);
        return { ok: false, reply: "" };
      }
    }

    function appendCardInsideLastBotBubble(cardEl) {
      if (!cardEl) return;

      var doAppend = function () {
        var botRows = chatBody.querySelectorAll(".nova-msg-row.nova-bot");
        var lastBot = botRows[botRows.length - 1];
        if (!lastBot) {
          chatBody.appendChild(cardEl);
          scrollToBottom();
          return;
        }
        var contentEl = lastBot.querySelector(".nova-bubble-content");
        if (!contentEl) {
          lastBot.insertAdjacentElement("afterend", cardEl);
        } else {
          var sep = document.createElement("div");
          sep.className = "nova-card-separator";
          contentEl.appendChild(sep);
          contentEl.appendChild(cardEl);
        }
        scrollToBottom();
      };

      if (isTypingAnimationActive) {
        pendingCardCallbacks.push(doAppend);
      } else {
        doAppend();
      }
    }

    function createSubscribeCard(type) {
      var card = document.createElement("div");
      card.className = "nova-card";

      var isBusiness = type === "business";

      var title = isBusiness ? "📧 طوّر عملك خطوة بخطوة" : "📧 اشترك في نوفا لينك";
      var text = isBusiness
        ? "إذا كان تطوّر أعمالك يهمك فعلاً، فمتابعة التحديثات في الذكاء الاصطناعي للأعمال ليست رفاهية. اترك بريدك لتصلك أحدث المقالات والأفكار التي تركّز على النتائج، لا الضجيج."
        : "ابدأ رحلتك معنا… نحو إنتاجيةٍ تنمو كل يوم. ✨";

      card.innerHTML =
        '<div class="nova-card-header">' + title + "</div>" +
        '<div class="nova-card-text">' + text + "</div>" +
        '<input type="email" class="nova-card-input" placeholder="example@email.com" />' +
        '<div class="nova-card-actions">' +
        '  <button class="nova-card-btn nova-card-btn-primary">اشتراك</button>' +
        '  <button class="nova-card-btn nova-card-btn-secondary" type="button">' +
        (isBusiness ? "زيارة صفحة الخدمات" : "زيارة صفحة الاشتراك") +
        "  </button>" +
        "</div>" +
        '<div class="nova-card-note">' +
        "يمكنك إلغاء الاشتراك في أي وقت من خلال الرابط الموجود في رسائل البريد." +
        "</div>";

      var emailInput = card.querySelector(".nova-card-input");
      var btnPrimary = card.querySelector(".nova-card-btn-primary");
      var btnSecondary = card.querySelector(".nova-card-btn-secondary");

      btnSecondary.addEventListener("click", function () {
        var url = isBusiness
          ? NOVA_CLIENT_CONFIG.SERVICES_URL
          : NOVA_CLIENT_CONFIG.SUBSCRIBE_URL;
        window.open(url, "_blank");
      });

      btnPrimary.addEventListener("click", function () {
        var email = (emailInput.value || "").trim();
        if (!email || email.indexOf("@") === -1) {
          alert("الرجاء إدخال بريد إلكتروني صالح.");
          return;
        }

        btnPrimary.disabled = true;
        btnPrimary.textContent = "جارٍ الإرسال...";

        if (NOVA_CLIENT_CONFIG.FEEDBACK_API) {
          try {
            fetch(NOVA_CLIENT_CONFIG.FEEDBACK_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "subscribe",
                email: email,
                intent: isBusiness ? "business_subscribe" : "newsletter_subscribe",
                source: isBusiness ? "novabot-business-card" : "novabot-subscribe-card",
                url: window.location.href,
                createdAt: new Date().toISOString(),
              }),
            }).catch(function () {});
          } catch (e) {}
        }

        btnPrimary.textContent = "تم الاشتراك ✅";
      });

      return card;
    }

    function createBotLeadCard() {
      var card = document.createElement("div");
      card.className = "nova-card";

      card.innerHTML =
        '<div class="nova-card-header">📧 بوت دردشة لعملك</div>' +
        '<div class="nova-card-text">' +
        "إذا تخيّلت أن موقعك أو مشروعك يملك نوفا بوت خاصًا به يرد على عملائك، يشرح خدماتك،" +
        " ويقترح عليهم ما يناسبهم… فهذا بالضبط ما يمكن أن نبنيه معك في نوفا لينك.<br><br>" +
        "اترك بريدك أو رقم واتساب وسنرتّب معك استشارة تعريفية مجانية قصيرة." +
        "</div>" +
        '<input type="text" class="nova-card-input" placeholder="بريدك الإلكتروني أو رقم واتساب" />' +
        '<div class="nova-card-actions">' +
        '  <button class="nova-card-btn nova-card-btn-primary">احجز استشارتك المجانية</button>' +
        "</div>" +
        '<div class="nova-card-note">' +
        "سيتم فتح رسالة بريد جاهزة لتأكيد طلبك، ويمكنك تعديلها قبل الإرسال." +
        "</div>";

      var contactInput = card.querySelector(".nova-card-input");
      var btn = card.querySelector(".nova-card-btn-primary");

      btn.addEventListener("click", function () {
        var contact = (contactInput.value || "").trim();
        if (!contact) {
          alert("الرجاء إدخال بريد إلكتروني أو رقم واتساب للتواصل معك.");
          return;
        }

        var subject = encodeURIComponent(
          "NovaBot Lead – طلب استشارة حول بوت دردشة"
        );
        var body = encodeURIComponent(
          "مرحبًا فريق نوفا لينك,\n\n" +
            "أرغب في استشارة مجانية حول إنشاء بوت دردشة بالذكاء الاصطناعي لمشروعي.\n\n" +
            "بيانات التواصل:\n" +
            contact +
            "\n\n" +
            "تم إرسال هذا الطلب عبر نوفا بوت على موقع نوفا لينك."
        );

        if (NOVA_CLIENT_CONFIG.FEEDBACK_API) {
          try {
            fetch(NOVA_CLIENT_CONFIG.FEEDBACK_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "lead",
                channel: "bot",
                contact: contact,
                source: "novabot-bot-lead-card",
                url: window.location.href,
                createdAt: new Date().toISOString(),
              }),
            }).catch(function () {});
          } catch (e) {}
        }

        window.location.href =
          "mailto:" +
          NOVA_CLIENT_CONFIG.CONTACT_EMAIL +
          "?subject=" +
          subject +
          "&body=" +
          body;
      });

      return card;
    }

    function createBusinessCard() {
      return createSubscribeCard("business");
    }

    function createCollaborationCard() {
      var card = document.createElement("div");
      card.className = "nova-card";

      card.innerHTML =
        '<div class="nova-card-header">📧 تعاون وشراكات مع نوفا لينك</div>' +
        '<div class="nova-card-text">' +
        "نوفا لينك منفتحة على التعاونات المهنية الجادة: رعاية محتوى، شراكات، ورش عمل، أو مشاريع مشتركة" +
        " ترتبط بالذكاء الاصطناعي للأعمال وتطوير المهارات.<br><br>" +
        "إذا كان لديك فكرة تعاون واضحة، يسعدنا أن نسمعها منك." +
        "</div>" +
        '<div class="nova-card-actions">' +
        '  <button class="nova-card-btn nova-card-btn-primary">تواصل عبر البريد</button>' +
        "</div>" +
        '<div class="nova-card-note">' +
        "برجاء توضيح نوع التعاون المقترح، والفئة المستهدفة، وأي تفاصيل إضافية." +
        "</div>";

      var btn = card.querySelector(".nova-card-btn-primary");
      btn.addEventListener("click", function () {
        var subject = encodeURIComponent("NovaLink Collaboration Opportunity");
        var body = encodeURIComponent(
          "مرحبًا فريق نوفا لينك,\n\n" +
            "أود مناقشة فرصة تعاون/شراكة معكم.\n\n" +
            "نوع التعاون المقترح:\n\n" +
            "الجمهور المستهدف:\n\n" +
            "تفاصيل إضافية:\n\n" +
            "تم إرسال هذا الطلب عبر نوفا بوت على موقع نوفا لينك."
        );

        if (NOVA_CLIENT_CONFIG.FEEDBACK_API) {
          try {
            fetch(NOVA_CLIENT_CONFIG.FEEDBACK_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "collaboration_interest",
                source: "novabot-collab-card",
                url: window.location.href,
                createdAt: new Date().toISOString(),
              }),
            }).catch(function () {});
          } catch (e) {}

        }

        window.location.href =
          "mailto:" +
          NOVA_CLIENT_CONFIG.CONTACT_EMAIL +
          "?subject=" +
          subject +
          "&body=" +
          body;
      });

      return card;
    }

    function showCardByType(cardType) {
      var card = null;

      switch (cardType) {
        case "subscribe":
          if (subscribeCardShown) return;
          subscribeCardShown = true;
          card = createSubscribeCard("default");
          break;
        case "business_subscribe":
          if (businessCardShown) return;
          businessCardShown = true;
          card = createBusinessCard();
          break;
        case "bot_lead":
          if (botCardShown) return;
          botCardShown = true;
          card = createBotLeadCard();
          break;
        case "collaboration":
          if (collabCardShown) return;
          collabCardShown = true;
          card = createCollaborationCard();
          break;
        default:
          return;
      }

      appendCardInsideLastBotBubble(card);
    }

    function saveConversation() {
      try {
        var payload = {
          ts: Date.now(),
          history: chatHistory.slice(-25),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {}
    }

    function restoreConversationIfFresh() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data || !data.ts || !Array.isArray(data.history)) return;
        if (Date.now() - data.ts > STORAGE_TTL_MS) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        chatHistory = data.history;

        chatHistory.forEach(function (msg) {
          if (msg.role === "user") {
            addUserMessage(msg.content || "");
          } else if (msg.role === "assistant") {
            addStaticBotMessage(
              escapeHtml(msg.content || "").replace(/\n/g, "<br>")
            );
          }
        });
      } catch (e) {}
    }

    function autoResizeTextarea() {
      input.style.height = "auto";
      var newHeight = Math.min(96, Math.max(32, input.scrollHeight));
      input.style.height = newHeight + "px";
    }
    input.addEventListener("input", autoResizeTextarea);

    function openChat() {
      if (novaChatOpen) return;
      novaChatOpen = true;

      backdrop.classList.add("nova-open");
      backdrop.setAttribute("aria-hidden", "false");

      if (isSmallScreen()) {
        fabBtn.classList.add("nova-hidden");
      } else {
        fabBtn.classList.remove("nova-hidden");
      }

      try {
        history.pushState({ novaBotOpen: true }, "", window.location.href);
      } catch (e) {}

      if (!chatHistory.length) {
        setTimeout(function () {
          startThinkingBubble();
          setTimeout(function () {
            typeReplyInCurrentBubble(WELCOME_HTML);
            chatHistory.push({
              role: "assistant",
              content: WELCOME_HTML.replace(/<br>/g, "\n"),
            });
            saveConversation();
          }, 900);
        }, 400);
      }

      setTimeout(function () {
        input.focus();
      }, isSmallScreen() ? 350 : 200);
    }

    function closeChat(options) {
      options = options || { fromBack: false };
      if (!novaChatOpen) return;
      novaChatOpen = false;

      backdrop.classList.remove("nova-open");
      backdrop.setAttribute("aria-hidden", "true");

      setTimeout(function () {
        if (isSmallScreen()) {
          fabBtn.classList.remove("nova-hidden");
        }
      }, 280);

      if (!options.fromBack) {
        try {
          if (history.state && history.state.novaBotOpen) {
            history.back();
          }
        } catch (e) {}
      }
    }

    async function handleSend() {
      var text = (input.value || "").trim();
      if (!text) return;

      addUserMessage(text);
      chatHistory.push({ role: "user", content: text });
      saveConversation();

      input.value = "";
      autoResizeTextarea();
      input.focus();
      sendBtn.disabled = true;

      startThinkingBubble();

      var result;
      try {
        var apiPromise = callNovaApi(text);
        var minDelayMs = 900 + Math.random() * 600;

        var apiResArr = await Promise.all([
          apiPromise,
          new Promise(function (resolve) {
            setTimeout(resolve, minDelayMs);
          }),
        ]);

        result = apiResArr[0] || {};
      } catch (e) {
        console.error("❌ NovaBot error:", e);
        result = {
          ok: false,
          reply: "",
        };
      } finally {
        sendBtn.disabled = false;
      }

      var replyText = "";
      if (result && result.ok && result.reply) {
        replyText = (result.reply || "").toString();
      } else {
        replyText =
          "✨ واجهة نوفا بوت الآن في وضع التجربة (بدون دماغ متصل).\n" +
          "سيتم قريبًا ربطها بمحرك ذكاء اصطناعي حقيقي ليرد على أسئلتك بشكل ذكي ومخصص.\n" +
          "إلى أن يتم ذلك، يمكنك استكشاف مقالات نوفا لينك للحصول على أفكار عملية إضافية.";
      }

      var replyHtml = replyText.replace(/\n/g, "<br>").trim();
      typeReplyInCurrentBubble(replyHtml);

      chatHistory.push({
        role: "assistant",
        content: replyText,
      });
      saveConversation();

      if (result && result.actionCard) {
        showCardByType(result.actionCard);
      }
    }

    fabBtn.addEventListener("click", function () {
      if (novaChatOpen) {
        closeChat();
      } else {
        openChat();
      }
    });

    closeBtn.addEventListener("click", function () {
      closeChat();
    });

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) {
        closeChat();
      }
    });

    setInterval(function () {
      if (!novaChatOpen) {
        fabBtn.classList.add("nova-idle");
        setTimeout(function () {
          fabBtn.classList.remove("nova-idle");
        }, 900);
      }
    }, 9000);

    sendBtn.addEventListener("click", handleSend);

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    window.addEventListener("popstate", function () {
      if (novaChatOpen) {
        closeChat({ fromBack: true });
      }
    });

    restoreConversationIfFresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
