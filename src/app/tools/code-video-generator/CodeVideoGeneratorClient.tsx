"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import JSZip from "jszip";
import {
  Captions,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  Clock3,
  Code2,
  FileArchive,
  FileCode2,
  FileJson2,
  FileText,
  Film,
  FolderOpen,
  ImageDown,
  MonitorPlay,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Badge, Button, Input, Select, Slider } from "@/components/ui";
import { ControlSection } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import {
  CODE_VIDEO_MAX_FILE_BYTES,
  buildProjectManifest,
  isSafeProjectPath,
  selectProjectSources,
  type ImportedCodeFile,
} from "./project";
import { CODE_VIDEO_PRESETS, DEFAULT_CODE_VIDEO_PROJECT } from "./presets";
import { buildPreviewDocument } from "./preview";
import {
  DEFAULT_CODE_VIDEO_SETTINGS,
  buildCodeVideoTimeline,
  buildTimelineSrt,
  buildVoiceoverNotes,
  formatClock,
  getPlaybackSnapshot,
  type CodeFileId,
  type CodeVideoProject,
  type CodeVideoSettings,
  type EditorTheme,
  type StudioLayout,
  type VideoFormat,
} from "./timeline";

type ImportStatus = { kind: "success" | "error"; message: string } | null;
type ExportStatus = { kind: "working" | "success" | "error"; message: string } | null;
type EditorInstance = Parameters<OnMount>[0];

const fileTabs: Array<{ id: CodeFileId; label: string; language: string }> = [
  { id: "html", label: "index.html", language: "html" },
  { id: "css", label: "style.css", language: "css" },
  { id: "js", label: "script.js", language: "javascript" },
];

const formatDetails: Record<VideoFormat, { label: string; dimensions: string; width: number; height: number }> = {
  youtube: { label: "YouTube 16:9", dimensions: "1280 × 720", width: 1280, height: 720 },
  short: { label: "Shorts 9:16", dimensions: "720 × 1280", width: 720, height: 1280 },
};

function sanitizeFileName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "darma-code-video";
}

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const recordingMimeTypes = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

function createMediaRecorder(stream: MediaStream, videoBitsPerSecond: number) {
  for (const mimeType of recordingMimeTypes) {
    if (!MediaRecorder.isTypeSupported(mimeType)) continue;
    try {
      return new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
    } catch {
      // Try the next browser-advertised encoder.
    }
  }
  return new MediaRecorder(stream, { videoBitsPerSecond });
}

const extensionForMimeType = (mimeType: string) => (mimeType.includes("mp4") ? "mp4" : "webm");
const nextAnimationFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function waitForCapturedVideoFrame(video: HTMLVideoElement) {
  let timeoutId = 0;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("The captured tab did not become ready.")), 8000);
  });
  const ready = (async () => {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        video.addEventListener("loadedmetadata", () => resolve(), { once: true });
        video.addEventListener("error", () => reject(new Error("The captured tab stream could not be read.")), { once: true });
      });
    }
    await video.play();
    const videoWithFrameCallback = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
    };
    if (videoWithFrameCallback.requestVideoFrameCallback) {
      await new Promise<void>((resolve) => videoWithFrameCallback.requestVideoFrameCallback?.(() => resolve()));
    } else {
      await nextAnimationFrame();
      await nextAnimationFrame();
    }
  })();
  try {
    await Promise.race([ready, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildBundleReadme(project: CodeVideoProject, settings: CodeVideoSettings, durationMs: number) {
  return `# ${project.title} — Darma Code Video production pack

Created locally by Darma Code Video Generator.

## Included
- Original HTML, CSS, and JavaScript
- Deterministic timeline JSON
- Voice-over production notes
- SRT captions
- Versioned project manifest

## Video plan
- Format: ${formatDetails[settings.format].label}
- Canvas: ${formatDetails[settings.format].dimensions}
- Layout: ${settings.layout}
- Estimated runtime: ${formatClock(durationMs)}
- Typing speed: ${settings.charsPerSecond} characters per second

No project code was uploaded to a server.
`;
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Film }) {
  return (
    <div className="code-video-summary-card">
      <span className="code-video-summary-icon"><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="min-w-0"><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>
    </div>
  );
}

function StatusMessage({ status }: { status: ImportStatus | ExportStatus }) {
  if (!status) return null;
  return (
    <div className={cn("code-video-status", status.kind === "error" && "code-video-status-error", status.kind === "success" && "code-video-status-success")} role={status.kind === "error" ? "alert" : "status"}>
      {status.kind === "success" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}
      {status.kind === "working" ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden /> : null}
      <span>{status.message}</span>
    </div>
  );
}

export default function CodeVideoGeneratorClient() {
  const [project, setProject] = useState<CodeVideoProject>({
    title: DEFAULT_CODE_VIDEO_PROJECT.title,
    html: DEFAULT_CODE_VIDEO_PROJECT.html,
    css: DEFAULT_CODE_VIDEO_PROJECT.css,
    js: DEFAULT_CODE_VIDEO_PROJECT.js,
  });
  const [settings, setSettings] = useState<CodeVideoSettings>({ ...DEFAULT_CODE_VIDEO_SETTINGS });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceTab, setSourceTab] = useState<CodeFileId>("html");
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageEditorRef = useRef<EditorInstance | null>(null);
  const playbackStartedAtRef = useRef<number | null>(null);
  const playbackStartElapsedRef = useRef(0);
  const playbackLastFrameRef = useRef(0);
  const playbackResolverRef = useRef<(() => void) | null>(null);

  const timeline = useMemo(() => buildCodeVideoTimeline(project, settings), [project, settings]);
  const snapshot = useMemo(() => getPlaybackSnapshot(timeline, project, elapsedMs), [elapsedMs, project, timeline]);
  const previewDocument = useMemo(() => buildPreviewDocument(snapshot.previewProject), [snapshot.previewProject]);
  const activeFile = fileTabs.find((file) => file.id === snapshot.activeFile) ?? fileTabs[0];
  const sourceFile = fileTabs.find((file) => file.id === sourceTab) ?? fileTabs[0];
  const totalCharacters = project.html.length + project.css.length + project.js.length;
  const totalLines = [project.html, project.css, project.js].reduce((total, source) => total + (source ? source.split("\n").length : 0), 0);
  const activeStageSource = snapshot.project[snapshot.activeFile];

  useEffect(() => {
    setElapsedMs(0);
    setIsPlaying(false);
    playbackStartedAtRef.current = null;
  }, [timeline]);

  useEffect(() => {
    if (!isPlaying) return;
    let frameId = 0;
    const tick = (timestamp: number) => {
      if (playbackStartedAtRef.current === null) playbackStartedAtRef.current = timestamp;
      const nextElapsed = playbackStartElapsedRef.current + (timestamp - playbackStartedAtRef.current);
      const isComplete = nextElapsed >= timeline.totalDurationMs;
      if (isComplete || timestamp - playbackLastFrameRef.current >= 1000 / 30) {
        playbackLastFrameRef.current = timestamp;
        setElapsedMs(isComplete ? timeline.totalDurationMs : nextElapsed);
      }
      if (isComplete) {
        setIsPlaying(false);
        playbackStartedAtRef.current = null;
        playbackResolverRef.current?.();
        playbackResolverRef.current = null;
        return;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, timeline.totalDurationMs]);

  useEffect(() => {
    const editor = stageEditorRef.current;
    if (!editor) return;
    const line = Math.max(1, activeStageSource.split("\n").length);
    editor.revealLineInCenterIfOutsideViewport(line);
    editor.setPosition({ lineNumber: line, column: 9999 });
  }, [activeStageSource]);

  const setSetting = <Key extends keyof CodeVideoSettings>(key: Key, value: CodeVideoSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateProjectFile = (file: CodeFileId, content: string) => {
    setProject((current) => ({ ...current, [file]: content }));
  };

  const togglePlayback = () => {
    const start = snapshot.isComplete ? 0 : elapsedMs;
    setElapsedMs(start);
    playbackStartElapsedRef.current = start;
    playbackStartedAtRef.current = null;
    playbackLastFrameRef.current = 0;
    setIsPlaying((current) => !current);
  };

  const restartPlayback = () => {
    setIsPlaying(false);
    playbackStartedAtRef.current = null;
    playbackLastFrameRef.current = 0;
    setElapsedMs(0);
  };

  const playFromStartAndWait = useCallback(() => new Promise<void>((resolve) => {
    playbackResolverRef.current = resolve;
    playbackStartElapsedRef.current = 0;
    playbackStartedAtRef.current = null;
    playbackLastFrameRef.current = 0;
    setElapsedMs(0);
    setIsPlaying(true);
  }), []);

  const readImportedFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length) return;
    setImportStatus(null);
    try {
      const imported: ImportedCodeFile[] = [];
      for (const file of selected) {
        if (file.size > 6_000_000) throw new Error(`${file.name} is too large to process safely in the browser.`);
        if (file.name.toLowerCase().endsWith(".zip")) {
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files).filter((entry) => !entry.dir);
          if (entries.length > 120) throw new Error("The ZIP contains too many files. Keep only the small project source.");
          for (const entry of entries) {
            if (!isSafeProjectPath(entry.name) || !/\.(html|css|js)$/i.test(entry.name)) continue;
            const content = await entry.async("string");
            if (new TextEncoder().encode(content).byteLength > CODE_VIDEO_MAX_FILE_BYTES) throw new Error(`${entry.name} exceeds the 700 KB file limit.`);
            imported.push({ name: entry.name, content });
          }
        } else if (/\.(html|css|js)$/i.test(file.name)) {
          const content = await file.text();
          if (new TextEncoder().encode(content).byteLength > CODE_VIDEO_MAX_FILE_BYTES) throw new Error(`${file.name} exceeds the 700 KB file limit.`);
          imported.push({ name: file.webkitRelativePath || file.name, content });
        }
      }
      const nextProject = selectProjectSources(imported);
      setProject(nextProject);
      setSourceTab(nextProject.html ? "html" : nextProject.css ? "css" : "js");
      const selectedFileCount = [nextProject.html, nextProject.css, nextProject.js].filter((source) => source.trim()).length;
      setImportStatus({ kind: "success", message: `Loaded ${selectedFileCount} detected entry file${selectedFileCount === 1 ? "" : "s"} locally from ${imported.length} supported source file${imported.length === 1 ? "" : "s"}.` });
    } catch (error) {
      setImportStatus({ kind: "error", message: error instanceof Error ? error.message : "Could not import this project." });
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void readImportedFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) void readImportedFiles(event.dataTransfer.files);
  };

  const selectPreset = (presetId: string) => {
    const preset = CODE_VIDEO_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    setProject({ title: preset.title, html: preset.html, css: preset.css, js: preset.js });
    setImportStatus({ kind: "success", message: `Loaded the ${preset.title} starter project.` });
  };

  const exportTimeline = () => downloadBlob(`${sanitizeFileName(project.title)}-timeline.json`, JSON.stringify(timeline, null, 2), "application/json");

  const exportBundle = async () => {
    setExportStatus({ kind: "working", message: "Building the local production pack…" });
    try {
      const zip = new JSZip();
      const source = zip.folder("source");
      source?.file("index.html", project.html);
      source?.file("style.css", project.css);
      source?.file("script.js", project.js);
      zip.file("timeline.json", JSON.stringify(timeline, null, 2));
      zip.file("project.json", buildProjectManifest(project));
      zip.file("voiceover-notes.md", buildVoiceoverNotes(timeline));
      zip.file("captions.srt", buildTimelineSrt(timeline));
      zip.file("README.md", buildBundleReadme(project, settings, timeline.totalDurationMs));
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(`${sanitizeFileName(project.title)}-production-pack.zip`, blob, "application/zip");
      setExportStatus({ kind: "success", message: "Production ZIP exported without uploading the project." });
    } catch (error) {
      setExportStatus({ kind: "error", message: error instanceof Error ? error.message : "Could not export the production pack." });
    }
  };

  const prepareCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Tab capture is not supported by this browser.");
    setPresentationMode(true);
    setElapsedMs(0);
    setIsPlaying(false);
    await nextAnimationFrame();
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    let displayStream: MediaStream | null = null;
    try {
      const displayOptions = {
        video: true,
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "exclude",
        monitorTypeSurfaces: "exclude",
      } as DisplayMediaStreamOptions;
      displayStream = await navigator.mediaDevices.getDisplayMedia(displayOptions);
      const videoTrack = displayStream.getVideoTracks()[0];
      const displaySurface = videoTrack?.getSettings().displaySurface;
      if (displaySurface && displaySurface !== "browser") throw new Error("Choose the current browser tab, not a window or the entire screen, so Darma can crop the stage accurately.");
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = displayStream;
      await waitForCapturedVideoFrame(video);
      const stage = stageRef.current;
      if (!stage) throw new Error("The recording stage is not available.");
      const rect = stage.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) throw new Error("The recording stage has no visible size.");
      const scaleX = video.videoWidth / window.innerWidth;
      const scaleY = video.videoHeight / window.innerHeight;
      const x = Math.max(0, Math.min(video.videoWidth - 1, rect.left * scaleX));
      const y = Math.max(0, Math.min(video.videoHeight - 1, rect.top * scaleY));
      return {
        displayStream,
        video,
        crop: {
          x,
          y,
          width: Math.max(1, Math.min(video.videoWidth - x, rect.width * scaleX)),
          height: Math.max(1, Math.min(video.videoHeight - y, rect.height * scaleY)),
        },
      };
    } catch (error) {
      displayStream?.getTracks().forEach((track) => track.stop());
      throw error;
    }
  };

  const recordVideo = async () => {
    if (isRecording) return;
    if (typeof MediaRecorder === "undefined") {
      setExportStatus({ kind: "error", message: "MediaRecorder is not available in this browser." });
      return;
    }
    setExportStatus({ kind: "working", message: "When prompted, choose this Darma tab. Recording starts automatically." });
    setIsRecording(true);
    let displayStream: MediaStream | null = null;
    let canvasStream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let drawFrame = 0;
    try {
      const capture = await prepareCapture();
      displayStream = capture.displayStream;
      const output = formatDetails[settings.format];
      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not create the recording canvas.");
      let drawing = true;
      const draw = () => {
        if (!drawing) return;
        context.fillStyle = "#08090c";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(capture.video, capture.crop.x, capture.crop.y, capture.crop.width, capture.crop.height, 0, 0, canvas.width, canvas.height);
        drawFrame = requestAnimationFrame(draw);
      };
      draw();
      canvasStream = canvas.captureStream(30);
      recorder = createMediaRecorder(canvasStream, settings.format === "youtube" ? 8_000_000 : 6_000_000);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise<void>((resolve, reject) => {
        if (!recorder) return reject(new Error("The browser could not start the recording."));
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error("The browser could not finish the recording."));
      });
      const captureEnded = new Promise<never>((_, reject) => {
        const track = displayStream?.getVideoTracks()[0];
        if (track) track.onended = () => reject(new Error("Tab sharing ended before the video was complete."));
      });
      recorder.start(250);
      await nextAnimationFrame();
      await Promise.race([playFromStartAndWait(), captureEnded]);
      await nextAnimationFrame();
      await nextAnimationFrame();
      recorder.stop();
      await stopped;
      drawing = false;
      cancelAnimationFrame(drawFrame);
      const finalMimeType = recorder.mimeType || "video/webm";
      const blob = new Blob(chunks, { type: finalMimeType });
      downloadBlob(`${sanitizeFileName(project.title)}-${settings.format}.${extensionForMimeType(finalMimeType)}`, blob, finalMimeType);
      setExportStatus({ kind: "success", message: `Video exported as ${extensionForMimeType(finalMimeType).toUpperCase()} at ${output.dimensions}.` });
    } catch (error) {
      playbackResolverRef.current = null;
      setIsPlaying(false);
      setExportStatus({ kind: "error", message: error instanceof Error ? error.message : "The recording was cancelled." });
    } finally {
      if (recorder && recorder.state !== "inactive") recorder.stop();
      cancelAnimationFrame(drawFrame);
      displayStream?.getTracks().forEach((track) => track.stop());
      canvasStream?.getTracks().forEach((track) => track.stop());
      setPresentationMode(false);
      setIsRecording(false);
    }
  };

  const captureThumbnail = async () => {
    setExportStatus({ kind: "working", message: "Choose this Darma tab to capture the clean final stage." });
    let displayStream: MediaStream | null = null;
    try {
      const capture = await prepareCapture();
      displayStream = capture.displayStream;
      const output = formatDetails[settings.format];
      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not create the thumbnail canvas.");
      context.drawImage(capture.video, capture.crop.x, capture.crop.y, capture.crop.width, capture.crop.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not encode the thumbnail.")), "image/png"));
      downloadBlob(`${sanitizeFileName(project.title)}-thumbnail-frame.png`, blob, "image/png");
      setExportStatus({ kind: "success", message: `Thumbnail frame exported at ${output.dimensions}.` });
    } catch (error) {
      setExportStatus({ kind: "error", message: error instanceof Error ? error.message : "The thumbnail capture was cancelled." });
    } finally {
      displayStream?.getTracks().forEach((track) => track.stop());
      setPresentationMode(false);
    }
  };

  const shouldShowCode = settings.layout === "split" || settings.layout === "code" || (settings.layout === "alternate" && snapshot.focus === "code");
  const shouldShowPreview = settings.layout === "split" || (settings.layout === "alternate" && snapshot.focus === "preview");
  const monacoTheme = settings.theme === "light" ? "vs" : "vs-dark";
  const stageFormat = formatDetails[settings.format];

  return (
    <div className={cn("code-video-shell", presentationMode && "code-video-presentation-mode")}>
      <div className="code-video-summary-grid" aria-label="Project summary">
        <SummaryCard label="Source" value={`${totalLines} lines`} detail={`${totalCharacters.toLocaleString()} characters`} icon={FileCode2} />
        <SummaryCard label="Timeline" value={`${timeline.steps.length} steps`} detail={`${formatClock(timeline.totalDurationMs)} estimated`} icon={Clock3} />
        <SummaryCard label="Output" value={stageFormat.label} detail={stageFormat.dimensions} icon={Video} />
        <SummaryCard label="Privacy" value="Browser-only" detail="No upload or external API" icon={CheckCircle2} />
      </div>

      <div className="code-video-workspace">
        <aside className="code-video-controls" aria-label="Code video controls">
          <ControlSection title="Project input" description="Upload a ZIP or select HTML, CSS, and JavaScript files. Processing stays on this device.">
            <div className={cn("code-video-dropzone", isDragging && "code-video-dropzone-active")} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
              <Upload className="h-5 w-5" aria-hidden /><strong>Drop a small project here</strong><span>ZIP, HTML, CSS, or JS</span>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} leftIcon={<FolderOpen className="h-4 w-4" aria-hidden />}>Choose files</Button>
              <input ref={fileInputRef} type="file" accept=".zip,.html,.css,.js,text/html,text/css,text/javascript" multiple className="sr-only" onChange={handleFileInput} />
            </div>
            <label className="code-video-field"><span>Starter project</span><Select defaultValue={DEFAULT_CODE_VIDEO_PROJECT.id} onChange={(event) => selectPreset(event.target.value)}>{CODE_VIDEO_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.title}</option>)}</Select></label>
            <label className="code-video-field"><span>Project title</span><Input value={project.title} onChange={(event) => setProject((current) => ({ ...current, title: event.target.value }))} /></label>
            <StatusMessage status={importStatus} />
          </ControlSection>

          <ControlSection title="Video frame" description="Choose the recording canvas and how code and preview share the stage.">
            <label className="code-video-field"><span>Format</span><Select value={settings.format} onChange={(event) => { const format = event.target.value as VideoFormat; setSettings((current) => ({ ...current, format, layout: format === "short" && current.layout === "split" ? "alternate" : current.layout })); }}><option value="youtube">YouTube 16:9</option><option value="short">Shorts 9:16</option></Select></label>
            <label className="code-video-field"><span>Layout</span><Select value={settings.layout} onChange={(event) => setSetting("layout", event.target.value as StudioLayout)}><option value="split">Code + live preview</option><option value="alternate">Alternate code and preview</option><option value="code">Code only</option></Select></label>
            <label className="code-video-field"><span>Editor theme</span><Select value={settings.theme} onChange={(event) => setSetting("theme", event.target.value as EditorTheme)}><option value="darma-dark">Darma dark</option><option value="vs-dark">VS Code dark</option><option value="light">Light</option></Select></label>
            <div className="code-video-check-grid"><label><input type="checkbox" checked={settings.showExplorer} onChange={(event) => setSetting("showExplorer", event.target.checked)} /> File explorer</label><label><input type="checkbox" checked={settings.showLineNumbers} onChange={(event) => setSetting("showLineNumbers", event.target.checked)} /> Line numbers</label></div>
          </ControlSection>

          <ControlSection title="Typing direction" description="The timeline is deterministic; natural rhythm changes timing, not source code.">
            <label className="code-video-slider-field"><span><b>Typing speed</b><output>{settings.charsPerSecond} chars/s</output></span><Slider min={12} max={180} step={1} value={settings.charsPerSecond} onChange={(event) => setSetting("charsPerSecond", Number(event.target.value))} /></label>
            <label className="code-video-slider-field"><span><b>Line pause</b><output>{settings.linePauseMs} ms</output></span><Slider min={0} max={700} step={5} value={settings.linePauseMs} onChange={(event) => setSetting("linePauseMs", Number(event.target.value))} /></label>
            <label className="code-video-slider-field"><span><b>Section pause</b><output>{settings.sectionPauseMs} ms</output></span><Slider min={0} max={2500} step={50} value={settings.sectionPauseMs} onChange={(event) => setSetting("sectionPauseMs", Number(event.target.value))} /></label>
            <label className="code-video-check-row"><input type="checkbox" checked={settings.humanVariation} onChange={(event) => setSetting("humanVariation", event.target.checked)} /><span><b>Natural rhythm</b><small>Small deterministic timing variation between characters.</small></span></label>
          </ControlSection>

          <ControlSection title="Outputs" description="Recording asks for tab permission, then crops only the clean stage.">
            <Button fullWidth onClick={() => void recordVideo()} loading={isRecording} leftIcon={<MonitorPlay className="h-4 w-4" aria-hidden />}>Record &amp; export video</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => void captureThumbnail()} leftIcon={<ImageDown className="h-4 w-4" aria-hidden />}>Thumbnail</Button>
              <Button variant="secondary" size="sm" onClick={() => void exportBundle()} leftIcon={<FileArchive className="h-4 w-4" aria-hidden />}>ZIP pack</Button>
              <Button variant="outline" size="sm" onClick={exportTimeline} leftIcon={<FileJson2 className="h-4 w-4" aria-hidden />}>Timeline</Button>
              <Button variant="outline" size="sm" onClick={() => downloadBlob(`${sanitizeFileName(project.title)}-captions.srt`, buildTimelineSrt(timeline), "text/plain")} leftIcon={<Captions className="h-4 w-4" aria-hidden />}>Captions</Button>
            </div>
            <StatusMessage status={exportStatus} />
          </ControlSection>
        </aside>

        <section className="code-video-main" aria-label="Code video preview and timeline">
          <div className="code-video-stage-toolbar">
            <div><Badge variant="soft">Live production stage</Badge><span>{snapshot.currentStep?.label ?? "Ready"}</span></div>
            <div className="code-video-stage-toolbar-actions"><span>{formatClock(elapsedMs)} / {formatClock(timeline.totalDurationMs)}</span><Button variant="ghost" size="icon" onClick={restartPlayback}><RotateCcw className="h-4 w-4" aria-hidden />Restart</Button><Button size="sm" onClick={togglePlayback} leftIcon={isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}>{isPlaying ? "Pause" : snapshot.isComplete ? "Replay" : "Play"}</Button></div>
          </div>

          <div className="code-video-stage-viewport">
            <div ref={stageRef} className={cn("code-video-stage", settings.format === "short" && "code-video-stage-short", settings.theme === "light" && "code-video-stage-light")} style={{ aspectRatio: settings.format === "youtube" ? "16 / 9" : "9 / 16" }}>
              <header className="code-video-window-bar"><div className="code-video-window-dots"><span /><span /><span /></div><p><Code2 className="h-3.5 w-3.5" aria-hidden /> {project.title || "Untitled code video"}</p><span>{stageFormat.dimensions}</span></header>
              <div className="code-video-stage-body">
                {settings.showExplorer && shouldShowCode ? <aside className="code-video-explorer" aria-label="Project files"><p>EXPLORER</p><strong><ChevronRight className="h-3 w-3" aria-hidden /> PROJECT</strong>{fileTabs.map((file) => <div key={file.id} className={cn(file.id === snapshot.activeFile && "is-active")}><FileCode2 className="h-3.5 w-3.5" aria-hidden />{file.label}</div>)}</aside> : null}
                <div className={cn("code-video-stage-content", shouldShowCode && shouldShowPreview && "is-split")}>
                  {shouldShowCode ? <section className="code-video-editor-pane"><div className="code-video-editor-tabs">{fileTabs.map((file) => <span key={file.id} className={cn(file.id === snapshot.activeFile && "is-active")}>{file.label}</span>)}</div><Editor value={snapshot.project[snapshot.activeFile]} language={activeFile.language} theme={monacoTheme} onMount={(editor) => { stageEditorRef.current = editor; }} options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, lineNumbers: settings.showLineNumbers ? "on" : "off", lineNumbersMinChars: 3, glyphMargin: false, folding: false, renderLineHighlight: "line", scrollBeyondLastLine: false, automaticLayout: true, fontSize: settings.format === "short" ? 14 : 15, lineHeight: settings.format === "short" ? 22 : 23, padding: { top: 16, bottom: 16 }, wordWrap: "off", cursorBlinking: isPlaying ? "phase" : "solid", overviewRulerLanes: 0, hideCursorInOverviewRuler: true }} /></section> : null}
                  {shouldShowPreview ? <section className="code-video-preview-pane"><div className="code-video-preview-bar"><span><span className="code-video-preview-dot" /> localhost:3000</span><Badge variant="outline">Live preview</Badge></div><iframe title="Code video project preview" sandbox="allow-scripts" srcDoc={previewDocument} /></section> : null}
                </div>
              </div>
              <footer className="code-video-stage-footer"><span>{snapshot.currentStep?.label ?? "Ready"}</span><div><span style={{ width: `${Math.max(0, Math.min(100, snapshot.progress * 100))}%` }} /></div><strong>{Math.round(snapshot.progress * 100)}%</strong></footer>
            </div>
          </div>

          <div className="code-video-scrubber"><Slider min={0} max={Math.max(1, timeline.totalDurationMs)} step={25} value={Math.min(elapsedMs, timeline.totalDurationMs)} disabled={isRecording} onChange={(event) => { setIsPlaying(false); playbackStartedAtRef.current = null; playbackLastFrameRef.current = 0; setElapsedMs(Number(event.target.value)); }} /></div>

          <div className="code-video-timeline-panel"><div className="code-video-panel-heading"><div><WandSparkles className="h-4 w-4" aria-hidden /><span><b>Generated timeline</b><small>Every output is rebuilt from the same deterministic steps.</small></span></div><Badge variant="outline">{timeline.steps.length} steps</Badge></div><div className="code-video-timeline-list">{timeline.steps.map((step, index) => <button type="button" key={step.id} className={cn("code-video-timeline-step", index === snapshot.currentStepIndex && "is-active")} onClick={() => { const start = timeline.steps.slice(0, index).reduce((sum, item) => sum + item.durationMs, 0); setIsPlaying(false); playbackStartedAtRef.current = null; playbackLastFrameRef.current = 0; setElapsedMs(start); }}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong><small>{step.file ? `${step.file.toUpperCase()} · ` : ""}{formatClock(step.durationMs, true)}</small></div><Badge variant={step.focus === "preview" ? "accent" : "outline"}>{step.focus}</Badge></button>)}</div></div>

          <div className="code-video-source-panel"><div className="code-video-panel-heading"><div><FileText className="h-4 w-4" aria-hidden /><span><b>Source project</b><small>Edit the final source; the timeline and preview rebuild automatically.</small></span></div><Badge variant="soft">Local draft</Badge></div><div className="code-video-source-tabs" role="tablist" aria-label="Source files">{fileTabs.map((file) => <button key={file.id} type="button" role="tab" aria-selected={sourceTab === file.id} className={cn(sourceTab === file.id && "is-active")} onClick={() => setSourceTab(file.id)}><FileCode2 className="h-4 w-4" aria-hidden />{file.label}</button>)}</div><div className="code-video-source-editor"><Editor value={project[sourceTab]} language={sourceFile.language} theme={monacoTheme} onChange={(value) => updateProjectFile(sourceTab, value ?? "")} options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 14, lineHeight: 22, scrollBeyondLastLine: false, wordWrap: "on", tabSize: 2, padding: { top: 16, bottom: 16 } }} /></div></div>
        </section>
      </div>

      {presentationMode ? <div className="code-video-capture-note" aria-live="polite">{isRecording ? <CircleStop className="h-4 w-4" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}{isRecording ? "Darma is recording the clean stage. Do not switch tabs." : "Preparing the clean capture stage…"}</div> : null}
    </div>
  );
}
