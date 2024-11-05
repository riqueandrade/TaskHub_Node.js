const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

router.get('/tasks', todoController.getAll);
router.get('/tasks/sectors', todoController.getUniqueSectors);
router.get('/tasks/notifications', todoController.getNotifications);
router.post('/tasks', todoController.create);
router.put('/tasks/:id', todoController.update);
router.patch('/tasks/:id/status', todoController.updateStatus);
router.delete('/tasks/:id', todoController.delete);

module.exports = router; 