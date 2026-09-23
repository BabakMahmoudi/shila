import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(migrationsDir);
  return {
    test: {
      setupFiles: ["./tests/setup.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
