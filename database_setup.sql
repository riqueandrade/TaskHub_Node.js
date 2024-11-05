-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS to_do_list CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE to_do_list;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id_tarefas INT AUTO_INCREMENT PRIMARY KEY,
    tarefa VARCHAR(100) NOT NULL,
    descricao TEXT,
    setor VARCHAR(50),
    prioridade ENUM('baixa', 'media', 'alta') NOT NULL DEFAULT 'media',
    status ENUM('A Fazer', 'Fazendo', 'Pronto') NOT NULL DEFAULT 'A Fazer',
    id_usuario INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_vencimento DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE
    SET
        NULL,
        INDEX idx_status (status),
        INDEX idx_prioridade (prioridade),
        INDEX idx_data_vencimento (data_vencimento)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Inserção de dados de exemplo para usuários
INSERT INTO
    usuarios (nome, email)
VALUES
    ('João Silva', 'joao.silva@email.com'),
    ('Maria Santos', 'maria.santos@email.com'),
    ('Pedro Oliveira', 'pedro.oliveira@email.com'),
    ('Ana Costa', 'ana.costa@email.com'),
    ('Carlos Souza', 'carlos.souza@email.com');

-- Inserção de dados de exemplo para tarefas
INSERT INTO
    tarefas (
        tarefa,
        descricao,
        setor,
        prioridade,
        status,
        id_usuario,
        data_vencimento
    )
VALUES
    (
        'Desenvolver nova interface',
        'Criar protótipo da nova interface do sistema',
        'Desenvolvimento',
        'alta',
        'A Fazer',
        1,
        DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
    ),
    (
        'Revisar documentação',
        'Atualizar a documentação do projeto',
        'Documentação',
        'media',
        'A Fazer',
        2,
        DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY)
    ),
    (
        'Testar módulo de pagamento',
        'Realizar testes no novo módulo de pagamento',
        'QA',
        'alta',
        'Fazendo',
        3,
        DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)
    ),
    (
        'Preparar apresentação',
        'Criar slides para reunião com cliente',
        'Marketing',
        'baixa',
        'A Fazer',
        4,
        DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY)
    ),
    (
        'Corrigir bug no login',
        'Resolver problema de autenticação',
        'Desenvolvimento',
        'alta',
        'Pronto',
        1,
        DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY)
    ),
    (
        'Otimizar consultas SQL',
        'Melhorar performance do banco de dados',
        'Desenvolvimento',
        'media',
        'Fazendo',
        5,
        DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY)
    ),
    (
        'Atualizar bibliotecas',
        'Atualizar dependências do projeto',
        'Desenvolvimento',
        'baixa',
        'A Fazer',
        2,
        DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY)
    ),
    (
        'Backup do banco de dados',
        'Realizar backup completo do sistema',
        'Infraestrutura',
        'alta',
        'A Fazer',
        3,
        DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY)
    ),
    (
        'Criar manual do usuário',
        'Documentar funcionalidades para usuários',
        'Documentação',
        'media',
        'Fazendo',
        4,
        DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY)
    ),
    (
        'Implementar novo layout',
        'Aplicar novo design ao sistema',
        'Design',
        'alta',
        'A Fazer',
        5,
        DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY)
    );

-- Criação de índices adicionais para otimização
CREATE INDEX idx_usuario_tarefas ON tarefas(id_usuario);

CREATE INDEX idx_data_criacao ON tarefas(data_criacao);

CREATE INDEX idx_setor ON tarefas(setor);