
import { notesDb, closePool } from './src/db/mysql.ts';

async function checkPositions() {
    try {
        const notes = await notesDb.getAll();
        console.log('ID | Title | Parent | Position | Created At');
        console.log('-'.repeat(60));
        notes.forEach(n => {
            console.log(`${n.id.toString().padEnd(3)} | ${n.title.padEnd(20)} | ${String(n.parent_id).padEnd(6)} | ${String(n.position).padEnd(8)} | ${n.created_at}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await closePool();
    }
}

checkPositions();
