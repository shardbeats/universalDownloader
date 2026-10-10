const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const db = new DatabaseSync(path.join(__dirname, "history.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    platform TEXT NOT NULL DEFAULT 'other',
    icon TEXT,
    thumbnail TEXT,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_history_platform ON history(platform);
  CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC);
`);

const upsertStmt = db.prepare(`
  INSERT INTO history (url, title, platform, icon, thumbnail, date)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(url) DO UPDATE SET
    title = excluded.title,
    platform = excluded.platform,
    icon = excluded.icon,
    thumbnail = excluded.thumbnail,
    date = excluded.date,
    created_at = CURRENT_TIMESTAMP
`);

function addEntry({ url, title, platform, icon, thumbnail, date }) {
  upsertStmt.run(
    url,
    title || null,
    platform || "other",
    icon || null,
    thumbnail || null,
    date || null
  );
  return db.prepare("SELECT * FROM history WHERE url = ?").get(url);
}

function listEntries({ platform, search, limit = 200, offset = 0 } = {}) {
  const conditions = [];
  const params = [];

  if (platform && platform !== "all") {
    if (platform === "other") {
      conditions.push(
        "platform NOT IN ('youtube','tiktok','instagram','twitter','facebook','spotify')"
      );
    } else {
      conditions.push("platform = ?");
      params.push(platform);
    }
  }

  if (search) {
    conditions.push("(title LIKE ? OR url LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = db
    .prepare(`SELECT COUNT(*) AS total FROM history ${where}`)
    .get(...params).total;
  const items = db
    .prepare(
      `SELECT * FROM history ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, Number(limit), Number(offset));

  return { total, items };
}

function statsByPlatform() {
  return db
    .prepare(
      "SELECT platform, COUNT(*) AS count FROM history GROUP BY platform ORDER BY count DESC"
    )
    .all();
}

function clearHistory(platform) {
  if (platform && platform !== "all") {
    if (platform === "other") {
      return db
        .prepare(
          "DELETE FROM history WHERE platform NOT IN ('youtube','tiktok','instagram','twitter','facebook','spotify')"
        )
        .run();
    }
    return db.prepare("DELETE FROM history WHERE platform = ?").run(platform);
  }
  return db.prepare("DELETE FROM history").run();
}

module.exports = { addEntry, listEntries, statsByPlatform, clearHistory };
