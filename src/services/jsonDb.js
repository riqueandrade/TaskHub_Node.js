const fs = require('fs').promises;
const path = require('path');

class JsonDb {
    constructor() {
        this.usersPath = path.join(__dirname, '../data/users.json');
        this.tasksPath = path.join(__dirname, '../data/tasks.json');
    }

    async readJson(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Se o arquivo não existe, retorna estrutura vazia
                return { users: [], tasks: [], lastId: 0 };
            }
            throw error;
        }
    }

    async writeJson(filePath, data) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    async getAllUsers() {
        const data = await this.readJson(this.usersPath);
        return data.users;
    }

    async getAllTasks() {
        const data = await this.readJson(this.tasksPath);
        return data.tasks;
    }

    async getTasksByStatus(status) {
        const data = await this.readJson(this.tasksPath);
        const users = await this.getAllUsers();
        
        return data.tasks
            .filter(task => task.status === status)
            .map(task => ({
                ...task,
                user_name: users.find(u => u.id_usuario === task.id_usuario)?.nome || 'Não atribuído'
            }));
    }

    async createTask(taskData) {
        const data = await this.readJson(this.tasksPath);
        const newId = data.lastId + 1;
        
        const newTask = {
            id_tarefas: newId,
            ...taskData,
            data_criacao: new Date().toISOString()
        };

        data.tasks.push(newTask);
        data.lastId = newId;

        await this.writeJson(this.tasksPath, data);
        return newId;
    }

    async updateTaskStatus(id, status) {
        const data = await this.readJson(this.tasksPath);
        const users = await this.getAllUsers();
        
        const taskIndex = data.tasks.findIndex(t => t.id_tarefas === parseInt(id));
        if (taskIndex === -1) return null;

        data.tasks[taskIndex].status = status;
        await this.writeJson(this.tasksPath, data);

        const updatedTask = data.tasks[taskIndex];
        return {
            ...updatedTask,
            user_name: users.find(u => u.id_usuario === updatedTask.id_usuario)?.nome || 'Não atribuído'
        };
    }

    async deleteTask(id) {
        const data = await this.readJson(this.tasksPath);
        const initialLength = data.tasks.length;
        data.tasks = data.tasks.filter(t => t.id_tarefas !== parseInt(id));
        
        if (data.tasks.length === initialLength) return false;
        
        await this.writeJson(this.tasksPath, data);
        return true;
    }

    async getUniqueSectors() {
        const data = await this.readJson(this.tasksPath);
        return [...new Set(data.tasks.map(t => t.setor).filter(Boolean))];
    }

    async getNotifications() {
        const data = await this.readJson(this.tasksPath);
        const users = await this.getAllUsers();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        return data.tasks
            .filter(task => {
                const dueDate = new Date(task.data_vencimento);
                return dueDate <= sevenDaysFromNow && task.status !== 'Pronto';
            })
            .map(task => ({
                ...task,
                user_name: users.find(u => u.id_usuario === task.id_usuario)?.nome || 'Não atribuído'
            }));
    }
}

module.exports = new JsonDb(); 