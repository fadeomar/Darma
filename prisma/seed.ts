import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function sh(cmd: string) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function tryCmd(cmd: string): boolean {
  try {
    sh(cmd);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const container = "darma-db";
  const dumpPath = path.resolve(process.cwd(), "neon.dump");

  if (!existsSync(dumpPath)) {
    throw new Error(`Seed file not found: ${dumpPath}`);
  }

  // 1) Copy dump into container
  sh(`docker cp "${dumpPath}" ${container}:/tmp/neon.dump`);

  // 2) Try pg_restore first (custom-format dumps)
  //    Use flags that make reseeding safe:
  //    --clean/--if-exists: drop objects before recreating
  //    --no-owner/--no-privileges: avoid role/permission issues from Neon
  const restoredWithPgRestore = tryCmd(
    `docker exec -i ${container} pg_restore -U darma -d darma --clean --if-exists --no-owner --no-privileges /tmp/neon.dump`,
  );

  if (!restoredWithPgRestore) {
    // 3) Fallback to psql (plain SQL dumps)
    sh(`docker exec -i ${container} psql -U darma -d darma -f /tmp/neon.dump`);
  }

  // 4) Quick verification
  sh(`docker exec -i ${container} psql -U darma -d darma -c "\\dt"`);

  // Optional counts (won't fail the seed if table doesn't exist)
  tryCmd(
    `docker exec -i ${container} psql -U darma -d darma -c "select count(*) from \\"User\\";"`,
  );
  tryCmd(
    `docker exec -i ${container} psql -U darma -d darma -c "select count(*) from \\"Element\\";"`,
  );

  console.log("\n✅ Seed finished.");
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e);
  process.exit(1);
});
