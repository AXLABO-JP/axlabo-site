/* AXLABO Web Chat Widget (2026-08-12, Track F)
 * 既存ページのDOM/CSS/JSには一切触れず、自己完結した1つのフローティングボタン+
 * パネルだけを追加する。API通信に失敗しても既存ページの動作には影響しない
 * (try/catchで囲み、失敗時は静かに諦める)。
 */
(function () {
  "use strict";
  var API_URL = "https://chat.axlabo.com/api/public/chat";
  var STORAGE_KEY = "axlabo_chat_session_id";

  function getSessionId() {
    try {
      var id = window.localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      return "web-" + Date.now();
    }
  }

  var css = [
    "#axlabo-chat-btn{position:fixed;right:20px;bottom:20px;z-index:9999;",
    "width:56px;height:56px;border-radius:50%;background:#c8622c;color:#fff;",
    "border:none;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;font-size:24px;",
    "display:flex;align-items:center;justify-content:center;}",
    "#axlabo-chat-btn:hover{background:#9c4a1f;}",
    "#axlabo-chat-panel{position:fixed;right:20px;bottom:88px;z-index:9999;",
    "width:320px;max-width:90vw;height:420px;max-height:70vh;background:#fff;",
    "border:1px solid #e1ddd3;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.2);",
    "display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,",
    "BlinkMacSystemFont,'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',",
    "'Noto Sans JP',sans-serif;}",
    "#axlabo-chat-panel.open{display:flex;}",
    "#axlabo-chat-header{background:#161311;color:#f5f3ef;padding:12px 14px;",
    "font-size:14px;font-weight:600;display:flex;justify-content:space-between;",
    "align-items:center;}",
    "#axlabo-chat-close{background:none;border:none;color:#f5f3ef;cursor:pointer;",
    "font-size:18px;line-height:1;padding:0;}",
    "#axlabo-chat-body{flex:1;overflow-y:auto;padding:12px;background:#f5f3ef;}",
    ".axlabo-chat-msg{margin-bottom:10px;max-width:85%;padding:8px 12px;",
    "border-radius:10px;font-size:13px;line-height:1.5;white-space:pre-wrap;}",
    ".axlabo-chat-msg.user{background:#c8622c;color:#fff;margin-left:auto;",
    "border-bottom-right-radius:2px;}",
    ".axlabo-chat-msg.bot{background:#fff;color:#161311;border:1px solid #e1ddd3;",
    "border-bottom-left-radius:2px;}",
    ".axlabo-chat-msg.system{background:transparent;color:#5a5650;font-size:11px;",
    "text-align:center;max-width:100%;}",
    "#axlabo-chat-form{display:flex;border-top:1px solid #e1ddd3;padding:8px;",
    "gap:6px;background:#fff;}",
    "#axlabo-chat-input{flex:1;border:1px solid #e1ddd3;border-radius:8px;",
    "padding:8px 10px;font-size:13px;font-family:inherit;resize:none;}",
    "#axlabo-chat-send{background:#c8622c;color:#fff;border:none;border-radius:8px;",
    "padding:0 14px;font-size:13px;cursor:pointer;}",
    "#axlabo-chat-send:disabled{opacity:.5;cursor:default;}",
  ].join("");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var btn = document.createElement("button");
  btn.id = "axlabo-chat-btn";
  btn.setAttribute("aria-label", "チャットで質問する");
  btn.textContent = "💬"; // 💬

  var panel = document.createElement("div");
  panel.id = "axlabo-chat-panel";
  panel.innerHTML =
    '<div id="axlabo-chat-header"><span>AXLABOへのご質問</span>' +
    '<button id="axlabo-chat-close" aria-label="閉じる">×</button></div>' +
    '<div id="axlabo-chat-body"></div>' +
    '<form id="axlabo-chat-form">' +
    '<textarea id="axlabo-chat-input" rows="1" placeholder="メッセージを入力…" maxlength="1000"></textarea>' +
    '<button type="submit" id="axlabo-chat-send">送信</button>' +
    "</form>";

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var body = panel.querySelector("#axlabo-chat-body");
  var form = panel.querySelector("#axlabo-chat-form");
  var input = panel.querySelector("#axlabo-chat-input");
  var sendBtn = panel.querySelector("#axlabo-chat-send");
  var opened = false;
  var greeted = false;

  function addMessage(text, cls) {
    var el = document.createElement("div");
    el.className = "axlabo-chat-msg " + cls;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  btn.addEventListener("click", function () {
    opened = !opened;
    panel.classList.toggle("open", opened);
    if (opened && !greeted) {
      greeted = true;
      addMessage("こんにちは。AXLABOのサービスについて何でもお尋ねください(AIが対応します)。", "bot");
    }
  });
  panel.querySelector("#axlabo-chat-close").addEventListener("click", function () {
    opened = false;
    panel.classList.remove("open");
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var message = input.value.trim();
    if (!message) return;
    addMessage(message, "user");
    input.value = "";
    sendBtn.disabled = true;
    addMessage("入力中…", "system");
    var typingEl = body.lastChild;

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), message: message }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        body.removeChild(typingEl);
        addMessage(data && data.reply ? data.reply : "申し訳ありません、応答の取得に失敗しました。", "bot");
      })
      .catch(function () {
        body.removeChild(typingEl);
        addMessage("通信エラーが発生しました。恐れ入りますがお問い合わせフォームよりご連絡ください。", "bot");
      })
      .finally(function () {
        sendBtn.disabled = false;
      });
  });
})();
