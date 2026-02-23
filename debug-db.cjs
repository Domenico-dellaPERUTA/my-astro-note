
const mysql = require('mysql2/promise');

async function debug() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Orione___',
        database: 'appunti_db',
        port: 3306
    });

    try {
        const [rows] = await connection.query('SELECT id, title, parent_id, position FROM notes ORDER BY parent_id, position ASC, id ASC');
        console.log('ID | Title | Parent | Pos');
        console.log('-'.repeat(30));
        rows.forEach(r => {
            console.log(`${String(r.id).padEnd(3)} | ${String(r.title).padEnd(15)} | ${String(r.parent_id).padEnd(6)} | ${r.position}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

debug();
