import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import crypto from "crypto";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const db = new Database(dbPath);

function generateCuid(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

async function main() {
  const now = new Date().toISOString();

  // 自社情報を作成（存在しない場合のみ）
  const existingOffice = db
    .prepare("SELECT id FROM Office WHERE id = ?")
    .get("default-office");

  if (!existingOffice) {
    db.prepare(
      `INSERT INTO Office (id, name, zipCode, address, phone, email, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "default-office",
      "株式会社サンプル",
      "100-0001",
      "東京都千代田区1-1-1",
      "03-1234-5678",
      "info@example.com",
      now,
      now
    );
    console.log("Office created");
  } else {
    console.log("Office already exists");
  }

  // 管理者ユーザーを作成（存在しない場合のみ）
  const existingPerson = db
    .prepare("SELECT id FROM Person WHERE email = ?")
    .get("admin@example.com");

  if (!existingPerson) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const personId = generateCuid();

    db.prepare(
      `INSERT INTO Person (id, name, email, password, role, position, isActive, officeId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      personId,
      "管理者",
      "admin@example.com",
      hashedPassword,
      "admin",
      "システム管理者",
      1,
      "default-office",
      now,
      now
    );
    console.log("Admin user created");
  } else {
    console.log("Admin user already exists");
  }

  console.log("\nSeed completed successfully!");
  console.log("Login credentials:");
  console.log("  Email: admin@example.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });
