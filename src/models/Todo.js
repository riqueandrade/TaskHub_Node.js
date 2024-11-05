const db = require('../config/database');

class Todo {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM tarefas ORDER BY data_criacao DESC');
        return rows;
    }

    static async getByStatus(status) {
        const [rows] = await db.query(
            'SELECT t.*, u.nome as user_name FROM tarefas t LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario WHERE t.status = ? ORDER BY t.data_criacao DESC',
            [status]
        );
        return rows;
    }

    static async create(data) {
        const { title, description, sector, priority, user_id, due_date } = data;
        const [result] = await db.query(
            'INSERT INTO tarefas (tarefa, descricao, setor, prioridade, id_usuario, data_vencimento) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, sector, priority, user_id || null, due_date || null]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { title, description, sector, priority, user_id, due_date } = data;
        const [result] = await db.query(
            'UPDATE tarefas SET tarefa = ?, descricao = ?, setor = ?, prioridade = ?, id_usuario = ?, data_vencimento = ? WHERE id_tarefas = ?',
            [title, description, sector, priority, user_id || null, due_date || null, id]
        );
        return result.affectedRows > 0;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE tarefas SET status = ? WHERE id_tarefas = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM tarefas WHERE id_tarefas = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getUniqueSectors() {
        const [rows] = await db.query('SELECT DISTINCT setor FROM tarefas WHERE setor IS NOT NULL');
        return rows.map(row => row.setor);
    }

    static async getNotifications() {
        const [rows] = await db.query(`
            SELECT t.*, u.nome as user_name
            FROM tarefas t
            LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
            WHERE t.data_vencimento <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
            AND t.status != 'Pronto'
            ORDER BY t.data_vencimento ASC
        `);
        return rows;
    }
}

module.exports = Todo; 