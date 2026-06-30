(function () {
  "use strict";

  var STORAGE_THEME = "darma-hextris-theme";
  var STORAGE_SOUND = "darma-hextris-sound";
  var soundEnabled = localStorage.getItem(STORAGE_SOUND) !== "off";
  var audioContext = null;

  var themes = {
    classic: {
      background: "rgb(236,240,241)",
      center: "rgb(44,62,80)",
      hexBg: "rgb(236,240,241)",
      colors: ["#e74c3c", "#f1c40f", "#3498db", "#2ecc71"],
      tinted: ["rgb(241,163,155)", "rgb(246,223,133)", "rgb(151,201,235)", "rgb(150,227,183)"]
    },
    neon: {
      background: "rgb(9,14,28)",
      center: "rgb(17,24,39)",
      hexBg: "rgb(30,41,59)",
      colors: ["#22d3ee", "#a78bfa", "#fb7185", "#34d399"],
      tinted: ["rgb(125,211,252)", "rgb(196,181,253)", "rgb(253,164,175)", "rgb(110,231,183)"]
    },
    citrus: {
      background: "rgb(255,247,237)",
      center: "rgb(67,32,7)",
      hexBg: "rgb(254,215,170)",
      colors: ["#f97316", "#eab308", "#84cc16", "#14b8a6"],
      tinted: ["rgb(253,186,116)", "rgb(253,224,71)", "rgb(190,242,100)", "rgb(94,234,212)"]
    },
    violet: {
      background: "rgb(250,245,255)",
      center: "rgb(59,7,100)",
      hexBg: "rgb(233,213,255)",
      colors: ["#7c3aed", "#db2777", "#2563eb", "#059669"],
      tinted: ["rgb(196,181,253)", "rgb(249,168,212)", "rgb(147,197,253)", "rgb(110,231,183)"]
    }
  };

  function getAudioContext() {
    if (!soundEnabled) return null;
    var Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    if (!audioContext) audioContext = new Context();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function tone(frequency, duration, delay, type, gainValue, destination) {
    var ctx = getAudioContext();
    if (!ctx) return;
    var out = destination || ctx.destination;
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    var start = ctx.currentTime + (delay || 0);
    var end = start + duration;
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.05, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(out);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  }

  function burst(base, count, type, gain) {
    for (var i = 0; i < count; i++) {
      tone(base + i * 64, 0.045, i * 0.025, type || "triangle", gain || 0.04);
    }
  }

  var sounds = {
    rotate: function () { tone(300, 0.035, 0, "triangle", 0.028); },
    settle: function () { tone(170, 0.05, 0, "sine", 0.032); },
    clear: function () { burst(380, 4, "sine", 0.045); },
    speed: function () { tone(95, 0.06, 0, "sawtooth", 0.026); },
    pause: function () { tone(220, 0.06, 0, "triangle", 0.035); },
    start: function () { burst(260, 3, "square", 0.03); },
    lose: function () {
      tone(210, 0.14, 0, "triangle", 0.045);
      tone(150, 0.18, 0.1, "triangle", 0.04);
      tone(105, 0.22, 0.22, "triangle", 0.04);
    },
    restart: function () { burst(330, 2, "square", 0.032); },
    theme: function () { burst(440, 3, "triangle", 0.03); }
  };

  window.DarmaHextrisAudio = {
    play: function (name) {
      if (soundEnabled && sounds[name]) sounds[name]();
    },
    unlock: getAudioContext,
    setEnabled: function (enabled) {
      soundEnabled = enabled;
      localStorage.setItem(STORAGE_SOUND, enabled ? "on" : "off");
    },
    isEnabled: function () {
      return soundEnabled;
    }
  };

  function hexToRgb(hex) {
    var value = hex.replace("#", "");
    var bigint = parseInt(value, 16);
    return "rgb(" + ((bigint >> 16) & 255) + "," + ((bigint >> 8) & 255) + "," + (bigint & 255) + ")";
  }

  function applyGameGlobals(themeName) {
    var theme = themes[themeName] || themes.classic;
    window.colors = theme.colors.slice();
    window.hexColorsToTintedColors = {};
    window.rgbToHex = {};
    window.rgbColorsToTintedColors = {};

    theme.colors.forEach(function (color, index) {
      var rgb = hexToRgb(color);
      window.hexColorsToTintedColors[color] = theme.tinted[index];
      window.rgbToHex[rgb] = color;
      window.rgbColorsToTintedColors[rgb] = theme.tinted[index];
    });

    window.hexagonBackgroundColor = theme.hexBg;
    window.hexagonBackgroundColorClear = theme.hexBg.replace("rgb", "rgba").replace(")", ", 0.5)");
    window.centerBlue = theme.center;
    document.body.style.backgroundColor = theme.background;
    var canvas = document.getElementById("canvas");
    if (canvas) canvas.style.backgroundColor = theme.background;
  }

  function applyTheme(themeName, shouldRestart) {
    var theme = themes[themeName] ? themeName : "classic";
    document.body.setAttribute("data-darma-hex-theme", theme);
    localStorage.setItem(STORAGE_THEME, theme);
    applyGameGlobals(theme);

    Array.prototype.forEach.call(document.querySelectorAll(".darmaHexThemeBtn"), function (button) {
      var active = button.getAttribute("data-theme") === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (shouldRestart && typeof init === "function") {
      clearSaveState();
      init(1);
    }
  }

  window.DarmaHextrisThemes = {
    applySaved: function () {
      applyTheme(localStorage.getItem(STORAGE_THEME) || "classic", false);
    },
    apply: applyTheme
  };

  function updateSoundButton(button) {
    if (!button) return;
    var enabled = window.DarmaHextrisAudio.isEnabled();
    button.textContent = enabled ? "Sound on" : "Sound off";
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  window.addEventListener("DOMContentLoaded", function () {
    window.DarmaHextrisThemes.applySaved();

    Array.prototype.forEach.call(document.querySelectorAll(".darmaHexThemeBtn"), function (button) {
      button.addEventListener("click", function () {
        window.DarmaHextrisThemes.apply(button.getAttribute("data-theme") || "classic", true);
        window.DarmaHextrisAudio.play("theme");
      });
    });

    var soundButton = document.getElementById("darmaHexSoundToggle");
    updateSoundButton(soundButton);
    if (soundButton) {
      soundButton.addEventListener("click", function () {
        window.DarmaHextrisAudio.setEnabled(!window.DarmaHextrisAudio.isEnabled());
        updateSoundButton(soundButton);
        window.DarmaHextrisAudio.play("theme");
      });
    }

    ["pointerdown", "keydown", "touchstart"].forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        window.DarmaHextrisAudio.unlock();
      }, { once: true, passive: true });
    });
  });
}());
