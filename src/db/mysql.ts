// src/db/mysql.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: import.meta.env.DB_HOST,
  user: import.meta.env.DB_USER,
  password: import.meta.env.DB_PASSWORD,
  database: import.meta.env.DB_NAME,
  port: parseInt(import.meta.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export interface Note {
  id: number;
  title: string;
  content: string;
  parent_id?: number | null;
  type?: 'note' | 'quiz' | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export const notesDb = {
  async getAll(): Promise<Note[]> {
    try {
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM notes ORDER BY parent_id, position ASC, created_at ASC'
      );
      return rows as Note[];
    } catch (error) {
      console.error('Database error in getAll:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<Note | null> {
    try {
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM notes WHERE id = ?',
        [id]
      );
      return (rows as Note[])[0] || null;
    } catch (error) {
      console.error('Database error in getById:', error);
      throw error;
    }
  },

  async create(title: string, content: string, parentId?: number, type: 'note' | 'quiz' | 'slide' | 'diagram' = 'note'): Promise<number> {
    try {
      // Calcola la posizione massima tra i fratelli per posizionare la nuova nota alla fine
      const [maxPosResult] = await pool.query<any[]>(
        'SELECT MAX(position) as maxPos FROM notes WHERE parent_id <=> ?',
        [parentId || null]
      );
      const nextPosition = (maxPosResult[0]?.maxPos || 0) + 1;

      const [result] = await pool.query(
        'INSERT INTO notes (title, content, parent_id, type, position) VALUES (?, ?, ?, ?, ?)',
        [title, content, parentId || null, type, nextPosition]
      );

      console.log('Insert result:', result);
      const insertId = (result as any).insertId;

      if (!insertId) {
        throw new Error('Nessun ID generato dall\'insert');
      }

      return insertId;
    } catch (error) {
      console.error('Database error in create:', error);
      throw error;
    }
  },

  async update(id: number, title: string, content: string, parentId?: number | null, type?: 'note' | 'quiz' | 'slide' | 'diagram' | null, position?: number): Promise<void> {
    try {
      if (typeof parentId !== 'undefined' || typeof type !== 'undefined' || typeof position !== 'undefined') {
        const fields = ['title = ?', 'content = ?', 'updated_at = NOW()'];
        const values: any[] = [title, content];

        if (typeof parentId !== 'undefined') {
          fields.push('parent_id = ?');
          values.push(parentId);
        }
        if (typeof type !== 'undefined') {
          fields.push('type = ?');
          values.push(type);
        }
        if (typeof position !== 'undefined') {
          fields.push('position = ?');
          values.push(position);
        }
        values.push(id);

        await pool.query(
          `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      } else {
        // Aggiornamento standard (solo contenuto)
        await pool.query(
          'UPDATE notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
          [title, content, id]
        );
      }
    } catch (error) {
      console.error('Database error in update:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await pool.query('DELETE FROM notes WHERE id = ?', [id]);
    } catch (error) {
      console.error('Database error in delete:', error);
      throw error;
    }
  }
};

export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;