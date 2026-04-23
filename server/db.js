import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initDb() {
    const db = await open({
        filename: path.join(__dirname, 'guardian.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS drift_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            statistic REAL,
            criticalValue REAL,
            driftDetected INTEGER,
            timestamp TEXT,
            sampleSizeBaseline INTEGER,
            sampleSizeProduction INTEGER
        )
    `);

    return db;
}
