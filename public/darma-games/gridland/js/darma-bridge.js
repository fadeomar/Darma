(function () {
  "use strict";

  var RUNTIME_SOURCE = "darma-gridland-runtime";
  var HOST_SOURCE = "darma-static-game-host";
  var GAME_ID = "gridland";
  var VERSION = 1;
  var connected = false;
  var EventManager = null;
  var Engine = null;
  var GameState = null;

  function isEmbedded() {
    return window.parent && window.parent !== window;
  }

  function post(type, payload) {
    if (!isEmbedded()) return;

    window.parent.postMessage(
      {
        source: RUNTIME_SOURCE,
        game: GAME_ID,
        version: VERSION,
        type: type,
        payload: payload || {},
      },
      window.location.origin
    );
  }

  function readState(reason) {
    var started = Engine && typeof Engine.isStarted === "function" ? Engine.isStarted() : false;
    var phase = Engine && typeof Engine.isNight === "function" && Engine.isNight() ? "night" : "day";
    var day = GameState && typeof GameState.dayNumber === "number" ? GameState.dayNumber : null;

    return {
      reason: reason || "state",
      started: started,
      paused: Boolean(Engine && Engine.paused),
      phase: phase,
      day: day,
    };
  }

  function sendState(reason) {
    post("state", readState(reason));
  }

  function deferState(reason) {
    window.setTimeout(function () {
      sendState(reason);
    }, 0);
  }

  function bindRuntimeEvents() {
    EventManager.bind("gameLoaded", function () {
      post("event", { name: "gameLoaded" });
      deferState("gameLoaded");
    });

    EventManager.bind("slotChosen", function () {
      deferState("slotChosen");
    });

    EventManager.bind("dayBreak", function (day) {
      post("event", { name: "dayBreak", day: day });
      deferState("dayBreak");
    });

    EventManager.bind("phaseChange", function () {
      post("event", { name: "phaseChange" });
      deferState("phaseChange");
    });

    EventManager.bind("pause", function () {
      deferState("pause");
    });

    EventManager.bind("afterUnpaused", function () {
      deferState("unpause");
    });

    EventManager.bind("gameOver", function () {
      post("event", { name: "gameOver" });
      deferState("gameOver");
    });

    EventManager.bind("prestige", function () {
      post("event", { name: "prestige" });
      deferState("prestige");
    });
  }

  function handleHostMessage(event) {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;

    var message = event.data;
    if (!message || typeof message !== "object") return;
    if (
      message.source !== HOST_SOURCE ||
      message.game !== GAME_ID ||
      message.version !== VERSION ||
      message.type !== "command"
    ) {
      return;
    }

    if (message.command === "request-state") {
      sendState("host-request");
    }
  }

  function connect(eventManager, engine, gameState) {
    if (connected) return;

    // Wait until Engine.init has established its own listeners. Binding before
    // EventManager.init would be unsafe because the original game resets the bus.
    if (
      eventManager.getListeners("slotChosen").length === 0 ||
      eventManager.getListeners("phaseChange").length === 0
    ) {
      window.setTimeout(function () {
        connect(eventManager, engine, gameState);
      }, 50);
      return;
    }

    connected = true;
    EventManager = eventManager;
    Engine = engine;
    GameState = gameState;

    bindRuntimeEvents();
    window.addEventListener("message", handleHostMessage);

    post("ready", {
      capabilities: ["state", "lifecycle-events"],
    });
    sendState("ready");
  }

  function waitForModules() {
    if (
      !window.requirejs ||
      typeof window.requirejs.defined !== "function" ||
      !window.requirejs.defined("app/eventmanager") ||
      !window.requirejs.defined("app/engine") ||
      !window.requirejs.defined("app/gamestate")
    ) {
      window.setTimeout(waitForModules, 50);
      return;
    }

    window.require(["app/eventmanager", "app/engine", "app/gamestate"], connect);
  }

  if (isEmbedded()) {
    waitForModules();
  }
})();
