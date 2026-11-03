// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("preserves clip length defaults across migrations and allows multi-value storage", async () => {
  const addColumn = readFileSync("prisma/migrations/20261025160000_add_default_clip_length/migration.sql", "utf8");
  const multi = readFileSync("prisma/migrations/20261103120000_multi_clip_lengths/migration.sql", "utf8");
  const backendAdd = readFileSync("../backend/src/migrations/sql/20261025_0004_default_clip_length.sql", "utf8");
  const backendMulti = readFileSync("../backend/src/migrations/sql/20261103_0002_multi_clip_lengths.sql", "utf8");

  for (const migrations of [
    [addColumn, multi],
    [backendAdd, backendMulti],
    [addColumn, backendMulti],
    [backendAdd, multi],
  ]) {
    const db = new PGlite();
    try {
      await db.exec("CREATE TABLE users (id text PRIMARY KEY); INSERT INTO users VALUES ('user-1');");
      await db.exec(migrations[0]);
      expect((await db.query("SELECT default_clip_length FROM users")).rows).toEqual([{ default_clip_length: "auto" }]);
      await db.exec("UPDATE users SET default_clip_length='long'");
      await db.exec(migrations[1]);
      expect((await db.query("SELECT default_clip_length FROM users")).rows).toEqual([{ default_clip_length: "long" }]);
      await db.exec("UPDATE users SET default_clip_length='short,extra_long'");
      expect((await db.query("SELECT default_clip_length FROM users")).rows).toEqual([{ default_clip_length: "short,extra_long" }]);
      await expect(db.exec("UPDATE users SET default_clip_length=NULL")).rejects.toThrow(/not-null constraint/);
    } finally {
      await db.close();
    }
  }
}, 30_000);
