export type RobotsDirective = "Allow" | "Disallow";

export type RobotsPresetId =
  | "public-site"
  | "staging-block"
  | "wordpress"
  | "ecommerce"
  | "documentation"
  | "crawler-split";

export type RobotsRule = {
  id: string;
  directive: RobotsDirective;
  path: string;
};

export type RobotsGroup = {
  id: string;
  userAgents: string[];
  rules: RobotsRule[];
};

export type RobotsConfig = {
  siteUrl: string;
  sitemapUrls: string[];
  groups: RobotsGroup[];
};

export type RobotsCheckSeverity = "success" | "info" | "warning" | "danger";

export type RobotsCheck = {
  id: string;
  level: RobotsCheckSeverity;
  title: string;
  message: string;
  groupId?: string;
  ruleId?: string;
};

export type RobotsStats = {
  groups: number;
  userAgents: number;
  rules: number;
  allowRules: number;
  disallowRules: number;
  blockAllGroups: number;
  sitemaps: number;
  bytes: number;
  duplicateRules: number;
};

export type RobotsBuildResult = {
  output: string;
  checks: RobotsCheck[];
  stats: RobotsStats;
};

export type RobotsPreset = {
  id: RobotsPresetId;
  label: string;
  description: string;
  config: RobotsConfig;
  destructive?: boolean;
};

export type RobotsRouteTest = {
  crawler: string;
  input: string;
  normalizedPath: string;
  allowed: boolean;
  matchedAgents: string[];
  matchedRule?: RobotsRule;
  reason: string;
};

export type RobotsParseResult = {
  config: RobotsConfig;
  notices: string[];
};
