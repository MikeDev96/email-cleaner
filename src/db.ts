import sqlite3 from "better-sqlite3"
import { BlacklistEntry } from "./types/BlacklistEntry"

const db = sqlite3("main.db")

db.exec(`
  CREATE TABLE IF NOT EXISTS blacklist (
    from_address TEXT NOT NULL,
    from_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    PRIMARY KEY (from_address, from_name, subject)
  ) WITHOUT ROWID
`)

const insertBlacklist = db.prepare<BlacklistEntry>("INSERT OR IGNORE INTO blacklist VALUES (@fromAddress, @fromName, @subject)")
const queryBlacklist = db.prepare<BlacklistEntry>("SELECT EXISTS(SELECT 1 FROM blacklist WHERE from_address = @fromAddress AND from_name = @fromName AND subject = @subject) AS exist")

const insertBlacklistMany = db.transaction((msgs: BlacklistEntry[]) => {
  for (const msg of msgs) insertBlacklist.run(msg)
})

export {
  db,
  insertBlacklist,
  insertBlacklistMany,
  queryBlacklist,
}