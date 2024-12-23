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
                
                if (response && response.length > 0) {
                    // Atualiza o badge
                    notificationBadge.text(response.length).removeClass('d-none');
                    noNotifications.addClass('d-none');

                    // Ordena as notificações por proximidade da data de vencimento
                    response.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

                    response.forEach(function (notif) {
                        const dueDate = new Date(notif.data_vencimento);
                        const today = new Date();
                        const diffTime = dueDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let dateClass = '';
                        let dateText = '';
                        
                        if (diffDays < 0) {
                            dateClass = 'urgent';
                            dateText = 'Atrasada';
                        } else if (diffDays === 0) {
                            dateClass = 'urgent';
                            dateText = 'Vence hoje';
                        } else if (diffDays === 1) {
                            dateClass = 'warning';
                            dateText = 'Vence amanhã';
                        } else {
                            dateClass = 'warning';
                            dateText = `Vence em ${diffDays} dias`;
                        }

                        notificationList.append(`
                            <div class="list-group-item">
                                <div class="notification-content">
                                    <div class="notification-info">
                                        <h6>${notif.tarefa}</h6>
                                        <div class="notification-meta">
                                            <div class="notification-user">
                                                <i class="bi bi-person"></i>
                                                <span>${notif.user_name || "Não atribuído"}</span>
                                            </div>
                                            ${notif.setor ? `
                                                <div class="notification-sector">
                                                    <i class="bi bi-building"></i>
                                                    <span>${notif.setor}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="notification-date ${dateClass}">
                                        ${dateText}
                                    </div>
                                </div>
                            </div>
                        `);
                    });
                } else {
                    notificationBadge.text('0').addClass('d-none');
                    noNotifications.removeClass('d-none');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao carregar notificações:', error);
                notificationBadge.text('!').removeClass('d-none');
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
    $('#exportZipBtn').on('click', exportToZip);

    // Inicializar modal de notificações
    $('#notificationDropdown').on('click', function(e) {
        e.preventDefault();
        const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
        notificationModal.show();
    });
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
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const effectiveWidth = pageWidth - (2 * margin);

            // Adiciona cabeçalho
            doc.setFontSize(16);
            doc.setTextColor(74, 144, 226);
            doc.text("TaskHub - Relatório de Tarefas", margin, margin + 5);

            // Adiciona data do relatório
            doc.setFontSize(10);
            doc.setTextColor(108, 117, 125);
            doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, margin + 12);

            // Configuração da tabela
            doc.autoTable({
                startY: margin + 20,
                margin: { left: margin, right: margin },
                headStyles: { 
                    fillColor: [74, 144, 226],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'left',
                    cellPadding: 4
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
                columnStyles: {
                    0: { cellWidth: effectiveWidth * 0.30 }, // Tarefa (30%)
                    1: { cellWidth: effectiveWidth * 0.15 }, // Setor (15%)
                    2: { cellWidth: effectiveWidth * 0.12 }, // Prioridade (12%)
                    3: { cellWidth: effectiveWidth * 0.13 }, // Status (13%)
                    4: { cellWidth: effectiveWidth * 0.18 }, // Responsável (18%)
                    5: { cellWidth: effectiveWidth * 0.12 }  // Vencimento (12%)
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    overflow: 'linebreak',
                    font: 'helvetica',
                    halign: 'left'
                },
                bodyStyles: {
                    textColor: [68, 68, 68]
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                didDrawPage: function(data) {
                    // Adiciona rodapé com número da página
                    doc.setFontSize(8);
                    doc.setTextColor(108, 117, 125);
                    doc.text(
                        `Página ${data.pageNumber}`,
                        margin,
                        pageHeight - 10
                    );
                },
                willDrawCell: function(data) {
                    // Formatação condicional para datas
                    if (data.column.index === 5 && data.row.section === 'body') {
                        const dateStr = data.cell.text;
                        if (dateStr !== 'N/A') {
                            const dueDate = new Date(tasks[data.row.index].data_vencimento);
                            const today = new Date();
                            const diffTime = dueDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays < 0) {
                                data.cell.styles.textColor = [220, 53, 69]; // Vermelho para atrasadas
                            } else if (diffDays <= 3) {
                                data.cell.styles.textColor = [255, 165, 0]; // Laranja para próximas
                            }
                        }
                    }
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
                <Style ss:ID="Normal">
                    <Alignment ss:Vertical="Center"/>
                    <Font ss:Size="10"/>
                </Style>
                <Style ss:ID="Warning">
                    <Alignment ss:Vertical="Center"/>
                    <Font ss:Size="10" ss:Color="#FFA500"/>
                    <Interior ss:Color="#FFF3CD" ss:Pattern="Solid"/>
                </Style>
                <Style ss:ID="Danger">
                    <Alignment ss:Vertical="Center"/>
                    <Font ss:Size="10" ss:Color="#DC3545"/>
                    <Interior ss:Color="#FFE9E9" ss:Pattern="Solid"/>
                </Style>
                <Style ss:ID="Success">
                    <Alignment ss:Vertical="Center"/>
                    <Font ss:Size="10" ss:Color="#28A745"/>
                </Style>
            `;
            excelContent += '</Styles>\n';

            // Adiciona a planilha
            excelContent += '<Worksheet ss:Name="Tarefas">\n';
            excelContent += '<Table>\n';

            // Ajusta larguras das colunas
            excelContent += `
                <Column ss:Width="300"/>
                <Column ss:Width="150"/>
                <Column ss:Width="100"/>
                <Column ss:Width="100"/>
                <Column ss:Width="200"/>
                <Column ss:Width="120"/>
            `;

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
                let dueDateStyle = "Normal";
                if (task.data_vencimento) {
                    const dueDate = new Date(task.data_vencimento);
                    const today = new Date();
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                        dueDateStyle = "Danger"; // Atrasado
                    } else if (diffDays <= 3) {
                        dueDateStyle = "Warning"; // Próximo ao vencimento
                    } else if (task.status === 'Pronto') {
                        dueDateStyle = "Success"; // Concluído
                    }
                }

                excelContent += '<Row>\n';
                excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.tarefa}</Data></Cell>\n`;
                excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.setor || 'N/A'}</Data></Cell>\n`;
                excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.prioridade.toUpperCase()}</Data></Cell>\n`;
                excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.status}</Data></Cell>\n`;
                excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.user_name || 'Não atribuído'}</Data></Cell>\n`;
                excelContent += `<Cell ss:StyleID="${dueDateStyle}"><Data ss:Type="String">${task.data_vencimento ? new Date(task.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</Data></Cell>\n`;
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

async function exportToZip() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
    modal.hide();

    try {
        // Busca as tarefas
        const tasks = await $.ajax({
            url: '/api/tasks',
            type: 'GET'
        });

        // Cria um novo objeto ZIP
        const zip = new JSZip();

        // Gera o PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const effectiveWidth = pageWidth - (2 * margin);

        // Adiciona cabeçalho do PDF
        doc.setFontSize(16);
        doc.setTextColor(74, 144, 226);
        doc.text("TaskHub - Relatório de Tarefas", margin, margin + 5);

        // Adiciona data do relatório no PDF
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125);
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, margin + 12);

        // Configuração da tabela PDF
        doc.autoTable({
            startY: margin + 20,
            margin: { left: margin, right: margin },
            headStyles: { 
                fillColor: [74, 144, 226],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'left',
                cellPadding: 4
            },
            head: [["Tarefa", "Setor", "Prioridade", "Status", "Responsável", "Vencimento"]],
            body: tasks.map(task => [
                task.tarefa,
                task.setor || 'N/A',
                task.prioridade.toUpperCase(),
                task.status,
                task.user_name || 'Não atribuído',
                task.data_vencimento ? new Date(task.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'
            ])
        });

        // Adiciona o PDF ao ZIP
        const pdfBlob = doc.output('blob');
        zip.file("TaskHub_Tarefas.pdf", pdfBlob);

        // Gera o Excel
        let excelContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
        excelContent += '<?mso-application progid="Excel.Sheet"?>\n';
        excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
        excelContent += '    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
        
        // Adiciona estilos do Excel
        excelContent += '<Styles>\n';
        excelContent += `
            <Style ss:ID="Header">
                <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
                <Font ss:Bold="1" ss:Size="12" ss:Color="#FFFFFF"/>
                <Interior ss:Color="#4A90E2" ss:Pattern="Solid"/>
            </Style>
            <Style ss:ID="Normal">
                <Alignment ss:Vertical="Center"/>
                <Font ss:Size="10"/>
            </Style>
        `;
        excelContent += '</Styles>\n';

        // Adiciona a planilha
        excelContent += '<Worksheet ss:Name="Tarefas">\n';
        excelContent += '<Table>\n';

        // Cabeçalhos do Excel
        excelContent += '<Row>\n';
        ["Tarefa", "Setor", "Prioridade", "Status", "Responsável", "Vencimento"].forEach(header => {
            excelContent += `<Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>\n`;
        });
        excelContent += '</Row>\n';

        // Dados do Excel
        tasks.forEach(task => {
            excelContent += '<Row>\n';
            excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.tarefa}</Data></Cell>\n`;
            excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.setor || 'N/A'}</Data></Cell>\n`;
            excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.prioridade.toUpperCase()}</Data></Cell>\n`;
            excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.status}</Data></Cell>\n`;
            excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.user_name || 'Não atribuído'}</Data></Cell>\n`;
            excelContent += `<Cell ss:StyleID="Normal"><Data ss:Type="String">${task.data_vencimento ? new Date(task.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</Data></Cell>\n`;
            excelContent += '</Row>\n';
        });

        excelContent += '</Table>\n</Worksheet>\n</Workbook>';

        // Adiciona o Excel ao ZIP
        zip.file("TaskHub_Tarefas.xls", excelContent);

        // Gera o arquivo ZIP
        const zipBlob = await zip.generateAsync({type: "blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'TaskHub_Tarefas.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Erro ao exportar para ZIP:', error);
        alert('Erro ao gerar o arquivo ZIP');
    }
}
