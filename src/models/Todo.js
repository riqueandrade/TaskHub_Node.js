const jsonDb = require('../services/jsonDb');

class Todo {
    static async getAll() {
        return jsonDb.getAllTasks();
    }

    static async getByStatus(status) {
        return jsonDb.getTasksByStatus(status);
    }

    static async create(data) {
        return jsonDb.createTask(data);
    }

    static async updateStatus(id, status) {
        return jsonDb.updateTaskStatus(id, status);
    }

    static async delete(id) {
        return jsonDb.deleteTask(id);
    }

    static async getUniqueSectors() {
        return jsonDb.getUniqueSectors();
    }

    static async getNotifications() {
        return jsonDb.getNotifications();
    }
}

module.exports = Todo; 