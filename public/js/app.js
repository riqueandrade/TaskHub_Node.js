$(document).ready(function () {
    // Configurar data mínima para o input de data de vencimento
    const today = new Date().toISOString().split('T')[0];
    $('#todo-due-date').attr('min', today);

    // Adicionar validação quando o usuário tenta submeter o formulário
    $('#todo-form').on('submit', function (e) {
        const selectedDate = $('#todo-due-date').val();
        if (selectedDate && selectedDate < today) {
            e.preventDefault();
            alert('A data de vencimento não pode ser anterior à data atual.');
            return false;
        }
    });

    // Carrega a lista de usuários quando a página carrega
    $.ajax({
        url: '/api/users',
        type: 'GET',
        success: function (response) {
            var select = $('#todo-user');
            select.empty(); // Limpa as opções existentes
            select.append($('<option>', {
                value: '',
                text: 'Selecione um responsável'
            }));
            response.forEach(function (user) {
                select.append($('<option>', {
                    value: user.id_usuario,
                    text: user.nome
                }));
            });

            // Inicializa o Select2
            select.select2({
                theme: 'bootstrap-5',
                placeholder: 'Selecione um responsável',
                allowClear: true,
                width: '100%',
                language: {
                    noResults: function () {
                        return "Nenhum usuário encontrado";
                    },
                    searching: function () {
                        return "Buscando...";
                    }
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Erro ao carregar usuários:", error);
        }
    });

    // Quando o formulário de tarefas é submetido
    $('#todo-form').submit(function (e) {
        e.preventDefault();
        e.stopPropagation();

        const formData = {
            title: $('#todo-input').val(),
            description: $('#todo-description').val(),
            sector: $('#todo-sector').val(),
            priority: $('#todo-priority').val(),
            user_id: $('#todo-user').val(),
            due_date: $('#todo-due-date').val()
        };

        const url = editingTaskId ? `/api/tasks/${editingTaskId}` : '/api/tasks';
        const method = editingTaskId ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            type: method,
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function (response) {
                $('#todo-form')[0].reset();
                editingTaskId = null;
                $('button[type="submit"]').text('Adicionar');
                updateTaskLists();
            },
            error: function (xhr, status, error) {
                console.error("Erro na operação:", error);
            }
        });
    });

    // Função para atualizar as listas de tarefas
    function updateTaskLists() {
        const statuses = ['A Fazer', 'Fazendo', 'Pronto'];
        
        statuses.forEach(status => {
            $.ajax({
                url: `/api/tasks?status=${encodeURIComponent(status)}`,
                type: 'GET',
                success: function(tasks) {
                    const taskList = $(`.card:has(h2:contains("${status}")) .task-list`);
                    taskList.empty();
                    
                    tasks.forEach(task => {
                        // Renderiza cada tarefa (mantenha sua lógica de renderização existente)
                        renderTask(taskList, task);
                    });
                    
                    updateTaskCounters();
                }
            });
        });
    }

    // Função para atualizar os contadores de tarefas
    function updateTaskCounters() {
        $('.card').each(function() {
            const status = $(this).find('.card-header h2').text().trim();
            const taskCount = $(this).find('.task-list li').length;
            $(this).find('.task-counter').text(taskCount);
        });
    }

    function renderTask(taskList, task) {
        const taskElement = $(`
            <li class="task-item" data-priority="${task.prioridade}" data-user-id="${task.id_usuario || ''}" data-id="${task.id_tarefas}">
                <h6 class="card-title">${task.tarefa}</h6>
                ${task.descricao ? `<p class="todo-description">${task.descricao}</p>` : ''}
                
                <div class="task-details">
                    ${task.setor ? `
                        <div class="todo-sector">
                            <i class="bi bi-building"></i>
                            <span>${task.setor}</span>
                        </div>
                    ` : ''}
                    
                    <div class="todo-user">
                        <i class="bi bi-person"></i>
                        <span>${task.user_name || 'Não atribuído'}</span>
                    </div>
                    
                    ${task.data_vencimento ? `
                        <div class="todo-due-date ${isOverdue(task.data_vencimento) ? 'text-danger' : isNearDue(task.data_vencimento) ? 'text-warning' : ''}">
                            <i class="bi bi-calendar-event"></i>
                            <span>${new Date(task.data_vencimento).toLocaleDateString('pt-BR')}</span>
                        </div>
                    ` : ''}
                    
                    <span class="todo-priority badge ${getPriorityClass(task.prioridade)}">
                        ${task.prioridade.toUpperCase()}
                    </span>
                </div>

                <div class="task-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${task.id_tarefas}">
                        <i class="bi bi-pencil"></i>
                        Editar
                    </button>
                    
                    <button class="btn btn-sm btn-outline-success move-btn" data-id="${task.id_tarefas}" data-status="${task.status}">
                        <i class="bi bi-arrow-right"></i>
                        ${getNextStatusText(task.status)}
                    </button>
                    
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id_tarefas}">
                        <i class="bi bi-trash"></i>
                        Excluir
                    </button>
                </div>
            </li>
        `);

        taskList.append(taskElement);
    }

    // Funções auxiliares
    function isOverdue(date) {
        return new Date(date) < new Date().setHours(0, 0, 0, 0);
    }

    function isNearDue(date) {
        const dueDate = new Date(date);
        const today = new Date();
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
    }

    function getPriorityClass(priority) {
        const classes = {
            'alta': 'priority-alta',
            'media': 'priority-media',
            'baixa': 'priority-baixa'
        };
        return classes[priority.toLowerCase()] || 'priority-media';
    }

    function getNextStatusText(currentStatus) {
        switch (currentStatus) {
            case 'A Fazer':
                return 'Iniciar';
            case 'Fazendo':
                return 'Concluir';
            case 'Pronto':
                return 'Reabrir';
            default:
                return 'Mover';
        }
    }

    // Função para verificar notificações
    function checkNotifications() {
        $.ajax({
            url: '/api/tasks/notifications',
            type: 'GET',
            success: function (response) {
                const notificationList = $('#notification-list');
                const notificationBadge = $('.notification-badge');
                const noNotifications = $('#no-notifications');
                
                notificationList.empty();
                
                if (response.length > 0) {
                    response.forEach(function (notif) {
                        notificationList.append(`
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">${notif.title}</h6>
                                        <p class="mb-0 text-muted small">
                                            <i class="bi bi-person-fill me-1"></i>
                                            ${notif.user_name || "Não atribuído"}
                                        </p>
                                    </div>
                                    <span class="badge bg-warning text-dark">
                                        <i class="bi bi-calendar-event me-1"></i>
                                        ${new Date(notif.due_date).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        `);
                    });
                    
                    notificationBadge.removeClass('d-none').text(response.length);
                    noNotifications.addClass('d-none');
                } else {
                    notificationBadge.addClass('d-none');
                    noNotifications.removeClass('d-none');
                }
            }
        });
    }

    // Função para carregar filtros
    function loadFilters() {
        // Carregar usuários
        $.ajax({
            url: '/api/users',
            type: 'GET',
            success: function(response) {
                const filterUser = $('#filterUser');
                response.forEach(user => {
                    filterUser.append(`<option value="${user.id_usuario}">${user.nome}</option>`);
                });
            }
        });

        // Carregar setores únicos
        $.ajax({
            url: '/api/tasks/sectors',
            type: 'GET',
            success: function(response) {
                const filterSector = $('#filterSector');
                response.forEach(sector => {
                    if (sector) {
                        filterSector.append(`<option value="${sector}">${sector}</option>`);
                    }
                });
            }
        });
    }

    // Inicialização
    updateTaskLists();
    checkNotifications();
    loadFilters();
    
    // Verificar notificações a cada 5 minutos
    setInterval(checkNotifications, 300000);
});
