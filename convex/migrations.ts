import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);

// pnpm dlx convex run migrations:run
export const run = migrations.runner([
  internal.migrations._1_2025_06_16_add_live_state_to_threads,
]);

export const _1_2025_06_16_add_live_state_to_threads = migrations.define({
  table: "threads",
  migrateOne(_ctx, doc) {
    if (doc.liveState) return doc;
    return {
      liveState: "completed" as const,
    };
  },
  parallelize: true,
});
