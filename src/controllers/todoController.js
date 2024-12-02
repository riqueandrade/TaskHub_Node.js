const Todo = require('../models/Todo');

const todoController = {
    async getAll(req, res) {
        try {
            const { status } = req.query;
            const todos = status 
                ? await Todo.getByStatus(status)
                : await Todo.getAll();
            res.json(todos);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            res.status(500).json({ error: 'Erro ao buscar tarefas' });
        }
    },

    async getUniqueSectors(req, res) {
        try {
            const sectors = await Todo.getUniqueSectors();
            res.json(sectors);
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            res.status(500).json({ error: 'Erro ao buscar setores' });
        }
    },

    async getNotifications(req, res) {
        try {
            const notifications = await Todo.getNotifications();
            res.json(notifications);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            res.status(500).json({ error: 'Erro ao buscar notificações' });
        }
    },

    async create(req, res) {
        try {
            const id = await Todo.create(req.body);
            res.status(201).json({ 
                success: true,
                id,
                message: 'Tarefa criada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            res.status(500).json({ error: 'Erro ao criar tarefa' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const updatedTask = await Todo.update(id, req.body);
            
            if (updatedTask) {
                res.json({
                    success: true,
                    message: 'Tarefa atualizada com sucesso',
                    task: updatedTask
                });
            } else {
                res.status(404).json({ error: 'Tarefa não encontrada' });
            }
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            res.status(500).json({ error: 'Erro ao atualizar tarefa' });
        }
    },

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedTask = await Todo.updateStatus(id, status);
            
            if (updatedTask) {
                res.json({
                    success: true,
                    message: 'Status da tarefa atualizado',
                    task: updatedTask
                });
            } else {
                res.status(404).json({ error: 'Tarefa não encontrada' });
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            res.status(500).json({ error: 'Erro ao atualizar status da tarefa' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const success = await Todo.delete(id);
            if (success) {
                res.json({ message: 'Tarefa deletada com sucesso' });
            } else {
                res.status(404).json({ error: 'Tarefa não encontrada' });
            }
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);
            res.status(500).json({ error: 'Erro ao deletar tarefa' });
        }
    }
};

module.exports = todoController; 