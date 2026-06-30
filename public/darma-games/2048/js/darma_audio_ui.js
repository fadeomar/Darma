(function () {
  "use strict";

  var STORAGE_THEME = "darma-2048-theme";
  var STORAGE_SOUND = "darma-2048-sound";
  var audioContext = null;
  var soundEnabled = localStorage.getItem(STORAGE_SOUND) !== "off";

  function getAudioContext() {
    if (!soundEnabled) return null;
    if (!audioContext) {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      audioContext = new Context();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  }

  function tone(frequency, duration, delay, type, gainValue, destination) {
    var ctx = getAudioContext();
    if (!ctx) return;
    var output = destination || ctx.destination;
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    var start = ctx.currentTime + (delay || 0);
    var end = start + duration;

    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.08, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  function chord(notes, duration, type, gainValue) {
    var ctx = getAudioContext();
    if (!ctx) return;
    var master = ctx.createGain();
    master.gain.value = 0.75;
    master.connect(ctx.destination);
    notes.forEach(function (note, index) {
      tone(note, duration, index * 0.018, type, gainValue, master);
    });
  }

  var sounds = {
    move: function () { tone(280, 0.035, 0, "triangle", 0.035); },
    merge: function () { chord([420, 560, 700], 0.07, "sine", 0.055); },
    invalid: function () { tone(120, 0.06, 0, "sawtooth", 0.026); },
    win: function () { chord([523.25, 659.25, 783.99, 1046.5], 0.12, "sine", 0.065); },
    lose: function () {
      tone(180, 0.12, 0, "triangle", 0.05);
      tone(132, 0.16, 0.09, "triangle", 0.05);
    },
    restart: function () { chord([330, 440], 0.06, "square", 0.035); },
    theme: function () { chord([392, 493.88, 587.33], 0.05, "triangle", 0.035); }
  };

  window.Darma2048Audio = {
    play: function (name) {
      if (soundEnabled && sounds[name]) sounds[name]();
    },
    setEnabled: function (enabled) {
      soundEnabled = enabled;
      localStorage.setItem(STORAGE_SOUND, enabled ? "on" : "off");
    },
    isEnabled: function () {
      return soundEnabled;
    },
    unlock: getAudioContext
  };

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_THEME, theme);
    Array.prototype.forEach.call(document.querySelectorAll(".darma-theme-button"), function (button) {
      var active = button.getAttribute("data-theme") === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function updateSoundButton(button) {
    if (!button) return;
    var enabled = window.Darma2048Audio.isEnabled();
    button.textContent = enabled ? "Sound on" : "Sound off";
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  window.addEventListener("DOMContentLoaded", function () {
    applyTheme(localStorage.getItem(STORAGE_THEME) || "classic");

    Array.prototype.forEach.call(document.querySelectorAll(".darma-theme-button"), function (button) {
      button.addEventListener("click", function () {
        applyTheme(button.getAttribute("data-theme") || "classic");
        window.Darma2048Audio.play("theme");
      });
    });

    var soundButton = document.querySelector(".darma-sound-toggle");
    updateSoundButton(soundButton);
    if (soundButton) {
      soundButton.addEventListener("click", function () {
        window.Darma2048Audio.setEnabled(!window.Darma2048Audio.isEnabled());
        updateSoundButton(soundButton);
        window.Darma2048Audio.play("theme");
      });
    }

    ["pointerdown", "keydown", "touchstart"].forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        window.Darma2048Audio.unlock();
      }, { once: true, passive: true });
    });
  });
}());
