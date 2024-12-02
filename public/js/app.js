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
                    const taskList = $(`.status-column:has(.status-title:contains("${status}")) .task-list`);
                    taskList.empty();
                    
                    tasks.forEach(task => {
                        renderTask(taskList, task);
                    });
                    
                    updateTaskCounters();
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao carregar tarefas:', error);
                }
            });
        });
    }

    // Função para atualizar os contadores de tarefas
    function updateTaskCounters() {
        $('.status-column').each(function() {
            const status = $(this).find('.status-title').text().trim();
            const taskCount = $(this).find('.task-list li:visible').length;
            $(this).find('.status-count').text(taskCount);
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
                                        <h6 class="mb-1">${notif.tarefa}</h6>
                                        <p class="mb-0 text-muted small">
                                            <i class="bi bi-person-fill me-1"></i>
                                            ${notif.user_name || "Não atribuído"}
                                        </p>
                                    </div>
                                    <span class="badge bg-warning text-dark">
                                        <i class="bi bi-calendar-event me-1"></i>
                                        ${new Date(notif.data_vencimento).toLocaleDateString('pt-BR')}
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

    // Event listeners para os botões de ação
    $(document).on('click', '.edit-btn', function() {
        const taskId = $(this).data('id');
        const taskItem = $(this).closest('li');
        
        editingTaskId = taskId;
        $('#todo-input').val(taskItem.find('.card-title').text());
        $('#todo-description').val(taskItem.find('.todo-description').text());
        $('#todo-sector').val(taskItem.find('.todo-sector span').text());
        $('#todo-priority').val(taskItem.data('priority'));
        $('#todo-user').val(taskItem.data('user-id')).trigger('change');
        
        // Atualiza o texto do botão
        $('button[type="submit"]').text('Atualizar');
        
        // Scroll suave até o formulário
        $('html, body').animate({
            scrollTop: $('#todo-form').offset().top - 100
        }, 500);
    });

    $(document).on('click', '.move-btn', function() {
        const taskId = $(this).data('id');
        const currentStatus = $(this).data('status');
        let newStatus;
        
        switch(currentStatus) {
            case 'A Fazer':
                newStatus = 'Fazendo';
                break;
            case 'Fazendo':
                newStatus = 'Pronto';
                break;
            case 'Pronto':
                newStatus = 'A Fazer';
                break;
        }
        
        $.ajax({
            url: `/api/tasks/${taskId}/status`,
            type: 'PATCH',
            data: JSON.stringify({ status: newStatus }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    // Remove a tarefa da coluna atual
                    const taskElement = $(`.task-item[data-id="${taskId}"]`);
                    taskElement.remove();
                    
                    // Adiciona a tarefa na nova coluna
                    const newColumn = $(`.card:has(h2:contains("${newStatus}")) .task-list`);
                    renderTask(newColumn, response.task);
                    
                    // Atualiza os contadores
                    updateTaskCounters();
                } else {
                    console.error('Erro ao mover tarefa:', response.error);
                    alert('Erro ao mover tarefa');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao mover tarefa:', error);
                alert('Erro ao mover tarefa');
            }
        });
    });

    $(document).on('click', '.delete-btn', function() {
        const taskId = $(this).data('id');
        
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            $.ajax({
                url: `/api/tasks/${taskId}`,
                type: 'DELETE',
                success: function() {
                    updateTaskLists();
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao excluir tarefa:', error);
                    alert('Erro ao excluir tarefa');
                }
            });
        }
    });

    // Função para aplicar filtros
    function applyFilters() {
        const searchTerm = $('#searchTasks').val().toLowerCase();
        const priority = $('#filterPriority').val();
        const userId = $('#filterUser').val();
        const sector = $('#filterSector').val();

        $('.task-list li').each(function() {
            const $task = $(this);
            const taskTitle = $task.find('.card-title').text().toLowerCase();
            const taskDescription = $task.find('.todo-description').text().toLowerCase();
            const taskPriority = $task.data('priority');
            const taskUserId = String($task.data('user-id'));
            const taskSector = $task.find('.todo-sector span').text().toLowerCase();

            // Verifica se a tarefa atende a todos os critérios de filtro
            const matchesSearch = taskTitle.includes(searchTerm) || 
                                taskDescription.includes(searchTerm);
            const matchesPriority = !priority || taskPriority === priority;
            const matchesUser = !userId || taskUserId === userId;
            const matchesSector = !sector || taskSector.includes(sector.toLowerCase());

            // Mostra ou esconde a tarefa baseado nos filtros
            if (matchesSearch && matchesPriority && matchesUser && matchesSector) {
                $task.show();
            } else {
                $task.hide();
            }
        });

        // Atualiza os contadores após aplicar os filtros
        updateTaskCounters();
    }

    // Event listeners para os filtros
    $('#searchTasks, #filterPriority, #filterUser, #filterSector').on('input change', function() {
        applyFilters();
        updateTaskCounters();
    });

    // Botão de limpar filtros
    $('#clearFilters').on('click', function() {
        $('#searchTasks').val('');
        $('#filterPriority').val('');
        $('#filterUser').val('');
        $('#filterSector').val('');
        applyFilters();
        updateTaskCounters();
    });

    // Variável para controlar edição
    let editingTaskId = null;

    // Event listener para o botão de exportar
    $('#exportTasksBtn').on('click', function() {
        const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
        exportModal.show();
    });

    // Event listeners para os botões de exportação
    $('#exportPDFBtn').on('click', exportToPDF);
    $('#exportExcelBtn').on('click', exportToExcel);
});

// Funções de exportação no escopo global
function exportToPDF() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
    modal.hide();
    
    $.ajax({
        url: '/api/tasks',
        type: 'GET',
        success: function(tasks) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Orientação paisagem

            // Adiciona cabeçalho
            doc.setFontSize(20);
            doc.setTextColor(74, 144, 226);
            doc.text("TaskHub - Relatório de Tarefas", 14, 20);

            // Adiciona data do relatório
            doc.setFontSize(10);
            doc.setTextColor(108, 117, 125);
            doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

            // Configuração da tabela
            doc.autoTable({
                startY: 40,
                headStyles: { 
                    fillColor: [74, 144, 226],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                head: [["Tarefa", "Setor", "Prioridade", "Status", "Responsável", "Vencimento"]],
                body: tasks.map(task => [
                    task.tarefa,
                    task.setor || 'N/A',
                    task.prioridade.toUpperCase(),
                    task.status,
                    task.user_name || 'Não atribuído',
                    task.data_vencimento ? new Date(task.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'
                ]),
                styles: { 
                    fontSize: 9,
                    cellPadding: 5
                },
                columnStyles: {
                    0: { cellWidth: 70 }, // Tarefa
                    1: { cellWidth: 40 }, // Setor
                    2: { cellWidth: 25, halign: 'center' }, // Prioridade
                    3: { cellWidth: 25, halign: 'center' }, // Status
                    4: { cellWidth: 45 }, // Responsável
                    5: { cellWidth: 30, halign: 'center' } // Vencimento
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                }
            });

            doc.save("TaskHub_Tarefas.pdf");
        },
        error: function(xhr, status, error) {
            console.error('Erro ao exportar para PDF:', error);
            alert('Erro ao exportar para PDF');
        }
    });
}

function exportToExcel() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
    modal.hide();

    $.ajax({
        url: '/api/tasks',
        type: 'GET',
        success: function(tasks) {
            let excelContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
            excelContent += '<?mso-application progid="Excel.Sheet"?>\n';
            excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
            excelContent += '    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
            
            // Adiciona estilos
            excelContent += '<Styles>\n';
            excelContent += `
                <Style ss:ID="Header">
                    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
                    <Font ss:Bold="1" ss:Size="12" ss:Color="#FFFFFF"/>
                    <Interior ss:Color="#4A90E2" ss:Pattern="Solid"/>
                    <Borders>
                        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                    </Borders>
                </Style>
                <Style ss:ID="Title">
                    <Font ss:Bold="1" ss:Size="14" ss:Color="#4A90E2"/>
                    <Alignment ss:Horizontal="Left"/>
                </Style>
                <Style ss:ID="Date">
                    <Font ss:Size="10" ss:Color="#6C757D"/>
                    <Alignment ss:Horizontal="Left"/>
                </Style>
            `;
            excelContent += '</Styles>\n';

            // Adiciona a planilha
            excelContent += '<Worksheet ss:Name="Tarefas">\n';
            excelContent += '<Table>\n';

            // Título e Data
            excelContent += `
                <Row>
                    <Cell ss:StyleID="Title"><Data ss:Type="String">TaskHub - Relatório de Tarefas</Data></Cell>
                </Row>
                <Row>
                    <Cell ss:StyleID="Date">
                        <Data ss:Type="String">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</Data>
                    </Cell>
                </Row>
                <Row></Row>
            `;

            // Cabeçalhos
            excelContent += '<Row>\n';
            ["Tarefa", "Setor", "Prioridade", "Status", "Responsável", "Vencimento"].forEach(header => {
                excelContent += `<Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>\n`;
            });
            excelContent += '</Row>\n';

            // Dados
            tasks.forEach(task => {
                excelContent += '<Row>\n';
                excelContent += `<Cell><Data ss:Type="String">${task.tarefa}</Data></Cell>\n`;
                excelContent += `<Cell><Data ss:Type="String">${task.setor || 'N/A'}</Data></Cell>\n`;
                excelContent += `<Cell><Data ss:Type="String">${task.prioridade.toUpperCase()}</Data></Cell>\n`;
                excelContent += `<Cell><Data ss:Type="String">${task.status}</Data></Cell>\n`;
                excelContent += `<Cell><Data ss:Type="String">${task.user_name || 'Não atribuído'}</Data></Cell>\n`;
                excelContent += `<Cell><Data ss:Type="String">${task.data_vencimento ? new Date(task.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</Data></Cell>\n`;
                excelContent += '</Row>\n';
            });

            excelContent += '</Table>\n</Worksheet>\n</Workbook>';

            const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'TaskHub_Tarefas.xls';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        error: function(xhr, status, error) {
            console.error('Erro ao exportar para Excel:', error);
            alert('Erro ao exportar para Excel');
        }
    });
}
