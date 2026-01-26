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
  created_at: Date;
  updated_at: Date;
}

export const notesDb = {
  async getAll(): Promise<Note[]> {
    try {
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM notes ORDER BY created_at ASC' // Change order logic if needed for tree
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

  async create(title: string, content: string, parentId?: number): Promise<number> {
    try {
      const [result] = await pool.query(
        'INSERT INTO notes (title, content, parent_id) VALUES (?, ?, ?)',
        [title, content, parentId || null]
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

  async update(id: number, title: string, content: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
        [title, content, id]
      );
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