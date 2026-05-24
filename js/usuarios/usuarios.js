/**
 * Saborytec - Gestión de Usuarios
 * Desarrollado por: FREDY & VICTOR
 */

// Usamos un bloque para encapsular el alcance y evitar errores de "Identifier already declared"
{
    //const API_URL_USERS = "https://saborytecapi-production.up.railway.app/api/usuarios";
    const API_URL_USERS = "http://saborytecapi.test/api/usuarios";
    
    // Solo declaramos la función de headers si no existe en el scope global
    if (typeof window.getAuthHeaders !== 'function') {
        window.getAuthHeaders = () => ({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}` // Sincronizado
        });
    }

    // Estado global accesible para el módulo
    window.usuariosGlobal = [];
    window.viendoOcultos = false;

    // ============================================================
    // OBTENER USUARIOS
    // ============================================================
    window.obtenerUsuarios = async function(datosPrevios = null) {
        const contenedor = document.getElementById("contenido-dinamico");
        
        if (!datosPrevios) {
            contenedor.innerHTML = `<div class="loader-container"><p>Cargando usuarios...</p></div>`;
            try {
                const urlFinal = viendoOcultos ? `${API_URL_USERS}/ocultos` : API_URL_USERS;
                const response = await fetch(urlFinal, {
                    method: "GET",
                    headers: window.getAuthHeaders()
                });

                if (response.status === 401) {
                    console.error("Sesión inválida.");
                    localStorage.clear();
                    window.location.href = "../index.html";
                    return;
                }

                if (!response.ok) throw new Error("Error al obtener la lista.");

                const data = await response.json();
                window.usuariosGlobal = Array.isArray(data) ? data : (data.data || []);
            } catch (error) {
                console.error("Error API:", error);
                contenedor.innerHTML = `<div class="empty-state"><p>Error al conectar con la API.</p></div>`;
                return;
            }
        } else {
            window.usuariosGlobal = datosPrevios;
        }

        mostrarSeccionUsuarios(window.usuariosGlobal);
    };

    // ============================================================
    // LÓGICA DE FILTRADO
    // ============================================================
    window.filtrarUsuarios = function() {
        const busqueda = document.getElementById("filter-search").value.toLowerCase();
        const rol = document.getElementById("filter-rol").value;
        const estado = document.getElementById("filter-estado").value;

        const filtrados = window.usuariosGlobal.filter(user => {
            const matchTexto = (user.correo?.toLowerCase().includes(busqueda)) || 
                               (user.nombre?.toLowerCase().includes(busqueda)) ||
                               (user.Apaterno?.toLowerCase().includes(busqueda));
            
            const matchRol = rol === "" || user.ID_rol == rol;
            const matchEstado = estado === "" || user.estado?.toLowerCase() === estado.toLowerCase();

            return matchTexto && matchRol && matchEstado;
        });

        renderizarTabla(filtrados);
    };

    // ============================================================
    // UI - ESTRUCTURA PRINCIPAL
    // ============================================================
    window.mostrarSeccionUsuarios = function(usuarios) {
        const contenedor = document.getElementById("contenido-dinamico");

        contenedor.innerHTML = `
            <div class="modulo-header fade-in">
                <div class="text-left">
                    <h3 class="modulo-titulo">${viendoOcultos ? 'Papelera de Usuarios' : 'Gestión de Usuarios'}</h3>
                    <p class="modulo-desc">Administra el acceso y visibilidad de los usuarios.</p>
                </div>
                <div class="acciones-header" style="display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="alternarVistaOcultos()" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 15px; border-radius: 8px; cursor: pointer;">
                        <i class='bx ${viendoOcultos ? 'bx-low-vision' : 'bx-show'}'></i> 
                        ${viendoOcultos ? 'Ver Activos' : 'Ver Papelera'}
                    </button>
                    <button class="btn-add-user" onclick="modalCrearUsuario()">
                        <i class='bx bx-user-plus'></i> Nuevo Usuario
                    </button>
                </div>
            </div>

            <div class="filters-bar fade-in" style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; background: var(--bg-card); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="flex: 1; min-width: 200px; position: relative;">
                    <i class='bx bx-search' style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #888;"></i>
                    <input type="text" id="filter-search" placeholder="Buscar por nombre o correo..." onkeyup="filtrarUsuarios()" 
                           style="width: 100%; padding: 10px 10px 10px 35px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-main);">
                </div>
                <select id="filter-rol" onchange="filtrarUsuarios()" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-main);">
                    <option value="">Todos los Roles</option>
                    <option value="1">Administrador</option>
                    <option value="2">Vendedor</option>
                    <option value="3">Cliente</option>
                </select>
                <select id="filter-estado" onchange="filtrarUsuarios()" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-main);">
                    <option value="">Todos los Estados</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                </select>
            </div>
            <div id="tabla-usuarios-container"></div>
        `;
        renderizarTabla(usuarios);
    };

    window.renderizarTabla = function(usuarios) {
        const contenedorTabla = document.getElementById("tabla-usuarios-container");
        let html = `
            <div class="table-wrapper fade-in">
                <table class="premium-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellidos</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>`;

        if (usuarios.length === 0) {
            html += `<tr><td colspan="6" style="text-align:center; padding: 20px;">No se encontraron registros.</td></tr>`;
        }

        usuarios.forEach(user => {
            const estado = user.estado || "activo";
            const estadoClass = estado.toLowerCase() === "activo" ? "status-online" : "status-offline";
            const inicial = user.nombre ? user.nombre.charAt(0).toUpperCase() : "?";
            let rolNombre = user.ID_rol == 1 ? "Administrador" : user.ID_rol == 2 ? "Vendedor" : "Cliente";

            html += `
                <tr class="fade-in-row">
                    <td class="user-cell">
                        <div class="user-avatar">${inicial}</div>
                        <span class="user-name-text">${user.nombre}</span>
                    </td>
                    <td>${user.Apaterno || ""} ${user.Amaterno || ""}</td>
                    <td><small>${user.correo}</small></td>
                    <td><span class="status-pill ${estadoClass}">${estado}</span></td>
                    <td><span class="rol-badge ${rolNombre.toLowerCase()}">${rolNombre}</span></td>
                    <td class="actions-cell">
                        ${window.viendoOcultos ? 
                            `<button class="action-btn edit" title="Restaurar" onclick="activarUsuario(${user.ID_usuario})"><i class='bx bx-undo'></i></button>` : 
                            `<button class="action-btn edit" onclick="abrirEditarUsuario(${user.ID_usuario})"><i class='bx bx-edit-alt'></i></button>
                             <button class="action-btn delete" onclick="modalEliminarUsuario(${user.ID_usuario})"><i class='bx bx-trash'></i></button>`
                        }
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div>`;
        contenedorTabla.innerHTML = html;
    };

    // ============================================================
    // ACCIONES (DELETE, RESTORE, TOGGLE)
    // ============================================================
    window.alternarVistaOcultos = function() {
        window.viendoOcultos = !window.viendoOcultos;
        window.obtenerUsuarios();
    };

    window.activarUsuario = async function(id) {
        if (!confirm("¿Deseas restaurar este usuario?")) return;
        try {
            const response = await fetch(`${API_URL_USERS}/${id}/activar`, {
                method: "PATCH",
                headers: window.getAuthHeaders()
            });
            if (!response.ok) throw new Error("Error al restaurar");
            alert("Usuario restaurado con éxito");
            window.obtenerUsuarios();
        } catch (e) { alert(e.message); }
    };

    window.confirmarEliminarUsuario = async function(id) {
        try {
            const response = await fetch(`${API_URL_USERS}/${id}`, {
                method: "DELETE",
                headers: window.getAuthHeaders()
            });
            if (response.ok) {
                if (typeof cerrarModal === 'function') cerrarModal("modalEliminarUsuario");
                window.obtenerUsuarios();
            }
        } catch (e) { alert("No se pudo ocultar el usuario."); }
    };

    // ============================================================
    // MANEJO DE FORMULARIOS (SUBMIT)
    // ============================================================
    document.addEventListener("submit", async function(e) {
        if (e.target.id === "formCrearUsuario" || e.target.id === "formEditarUsuario") {
            e.preventDefault();
            const isEdit = e.target.id === "formEditarUsuario";
            const datos = Object.fromEntries(new FormData(e.target));
            const url = isEdit ? `${API_URL_USERS}/${datos.ID_usuario}` : API_URL_USERS;

            if (isEdit && (!datos.password || datos.password.trim() === "")) delete datos.password;

            try {
                const response = await fetch(url, {
                    method: isEdit ? "PUT" : "POST",
                    headers: window.getAuthHeaders(),
                    body: JSON.stringify(datos)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Error en la operación");
                
                if (typeof cerrarModal === 'function') {
                    cerrarModal(isEdit ? "modalEditarUsuario" : "modalUsuario");
                }
                window.obtenerUsuarios();
                alert(isEdit ? "Usuario actualizado" : "Usuario creado");
            } catch (error) { alert(error.message); }
        }
    });

    window.abrirEditarUsuario = function(id) {
        const usuario = window.usuariosGlobal.find(u => u.ID_usuario == id);
        if (usuario && typeof modalEditarUsuario === "function") {
            modalEditarUsuario(usuario);
        }
    };
}