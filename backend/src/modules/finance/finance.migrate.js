/**
 * Finance Module — Database Migration Runner
 * Run: node src/modules/finance/finance.migrate.js
 *
 * Prerequisites: DATABASE_URL must be set in backend/.env
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { pool } = require('../../config/db');

async function runMigration() {
    const sqlPath = path.join(__dirname, 'finance.migrate.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
        console.log('[Finance Migration] Starting...');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('[Finance Migration] ✅  All Finance tables created/verified successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Finance Migration] ❌  Failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
