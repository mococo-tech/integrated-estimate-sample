import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const dbPath = path.join(__dirname, "dev.db");

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
  },
  datasource: {
    url: `file:${dbPath}`,
  },
});
