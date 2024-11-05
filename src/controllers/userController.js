const db = require('../config/database');

const userController = {
    async getAll(req, res) {
        try {
            const [rows] = await db.query('SELECT * FROM usuarios ORDER BY nome');
            res.json(rows);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
    },

    async getStats(req, res) {
        try {
            // Busca total de usuários
            const [totalUsers] = await db.query('SELECT COUNT(*) as total FROM usuarios');
            
            // Busca usuários ativos (com pelo menos uma tarefa não concluída)
            const [activeUsers] = await db.query(`
                SELECT COUNT(DISTINCT u.id_usuario) as total 
                FROM usuarios u 
                INNER JOIN tarefas t ON u.id_usuario = t.id_usuario
                WHERE t.status != 'Pronto'
            `);
            
            // Busca total de tarefas atribuídas
            const [assignedTasks] = await db.query('SELECT COUNT(*) as total FROM tarefas WHERE id_usuario IS NOT NULL');

            res.json({
                total_users: totalUsers[0].total,
                active_users: activeUsers[0].total,
                assigned_tasks: assignedTasks[0].total
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }
    },

    async create(req, res) {
        try {
            const { nome, email } = req.body;
            const [result] = await db.query(
                'INSERT INTO usuarios (nome, email) VALUES (?, ?)',
                [nome, email]
            );
            res.status(201).json({ 
                success: true, 
                id: result.insertId,
                message: 'Usuário cadastrado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao cadastrar usuário' 
            });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { nome, email } = req.body;
            const [result] = await db.query(
                'UPDATE usuarios SET nome = ?, email = ? WHERE id_usuario = ?',
                [nome, email, id]
            );
            if (result.affectedRows > 0) {
                res.json({ 
                    success: true, 
                    message: 'Usuário atualizado com sucesso' 
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    error: 'Usuário não encontrado' 
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao atualizar usuário' 
            });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
            if (result.affectedRows > 0) {
                res.json({ 
                    success: true, 
                    message: 'Usuário excluído com sucesso' 
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    error: 'Usuário não encontrado' 
                });
            }
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao excluir usuário' 
            });
        }
    },

    async getUserProfile(req, res) {
        try {
            const { id } = req.params;
            
            // Busca dados do usuário
            const [user] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
            
            if (user.length === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Busca tarefas do usuário
            const [tasks] = await db.query(
                'SELECT * FROM tarefas WHERE id_usuario = ? ORDER BY data_criacao DESC',
                [id]
            );

            res.json({
                user: user[0],
                tasks: tasks
            });
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
        }
    }
};

module.exports = userController;