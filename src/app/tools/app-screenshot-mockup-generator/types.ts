export type MockupDevice = "phone" | "tablet" | "laptop" | "desktop" | "browser" | "card";
export type MockupOrientation = "portrait" | "landscape";
export type MockupBackgroundMode = "solid" | "gradient" | "mesh" | "image";
export type MockupExportPackId = "landing" | "social" | "app-store" | "documentation" | "complete";
export type MockupFitMode = "cover" | "contain";
export type MockupShadowStyle = "none" | "soft" | "deep" | "float";
export type MockupAlignment = "center" | "left" | "right";

export type MockupInput = {
  screenshotDataUrl: string;
  screenshotName: string;
  screenshotWidth: number;
  screenshotHeight: number;
  backgroundImageDataUrl: string;
  device: MockupDevice;
  orientation: MockupOrientation;
  exportPackId: MockupExportPackId;
  backgroundMode: MockupBackgroundMode;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  foregroundColor: string;
  mutedColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  badge: string;
  footer: string;
  showText: boolean;
  showBadge: boolean;
  showFooter: boolean;
  showDeviceChrome: boolean;
  showReflection: boolean;
  showSafeArea: boolean;
  fitMode: MockupFitMode;
  shadow: MockupShadowStyle;
  alignment: MockupAlignment;
  canvasWidth: number;
  canvasHeight: number;
  padding: number;
  frameRadius: number;
  deviceScale: number;
  rotate: number;
  browserUrl: string;
  filePrefix: string;
};

export type MockupExportSize = {
  id: string;
  label: string;
  filename: string;
  width: number;
  height: number;
  description: string;
};

export type MockupExportPack = {
  id: MockupExportPackId;
  title: string;
  description: string;
  sizes: MockupExportSize[];
};

export type GeneratedMockupAsset = {
  filename: string;
  width: number;
  height: number;
  mimeType: "image/png";
  blob: Blob;
  previewUrl: string;
};

export type MockupWarning = {
  id: string;
  level: "info" | "warning" | "error";
  title: string;
  message: string;
};

export type MockupReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type PackageCheckResult = {
  id: string;
  level: "pass" | "warning" | "error";
  title: string;
  message: string;
};
