#!/usr/bin/env tsx
import { checkWebsiteFavicons } from "../src/app/api/tools/favicon-checker/checkWebsite";
import type { FileValidationIssue } from "../src/app/tools/favicon-app-icon-generator/types";

type Level = FileValidationIssue["level"];

const LEVEL_ORDER: Level[] = ["error", "warning", "info", "success"];
const LEVEL_LABEL: Record<Level, string> = {
  error: "Critical",
  warning: "Recommended",
  info: "Optional",
  success: "Passed",
};

function printUsage() {
  console.log(`Darma favicon URL checker\n\nUsage:\n  npm run favicon:check -- https://example.com\n  npm run favicon:check -- https://example.com --json\n  npm run favicon:check -- https://example.com --strict\n\nOptions:\n  --json     Print the full JSON result.\n  --strict   Exit with code 1 when warnings are found, not only errors.\n`);
}

function groupIssues(issues: FileValidationIssue[]) {
  return LEVEL_ORDER.map((level) => ({ level, issues: issues.filter((issue) => issue.level === level) })).filter((group) => group.issues.length);
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const strict = args.includes("--strict");
  const help = args.includes("--help") || args.includes("-h");
  const url = args.find((arg) => !arg.startsWith("--"));

  if (help || !url) {
    printUsage();
    process.exitCode = help ? 0 : 1;
    return;
  }

  const result = await checkWebsiteFavicons(url);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const errorCount = result.issues.filter((issue) => issue.level === "error").length;
    const warningCount = result.issues.filter((issue) => issue.level === "warning").length;
    const successCount = result.issues.filter((issue) => issue.level === "success").length;

    console.log(`Darma favicon URL check`);
    console.log(`URL: ${result.resolvedUrl ?? result.inputUrl}`);
    if (result.manifestUrl) console.log(`Manifest: ${result.manifestUrl}`);
    console.log(`Assets checked: ${result.checkedAssets}`);
    console.log(`Summary: ${errorCount} critical · ${warningCount} recommended · ${successCount} passed`);

    groupIssues(result.issues).forEach((group) => {
      console.log(`\n${LEVEL_LABEL[group.level]}`);
      group.issues.forEach((issue) => {
        console.log(`- ${issue.title}: ${issue.message}`);
      });
    });
  }

  const hasErrors = result.issues.some((issue) => issue.level === "error");
  const hasWarnings = result.issues.some((issue) => issue.level === "warning");
  process.exitCode = hasErrors || (strict && hasWarnings) ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
