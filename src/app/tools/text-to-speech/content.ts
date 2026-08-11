export const TTS_FAQS = [
  {
    question: "Is Darma Text to Speech really free?",
    answer:
      "Yes. Darma TTS Studio does not require a subscription, paid plan, credits, or a Darma speech API. The speech engine runs in your browser after the selected Piper voice model is available locally.",
  },
  {
    question: "Does Darma TTS have a character or word limit?",
    answer:
      "Darma does not impose an artificial character, word, daily-generation, or credit quota. Long text is processed in smaller local chunks and merged into one WAV file. Practical generation time and memory usage still depend on your device and browser.",
  },
  {
    question: "Do I need to create an account or sign up?",
    answer:
      "No. You can open the tool, preview or download a voice, paste text, generate speech, and download the WAV without creating a Darma account or sharing profile data.",
  },
  {
    question: "Is my text uploaded to Darma?",
    answer:
      "No. Your text is synthesized locally inside a browser Web Worker. Darma does not need to upload your text or generated WAV to a TTS server. Public runtime, voice-model, and optional preview-sample files are fetched when needed.",
  },
  {
    question: "Can I preview a voice before downloading the full model?",
    answer:
      "Yes when that Piper voice publishes a sample. The preview is a small prerecorded public audio file, so you can hear the voice before downloading its larger local model. If a sample is unavailable, the voice can still be downloaded and used.",
  },
  {
    question: "Can I change the speech pace and volume?",
    answer:
      "Yes. TTS Studio provides local speech-pace, output-volume, voice-variation, and loudness-normalization controls. Pace is approximate because different Piper voice models respond differently to the same inference setting.",
  },
  {
    question: "Where is my generated-audio history stored?",
    answer:
      "Generation history is kept only in the current browser tab's memory. It is not saved to a Darma account or uploaded to a server, and it disappears when the page is reloaded, the tab is closed, or the session history is cleared.",
  },
] as const;
