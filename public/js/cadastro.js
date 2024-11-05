$(document).ready(function () {
    let editingId = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalUsers = 0;
    let users = [];

    // Lista original de usuários
    let originalUsers = [];

    // Função para carregar estatísticas
    function loadStats() {
        $.ajax({
            url: '/api/users/stats',
            type: 'GET',
            success: function (response) {
                $('#totalUsers').text(response.total_users);
                $('#activeUsers').text(response.active_users);
                $('#assignedTasks').text(response.assigned_tasks);
            }
        });
    }

    // Função para carregar a lista de usuários
    function loadUsers(page = 1) {
        $.ajax({
            url: '/api/users',
            type: 'GET',
            success: function (response) {
                originalUsers = response;
                users = [...originalUsers];
                totalUsers = users.length;
                updatePagination();
                displayUsers();
            },
            error: function (xhr, status, error) {
                console.error("Erro ao carregar usuários:", error);
                showFeedback(false, 'Erro ao carregar usuários');
            }
        });
    }

    // Função para exibir usuários com paginação
    function displayUsers() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedUsers = users.slice(start, end);

        var usersList = $('#users-list');
        usersList.empty();

        paginatedUsers.forEach(function (user) {
            var date = new Date(user.data_cadastro);
            var formattedDate = date.toLocaleDateString('pt-BR');

            // Criar dropdown para telas pequenas
            var actionsDropdown = $(`
                <div class="dropdown d-inline-block d-md-none">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false">
                        Ações
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#"><i class="bi bi-person-lines-fill me-2"></i>Ver Perfil</a></li>
                        <li><a class="dropdown-item" href="#"><i class="bi bi-pencil-fill me-2"></i>Editar</a></li>
                        <li><a class="dropdown-item text-danger" href="#"><i class="bi bi-trash-fill me-2"></i>Excluir</a></li>
                    </ul>
                </div>
            `);

            // Adicionar event listeners ao dropdown
            actionsDropdown.find('a').eq(0).on('click', function (e) {
                e.preventDefault();
                viewUserProfile(user.id_usuario);
            });
            actionsDropdown.find('a').eq(1).on('click', function (e) {
                e.preventDefault();
                editUser(user);
            });
            actionsDropdown.find('a').eq(2).on('click', function (e) {
                e.preventDefault();
                deleteUser(user.id_usuario);
            });

            // Botões normais para telas maiores
            var actionButtons = $(`
                <div class="d-none d-md-block">
                    <button class="btn btn-outline-info btn-sm me-2" title="Ver Perfil">
                        <i class="bi bi-person-lines-fill"></i>
                    </button>
                    <button class="btn btn-outline-primary btn-sm me-2" title="Editar">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" title="Excluir">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            `);

            // Adicionar event listeners aos botões
            actionButtons.find('button').eq(0).on('click', function () {
                viewUserProfile(user.id_usuario);
            });
            actionButtons.find('button').eq(1).on('click', function () {
                editUser(user);
            });
            actionButtons.find('button').eq(2).on('click', function () {
                deleteUser(user.id_usuario);
            });

            var row = $('<tr>').append(
                $('<td>').text(user.nome),
                $('<td>').addClass('d-none d-md-table-cell').text(user.email),
                $('<td>').addClass('d-none d-md-table-cell').text(formattedDate),
                $('<td>').addClass('text-end').append(actionsDropdown, actionButtons)
            );
            usersList.append(row);
        });

        updateDisplayRange();
    }

    // Função para atualizar a exibição do range
    function updateDisplayRange() {
        const start = ((currentPage - 1) * itemsPerPage) + 1;
        const end = Math.min(currentPage * itemsPerPage, totalUsers);
        $('#currentRange').text(`${start}-${end}`);
        $('#totalItems').text(totalUsers);
    }

    // Função para atualizar a paginação
    function updatePagination() {
        const totalPages = Math.ceil(totalUsers / itemsPerPage);
        const pagination = $('.pagination');
        pagination.empty();

        // Botão Anterior
        pagination.append(
            $('<li>').addClass('page-item' + (currentPage === 1 ? ' disabled' : '')).append(
                $('<a>').addClass('page-link').attr('href', '#').html('<i class="bi bi-chevron-left"></i>')
                    .click(function (e) {
                        e.preventDefault();
                        if (currentPage > 1) {
                            currentPage--;
                            displayUsers();
                            updatePagination();
                        }
                    })
            )
        );

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            pagination.append(
                $('<li>').addClass('page-item' + (currentPage === i ? ' active' : '')).append(
                    $('<a>').addClass('page-link').attr('href', '#').text(i)
                        .click(function (e) {
                            e.preventDefault();
                            currentPage = i;
                            displayUsers();
                            updatePagination();
                        })
                )
            );
        }

        // Botão Próximo
        pagination.append(
            $('<li>').addClass('page-item' + (currentPage === totalPages ? ' disabled' : '')).append(
                $('<a>').addClass('page-link').attr('href', '#').html('<i class="bi bi-chevron-right"></i>')
                    .click(function (e) {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                            currentPage++;
                            displayUsers();
                            updatePagination();
                        }
                    })
            )
        );
    }

    // Busca e Ordenação melhorada
    let searchTimeout;
    $('#searchUsers').on('input', function () {
        clearTimeout(searchTimeout);
        const $this = $(this);

        searchTimeout = setTimeout(function () {
            const searchTerm = $this.val().toLowerCase().trim();

            if (searchTerm === '') {
                users = [...originalUsers]; // Restaura a lista original se a busca estiver vazia
            } else {
                users = originalUsers.filter(user =>
                    user.nome.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm) ||
                    new Date(user.data_cadastro).toLocaleDateString('pt-BR').includes(searchTerm)
                );
            }

            // Mantém a ordenação atual após a busca
            const sortSelect = $('#sortUsers');
            if (sortSelect.val()) {
                sortUsers(sortSelect.val());
            }

            currentPage = 1; // Volta para a primeira página
            totalUsers = users.length;
            updatePagination();
            displayUsers();

            // Atualiza o feedback visual da busca
            const resultsCount = users.length;
            if (searchTerm !== '') {
                if (resultsCount === 0) {
                    $('#searchFeedback').remove(); // Remove feedback anterior se existir
                    $('.table-responsive').prepend(`
                        <div id="searchFeedback" class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Nenhum usuário encontrado para "${searchTerm}"
                        </div>
                    `);
                } else {
                    $('#searchFeedback').remove();
                    $('.table-responsive').prepend(`
                        <div id="searchFeedback" class="alert alert-success">
                            <i class="bi bi-check-circle me-2"></i>
                            ${resultsCount} usuário(s) encontrado(s) para "${searchTerm}"
                        </div>
                    `);
                }
            } else {
                $('#searchFeedback').remove();
            }
        }, 300); // Delay de 300ms
    });

    // Função de ordenação melhorada
    function sortUsers(sortValue) {
        switch (sortValue) {
            case 'name':
                users.sort((a, b) => a.nome.localeCompare(b.nome));
                break;
            case 'name_desc':
                users.sort((a, b) => b.nome.localeCompare(a.nome));
                break;
            case 'date':
                users.sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro));
                break;
            case 'date_asc':
                users.sort((a, b) => new Date(a.data_cadastro) - new Date(b.data_cadastro));
                break;
            case 'email':
                users.sort((a, b) => a.email.localeCompare(b.email));
                break;
        }
        displayUsers();
    }

    // Event listener para ordenação
    $('#sortUsers').change(function () {
        sortUsers($(this).val());
    });

    // Função para editar usuário
    function editUser(user) {
        editingId = user.id_usuario;
        $('#nome').val(user.nome);
        $('#email').val(user.email);
        $('button[type="submit"]').text('Atualizar');
        $('.card-header h1').text('Editar Usuário');

        // Scroll suave até o formulário
        $('html, body').animate({
            scrollTop: $('#user-form').offset().top - 100
        }, 500);
    }

    // Função para deletar usuário
    function deleteUser(id) {
        const modal = document.getElementById('feedbackModal');
        const modalTitle = modal.querySelector('#modalTitle');
        const modalMessage = modal.querySelector('#modalMessage');
        const modalIcon = modal.querySelector('#modalIcon');

        modalTitle.textContent = 'Confirmar Exclusão';
        modalMessage.textContent = 'Tem certeza que deseja excluir este usuário?';
        modalIcon.className = 'bi bi-exclamation-triangle-fill text-danger me-3 fs-1';

        const modalFooter = modal.querySelector('.modal-footer');
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" id="confirmDelete">Excluir</button>
        `;

        const feedbackModal = new bootstrap.Modal(modal);
        feedbackModal.show();

        document.getElementById('confirmDelete').onclick = function () {
            $.ajax({
                url: '/api/users/' + id,
                type: 'DELETE',
                success: function (response) {
                    var result = JSON.parse(response);
                    feedbackModal.hide();

                    if (result.success) {
                        showFeedback(true, 'Usuário excluído com sucesso!');
                        loadUsers();
                        loadStats();
                    } else {
                        showFeedback(false, 'Erro ao excluir: ' + result.error);
                    }
                },
                error: function (xhr, status, error) {
                    feedbackModal.hide();
                    showFeedback(false, 'Erro ao excluir usuário');
                }
            });
        };
    }

    // Função para mostrar feedback
    function showFeedback(success, message) {
        const modal = document.getElementById('feedbackModal');
        const modalTitle = modal.querySelector('#modalTitle');
        const modalMessage = modal.querySelector('#modalMessage');
        const modalIcon = modal.querySelector('#modalIcon');

        modalTitle.textContent = success ? 'Sucesso' : 'Erro';
        modalMessage.textContent = message;
        modalIcon.className = success ?
            'bi bi-check-circle-fill text-success me-3 fs-1' :
            'bi bi-x-circle-fill text-danger me-3 fs-1';

        const modalFooter = modal.querySelector('.modal-footer');
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-${success ? 'primary' : 'danger'}" data-bs-dismiss="modal">OK</button>
        `;

        const feedbackModal = new bootstrap.Modal(modal);
        feedbackModal.show();
    }

    // Manipula o envio do formulário
    $('#user-form').submit(function (e) {
        e.preventDefault();

        let formData = $(this).serialize();
        if (editingId) {
            formData += '&action=update&id=' + editingId;
        } else {
            formData += '&action=add';
        }

        $.ajax({
            url: '/api/users',
            type: 'POST',
            data: formData,
            success: function (response) {
                var result = JSON.parse(response);
                if (result.success) {
                    showFeedback(true, editingId ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
                    $('#user-form')[0].reset();
                    editingId = null;
                    $('button[type="submit"]').text('Cadastrar');
                    $('.card-header h1').text('Cadastro de Usuário');
                    loadUsers();
                    loadStats();
                } else {
                    showFeedback(false, 'Erro: ' + result.error);
                }
            },
            error: function (xhr, status, error) {
                showFeedback(false, 'Erro ao realizar operação');
            }
        });
    });

    // Carrega os dados iniciais
    loadUsers();
    loadStats();

    // Atualizar as funções de exportação
    function exportToPDF() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        modal.hide();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Adiciona cabeçalho
        doc.setFontSize(20);
        doc.setTextColor(74, 144, 226);
        doc.text("TaskHub - Relatório de Usuários", 14, 20);

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
            head: [["Nome", "Email", "Data de Cadastro", "Status"]],
            body: users.map(user => [
                user.nome,
                user.email,
                new Date(user.data_cadastro).toLocaleDateString('pt-BR'),
                user.id_usuario ? 'Ativo' : 'Inativo'
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 5
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 60 },
                2: { cellWidth: 40, halign: 'center' },
                3: { cellWidth: 30, halign: 'center' }
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        });

        // Adiciona rodapé
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(108, 117, 125);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        doc.save("TaskHub_Usuarios.pdf");
    }

    function exportToExcel() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        modal.hide();

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
        excelContent += '<Worksheet ss:Name="Usuarios">\n';
        excelContent += '<Table>\n';

        // Título e Data
        excelContent += `
            <Row>
                <Cell ss:StyleID="Title"><Data ss:Type="String">TaskHub - Relatório de Usuários</Data></Cell>
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
        ["Nome", "Email", "Data de Cadastro", "Status"].forEach(header => {
            excelContent += `<Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>\n`;
        });
        excelContent += '</Row>\n';

        // Dados
        users.forEach(user => {
            excelContent += '<Row>\n';
            excelContent += `<Cell><Data ss:Type="String">${user.nome}</Data></Cell>\n`;
            excelContent += `<Cell><Data ss:Type="String">${user.email}</Data></Cell>\n`;
            excelContent += `<Cell><Data ss:Type="String">${new Date(user.data_cadastro).toLocaleDateString('pt-BR')}</Data></Cell>\n`;
            excelContent += `<Cell><Data ss:Type="String">${user.id_usuario ? 'Ativo' : 'Inativo'}</Data></Cell>\n`;
            excelContent += '</Row>\n';
        });

        excelContent += '</Table>\n</Worksheet>\n</Workbook>';

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'TaskHub_Usuarios.xls';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Adicionar event listener para o botão de exportar
    $(document).ready(function () {
        $('#exportUsersBtn').on('click', function () {
            const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
            exportModal.show();
        });
    });

    // Adicionar após as funções existentes
    function viewUserProfile(userId) {
        // Busca os dados do usuário e suas tarefas
        $.ajax({
            url: '/api/users/' + userId,
            type: 'GET',
            success: function (response) {
                try {
                    const data = JSON.parse(response);

                    // Preenche as informações do usuário
                    $('#profileName').text(data.user.nome);
                    $('#profileEmail').text(data.user.email);
                    $('#profileDate').text(new Date(data.user.data_cadastro).toLocaleDateString('pt-BR'));

                    // Limpa e preenche a lista de tarefas
                    const tasksList = $('#userTasksList');
                    tasksList.empty();

                    if (data.tasks.length > 0) {
                        data.tasks.forEach(task => {
                            // Define a cor baseada na prioridade
                            let priorityClass = '';
                            switch (task.prioridade) {
                                case 'alta':
                                    priorityClass = 'text-danger';
                                    break;
                                case 'media':
                                    priorityClass = 'text-warning';
                                    break;
                                case 'baixa':
                                    priorityClass = 'text-success';
                                    break;
                            }

                            // Cria o elemento da tarefa
                            tasksList.append(`
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">${task.tarefa}</h6>
                                            <p class="mb-1 small text-muted">
                                                <i class="bi bi-folder me-1"></i> ${task.setor || 'Sem setor'}
                                            </p>
                                            ${task.data_vencimento ? `
                                                <p class="mb-0 small text-muted">
                                                    <i class="bi bi-calendar-event me-1"></i>
                                                    Vence em: ${new Date(task.data_vencimento).toLocaleDateString('pt-BR')}
                                                </p>
                                            ` : ''}
                                        </div>
                                        <div class="d-flex flex-column align-items-end">
                                            <span class="badge ${priorityClass} mb-2">
                                                ${task.prioridade.toUpperCase()}
                                            </span>
                                            <span class="badge bg-secondary">
                                                ${task.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `);
                        });
                    } else {
                        tasksList.append(`
                            <div class="text-center text-muted py-3">
                                <i class="bi bi-inbox fs-4 d-block mb-2"></i>
                                Nenhuma tarefa atribuída
                            </div>
                        `);
                    }

                    // Abre o modal
                    new bootstrap.Modal(document.getElementById('userProfileModal')).show();
                } catch (e) {
                    console.error('Erro ao processar dados:', e);
                }
            },
            error: function (xhr, status, error) {
                console.error('Erro ao carregar perfil:', error);
            }
        });
    }

    // Adiciona event listeners para os botões de exportação
    $('#exportPDFBtn').on('click', function() {
        exportToPDF();
    });

    $('#exportExcelBtn').on('click', function() {
        exportToExcel();
    });
});
