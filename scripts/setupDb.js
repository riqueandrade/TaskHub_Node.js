const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupDatabase() {
    let connection;
    
    try {
        // Primeiro conecta sem selecionar um banco
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });

        console.log('✓ Conectado ao MySQL');

        // Lê o arquivo SQL
        const sqlPath = path.join(__dirname, '..', 'database_setup.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');

        // Divide o conteúdo em comandos individuais
        const commands = sqlContent
            .split(';')
            .filter(cmd => cmd.trim())
            .map(cmd => cmd + ';');

        // Executa cada comando
        for (const command of commands) {
            await connection.query(command);
        }

        console.log('✓ Banco de dados criado com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao configurar banco de dados:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
