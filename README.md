<div align="center">
  <h1>TaskHub</h1>
  <p>Sistema de gerenciamento de tarefas com interface Kanban</p>
  
  [![PHP Version][php-image]][php-url]
  [![MySQL Version][mysql-image]][mysql-url]
  [![Bootstrap Version][bootstrap-image]][bootstrap-url]
  [![License][license-image]][license-url]
</div>

---

## 📋 Sumário
- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura](#-estrutura)
- [Instalação](#-instalação)
- [Uso](#-uso)

## 🎯 Visão Geral

TaskHub é um sistema web para gerenciamento de tarefas e usuários, com interface Kanban e recursos de gestão de equipes. O sistema oferece uma experiência intuitiva para organização de tarefas, com filtros avançados e exportação de dados.

## 🚀 Funcionalidades

### Dashboard de Usuários
- Estatísticas em tempo real
  - Total de usuários
  - Usuários ativos
  - Tarefas atribuídas
- Cadastro e edição de usuários
- Visualização de perfil com tarefas atribuídas
- Busca e ordenação avançada
- Exportação para PDF e Excel

### Quadro Kanban
| Coluna | Funcionalidade |
|--------|----------------|
| A Fazer | Tarefas pendentes |
| Fazendo | Tarefas em andamento |
| Pronto | Tarefas concluídas |

### Sistema de Tarefas
- Criação de tarefas com:
  - Título e descrição
  - Setor
  - Prioridade (Alta, Média, Baixa)
  - Responsável
  - Data de vencimento
- Notificações de prazos
- Contadores por status
- Sistema de filtros:
  - 🔍 Busca por texto
  - 🏷️ Filtro por prioridade
  - 👤 Filtro por responsável
  - 🏢 Filtro por setor

## 💻 Tecnologias

### Frontend
```json
{
  "core": ["HTML5", "CSS3", "JavaScript"],
  "framework": "Bootstrap 5.3",
  "libraries": [
    "jQuery 3.6.0",
    "Bootstrap Icons",
    "jsPDF 2.5.1",
    "jsPDF-AutoTable 3.5.29"
  ],
  "fonts": "Google Fonts (Roboto)"
}
```

### Backend
```json
{
  "language": "PHP 7+",
  "database": "MySQL",
  "communication": "JSON",
  "security": [
    "mysqli_real_escape_string",
    "Prepared Statements"
  ]
}
```

## 🏗 Estrutura

```
project/
├── css/
│   ├── common.css    # Estilos globais
│   ├── tasks.css     # Estilos do Kanban
│   └── cadastro.css  # Estilos do cadastro
├── js/
│   ├── app.js        # Lógica do Kanban
│   ├── cadastro.js   # Lógica do cadastro
│   └── nav.js        # Navegação
├── php/
│   ├── db_connection.php  # Conexão com o banco de dados
│   ├── script.php         # Scripts principais
│   ├── get_tasks.php      # Busca de tarefas
│   ├── create_task.php    # Criação de tarefas
│   ├── update_task.php    # Atualização de tarefas
│   ├── delete_task.php    # Exclusão de tarefas
│   ├── get_users.php      # Busca de usuários
│   ├── create_user.php    # Criação de usuários
│   ├── update_user.php    # Atualização de usuários
│   └── delete_user.php    # Exclusão de usuários
└── sql/
    └── database_setup.sql # Script de criação do banco
```

## 📦 Instalação

1. **Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/taskhub.git
cd taskhub
```

2. **Configure o Banco de Dados**
   1. Abra o MySQL Workbench
   2. Clique em "File" > "Open SQL Script"
   3. Navegue até a pasta do projeto e selecione `sql/database_setup.sql`
   4. Clique no ícone de raio ⚡ (Execute) ou pressione Ctrl+Shift+Enter
   5. Aguarde a execução do script que irá criar o banco de dados, tabelas e dados iniciais

3. **Configure a Conexão**
```php
// php/db_connection.php
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "to_do_list";
```

## 📖 Uso

### Gestão de Usuários
1. Acesse `index.html`
2. Utilize o formulário para cadastrar usuários
3. Gerencie usuários na tabela
4. Exporte dados via PDF ou Excel

### Gestão de Tarefas
1. Acesse `tarefas.html`
2. Crie tarefas no formulário superior
3. Utilize os filtros para buscar tarefas
4. Mova tarefas entre as colunas do Kanban

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 🤝 Suporte

Para suporte e contato:
- WhatsApp: [+55 (47) 98823-1069](https://wa.me/5547988231069)

---

<div align="center">
  <sub>Desenvolvido por Henrique de Andrade Reynaud</sub>
</div>

<!-- Badges -->
[php-image]: https://img.shields.io/badge/PHP-7.4%2B-blue?style=flat-square
[php-url]: https://php.net
[mysql-image]: https://img.shields.io/badge/MySQL-5.7%2B-orange?style=flat-square
[mysql-url]: https://www.mysql.com
[bootstrap-image]: https://img.shields.io/badge/Bootstrap-5.3-purple?style=flat-square
[bootstrap-url]: https://getbootstrap.com
[license-image]: https://img.shields.io/badge/License-MIT-green?style=flat-square
[license-url]: LICENSE#
