const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const todoRoutes = require('./src/routes/todoRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rotas da API
app.use('/api', todoRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 