export type RobotsDirective = "Allow" | "Disallow";

export type RobotsPresetId = "allow-all" | "block-all" | "block-private" | "wordpress" | "custom";

export type RobotsRule = {
  id: string;
  directive: RobotsDirective;
  path: string;
};

export type RobotsGroup = {
  id: string;
  userAgent: string;
  rules: RobotsRule[];
};

export type RobotsConfig = {
  siteUrl: string;
  sitemapUrl: string;
  groups: RobotsGroup[];
};

export type RobotsWarningLevel = "info" | "warning" | "danger";

export type RobotsWarning = {
  id: string;
  level: RobotsWarningLevel;
  message: string;
};

export type RobotsPreset = {
  id: RobotsPresetId;
  label: string;
  description: string;
  config: RobotsConfig;
  destructive?: boolean;
};
