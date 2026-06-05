(function(scope) {
  function __getHost() {
    return "https://sys.akia.ai";
  }

  function __makeParams(kv) {
    var parts = [];
    for (var k in kv) {
      if (kv.hasOwnProperty(k) && !!kv[k]) {
        parts.push(k + '=' + kv[k]);
      }
    }
    return parts.join('&');
  }

  function cls(el, className) {
    if (!el) {
      return;
    }
    if (el.classList) {
      el.classList.add(className);
    } else {
      el.className += " " + className;
    }
  }

  function uncls(el, className) {
    if (!el) {
      return;
    }
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(className, "");
    }
  }

  function __storage() {
    var args = arguments;
    if (args.length === 1) {
      try {
        return localStorage.getItem(args[0])
      } catch (_) {
        console.warn("localstorage is being weird")
        return ""
      }
    } else if (args.length === 2) {
      try {
        return localStorage.setItem(args[0], args[1])
      } catch (_) {
        console.warn("localstorage is being weird")
      }
    } else console.error("no")
  }

  const AkiaChat = {
    initialized: false,
    open: function(message) {
      do {
        document.getElementById("__akia-chat-checkbox").checked = true;
        document.querySelector(".__akia-chat-box-iframe")
          .contentWindow
          .postMessage({
            type: "state",
            message: "sendMessage",
            prefilledMessage: message || "",
          }, "*");
      } while (!document.getElementById("__akia-chat-checkbox"));
    },
    init: function() {
      if (AkiaChat.initialized) {
        return;
      }
      AkiaChat.initialized = true;
      this.config = {
        token: "42a60121-5aad-47d6-bcb3-4c64a0fcb9ef",
        color: "#23c2cc" || "rgb(58, 206, 206)",
        hoverColor: "#1EA5AD" || "#E86219",
        sound: true,
        padBottom: 0,
        padRight: 0,
      };

      if (!this.config.token || this.config.token == "") {
        return console.error("Akia chat misconfigured");
      }

      function showNotification(message) {
        var notification = document.getElementById("__akia-notification");
        var span = document.createElement("span");
        span.innerHTML = message.replace(/</g, '&lt;').substring(0, 70).trim() + (message.length > 70 ? "..." : "");
        var text = span.innerText;
        var curText = notification.innerText;
        if (curText !== text) {
          notification.innerText = text;
          notification.className = "";
        } else {
          notification.className = notification.className + " ";
        }
      }

      var storedScrollTop = 0;
      var head = document.getElementsByTagName("head")[0];
      var title = null;
      var originalTitle = null;
      if (head) {
        title = head.getElementsByTagName("title")[0];
        originalTitle = title ? title.innerText : null;
      }

      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = __getHost() + "/website_chat_css/42a60121-5aad-47d6-bcb3-4c64a0fcb9ef/chat.css";
      head.appendChild(link);

      var akiaRoot = document.createElement("div");
      akiaRoot.className = "__akia_chat_root";
      document.body.appendChild(akiaRoot);

      var chatCheckbox = document.createElement("input");
      chatCheckbox.type = "checkbox";
      chatCheckbox.id = "__akia-chat-checkbox";
      chatCheckbox.setAttribute("aria-labelledby" , "__akia-chat-label")

      var chatIconWrapper = document.createElement("span");
      chatIconWrapper.className = "__akia-chat-icon-wrapper";
      chatIconWrapper.style.marginBottom = this.config.padBottom + "px";
      chatIconWrapper.style.marginRight = this.config.padRight + "px";

      var chatIcon = document.createElement("label");
      chatIcon.className =
        __storage("__akia_has_unread") === "true"
        ? "__akia-chat-icon __akia-new-notif"
        : "__akia-chat-icon";
      chatIcon.id = "__akia-chat-label";
      chatIcon.htmlFor = "__akia-chat-checkbox";
      chatIcon.title = "Web Chat Toggle";
      chatIcon.setAttribute("aria-label", "Web Chat Toggle");
      chatIcon.setAttribute("role", "button");
      chatIcon.setAttribute("aria-pressed", "false");
      chatIcon.tabIndex = 0;
      var toggleSpan = document.createElement("span");
      toggleSpan.style.position = "absolute";
      toggleSpan.style.right = "-99999px";
      toggleSpan.innerHTML = "Web Chat Toggle";
      chatIcon.appendChild(toggleSpan);

      // Akia-pfp style ambient blobs + CSS bowtie. The inner wrapper clips the
      // drifting blobs to the icon's circle without clipping the ::before glow ring.
      var iconInner = document.createElement("span");
      iconInner.className = "__akia-chat-icon-inner";
      var blobNames = ["light", "soft", "warm", "cool"];
      for (var bi = 0; bi < blobNames.length; bi++) {
        var blob = document.createElement("span");
        blob.className = "__akia-chat-icon-blob __akia-chat-icon-blob-" + blobNames[bi];
        iconInner.appendChild(blob);
      }
      var bowtieLeft = document.createElement("span");
      bowtieLeft.className = "__akia-chat-icon-bowtie-left";
      var bowtieRight = document.createElement("span");
      bowtieRight.className = "__akia-chat-icon-bowtie-right";
      iconInner.appendChild(bowtieLeft);
      iconInner.appendChild(bowtieRight);
      chatIcon.appendChild(iconInner);

      // X icon shown when chat is open. Hidden by default; CSS reveals it on :checked.
      var closeX = document.createElement("span");
      closeX.className = "__akia-chat-icon-close-x";
      chatIcon.appendChild(closeX);
      akiaRoot.appendChild(chatCheckbox);
      chatIconWrapper.appendChild(chatIcon);
      akiaRoot.appendChild(chatIconWrapper);

      var notification = document.createElement("div");
      notification.id = "__akia-notification";
      notification.className = "hidden";
      notification.style.marginBottom = this.config.padBottom + "px";
      notification.style.marginRight = this.config.padRight + "px";
      notification.onclick = () => chatIcon.click();
      notification.addEventListener("animationend", e => {
        switch (e.animationName) {
          case "__akia_fadeOut":
            notification.className = "hidden";
            notification.innerText = "";
            break;
          case "__akia_fadeIn":
            break;
        }
      })
      akiaRoot.appendChild(notification);

      var chatNotification = document.createElement("span");
      chatNotification.className = "__akia-chat-notification-icon";
      chatIconWrapper.appendChild(chatNotification);

      var soundPlayed = 0;
      var intervalRunning = false;
      scope.addEventListener("message", function(e) {
        if (e.origin !== __getHost()) {
          return;
        }

        if (e.data.type === "showNotification") {
          if (!document.getElementById("__akia-chat-checkbox").checked) {
            __storage("__akia_has_unread", true);
            chatIcon.className = "__akia-chat-icon __akia-new-notif";
            if (!intervalRunning) {
              if (!!scope.__akiaTitleInterval) {
                clearInterval(scope.__akiaTitleInterval);
              }
              scope.__akiaTitleInterval = setInterval(function() {
                if (!!title) {
                  if (title.innerText == originalTitle) {
                    title.innerText = "(1) New Messages";
                  } else {
                    title.innerText = originalTitle;
                  }
                }
              }, 1500);

              intervalRunning = true;
            }
            showNotification(e.data.message);
          }
          if (!document.hasFocus() || !document.getElementById("__akia-chat-checkbox").checked) {
            if ((new Date()).getTime() - (scope.akia_n_sound_played || 0) > 2000) {
              var audio = new Audio(__getHost() + '/sounds/webchat-notification.wav');
              audio.play().catch(e => {});
              scope.akia_n_sound_played = (new Date()).getTime();
            }
          }
        } else if (e.data.type === "hideNotification") {
          __storage("__akia_has_unread", false);
          chatIcon.className = "__akia-chat-icon";
          notification.innerText = "";
          notification.className = "hidden";
          if (!!scope.__akiaTitleInterval) {
            clearInterval(scope.__akiaTitleInterval);
          }
          if (!!title) {
            title.innerText = originalTitle;
          }
          intervalRunning = false;
        } else if (e.data.type === "showWelcomeMessage") {
          var now = (new Date()).getTime();
          chatIcon.className = "__akia-chat-icon __akia-new-notif";
          if (now - (__storage("__akia_last_prompt_match") || 0) > (5 * 60 * 1000)) {
            if (!!e.data.message) {
              showNotification(e.data.message);
              __storage("__akia_last_prompt_match", now);
            }
          }
        } else if (e.data.type === "hideChat") {
          chatIcon.className = "__akia-chat-icon";
          notification.innerText = "";
          notification.className = "hidden";
          document.getElementById("__akia-chat-checkbox").checked = false;
          uncls(document.getElementsByTagName("body")[0], "__akia-chat-modal-open");
          document.body.scrollTop = storedScrollTop;
        } else if (e.data.type === "setSessionID") {
          __storage("__akia_session_id", e.data.sessionID)
        } else if (e.data.type === "openChat") {
          __storage("__akia_has_unread", false);
          chatIcon.className = "__akia-chat-icon";
          notification.innerText = "";
          notification.className = "hidden";
          storedScrollTop = document.body.scrollTop;
          cls(document.getElementsByTagName("body")[0], "__akia-chat-modal-open");
          iframe.contentWindow.postMessage({type: "state", message: "open"}, "*");
        } else if (e.data.type === "activateUser") {
          __storage("__akia_first_activation", "yes");
        } else if (e.data.type === "setHostHash") {
          var nextHash = String(e.data.hash || "");
          if (nextHash && nextHash.charAt(0) !== "#") {
            nextHash = "#" + nextHash;
          }
          // Setting location.hash fires the host's hashchange event so akia.js
          // (and anything else) can react.
          scope.location.hash = nextHash;
        }
      }, false);

      var chatBox = document.createElement("div");
      chatBox.className = "__akia-chat-box";
      chatBox.style.marginBottom = this.config.padBottom + "px";
      chatBox.style.marginRight = this.config.padRight + "px";

      var iframe = document.createElement("iframe");
      iframe.className = "__akia-chat-box-iframe";

      var sessionID = __storage("__akia_session_id");

      iframe.src =
        __getHost() +
        "/website_chat/" + this.config.token +
        (sessionID ? "/" + sessionID : "") +
        '?' + __makeParams({
          is_new: __storage("__akia_first_activation") !== "yes",
          referer: encodeURIComponent(scope.location.href),
          last_prompt: __storage("__akia_last_prompt_match") || 0,
          lang: (document.documentElement.lang || navigator.language || '').split('-')[0],
        });

      chatBox.appendChild(iframe);

      var powered = document.createElement("a");

      powered.className = "__akia-powered-by";
      powered.href="https://akia.com/powered-by-akia?hotel_name=" + encodeURIComponent("Kai Zanzibar Hotel and Spa");
      powered.innerText = "Powered By Akia";
      powered.target = "_blank";
      powered.rel = "dofollow";

      chatBox.appendChild(powered);

      var originalViewportContent = "";
      var originalViewport;

      chatCheckbox.addEventListener("change", function(e) {
        __storage("__akia_first_activation", "yes");
        if (chatCheckbox.checked) {
          __storage("__akia_has_unread", false);
          chatIcon.className = "__akia-chat-icon";
          chatIcon.setAttribute("aria-pressed", "true");
          notification.innerText = "";
          notification.className = "hidden";
          storedScrollTop = document.body.scrollTop;
          cls(document.getElementsByTagName("body")[0], "__akia-chat-modal-open");
          iframe.contentWindow.postMessage({type: "state", message: "open"}, "*");
          originalViewport = document.querySelector("meta[name=viewport]");
          if (! originalViewport) {
            originalViewport = document.createElement("meta");
            originalViewport.setAttribue("name", "viewport");
            originalViewport.setAttribue("content", "");
            (document.querySelector("head") || document).appendChild(originalViewport);
          }
          originalViewportContent = originalViewport.content;
          originalViewport.content = "width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, minimal-ui";
        } else {
          chatIcon.setAttribute("aria-pressed", "false");
          uncls(document.getElementsByTagName("body")[0], "__akia-chat-modal-open");
          document.body.scrollTop = storedScrollTop;
          iframe.contentWindow.postMessage({type: "state", message: "close"}, "*");
          originalViewport = document.querySelector("meta[name=viewport]");
          if (originalViewport) {
            originalViewport.content = originalViewportContent;
          }
        }
        iframe.contentWindow.postMessage({type: "width", message: scope.innerWidth}, "*");
      });

      chatIcon.addEventListener("keydown", function(e) {
        // Check for Space (key code 32 or key " ") or Enter (key code 13 or key "Enter")
        if (e.key === " " || e.key === "Enter" || e.keyCode === 32 || e.keyCode === 13) {
          e.preventDefault(); // Prevent page scroll on Space
          chatCheckbox.checked = !chatCheckbox.checked;
          // Trigger change event so the existing handler fires
          chatCheckbox.dispatchEvent(new Event('change'));
        }
      });

      scope.addEventListener("blur", function (e) {
        iframe.contentWindow.postMessage({type: "state", message: "blur"}, "*");
      });
      scope.addEventListener("focus", function (e) {
        iframe.contentWindow.postMessage({type: "state", message: "focus"}, "*");
      });

      scope.addEventListener("resize", function (_e) {
        iframe.contentWindow.postMessage({type: "width", message: scope.innerWidth}, "*");
      });

      akiaRoot.appendChild(chatBox);

      // SPA Navigation Tracking
      var lastTrackedUrl = scope.location.href;

      function __notifyPageChange() {
        var currentUrl = scope.location.href;
        if (currentUrl !== lastTrackedUrl) {
          lastTrackedUrl = currentUrl;
          iframe.contentWindow.postMessage({
            type: "pageChange",
            url: currentUrl
          }, "*");
        }
      }

      var originalPushState = scope.history.pushState;
      scope.history.pushState = function() {
        originalPushState.apply(scope.history, arguments);
        __notifyPageChange();
      };

      var originalReplaceState = scope.history.replaceState;
      scope.history.replaceState = function() {
        originalReplaceState.apply(scope.history, arguments);
        __notifyPageChange();
      };

      scope.addEventListener("popstate", function() {
        __notifyPageChange();
      });
    },
  };
  scope.AkiaChat = scope.AkiaChat || AkiaChat;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scope.AkiaChat.init)
  } else {
    scope.AkiaChat.init()
  }
})(window);
