/**
 * Saborytec - Gestión de Horarios
 * Desarrollado por: FREDY
 */

const API_HORARIOS = "https://saborytecapi-production.up.railway.app/api/horarios";

//const API_HORARIOS = "http://saborytecapi.test/api/horarios";
let horariosGlobal = [];

// ============================================================
// OBTENER HORARIOS (Sincronizado con el Token)
// ============================================================
async function obtenerHorarios() {
    const contenedor = document.getElementById("contenido-dinamico");
    if (!contenedor) return;

    // Loader premium estilo Saborytec
    contenedor.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <i class='bx bx-loader-alt bx-spin' style="font-size: 3rem; color: var(--primary);"></i>
            <p style="margin-top:10px; color: var(--text-muted);">Sincronizando horarios con el servidor...</p>
        </div>`;

    try {
        // Llamada al helper fetchVendedor que maneja el Bearer Token automáticamente
        const horarios = await window.fetchVendedor("horarios/vendedor/mis-horarios");

        // Validamos que la respuesta sea un array antes de procesar
        if (horarios && Array.isArray(horarios)) {
            horariosGlobal = horarios;
            mostrarHorarios(horarios);
        } else {
            // Si la respuesta es vacía o incorrecta, mostramos el estado vacío
            mostrarHorarios([]);
        }
    } catch (error) {
        console.error("Error al cargar horarios:", error);
        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-error-circle' style="font-size: 3rem; color: #ff4d4d;"></i>
                <p>Error al conectar con la base de datos de horarios.</p>
            </div>`;
    }
}

// ============================================================
// MOSTRAR HORARIOS EN EL HTML
// ============================================================
function mostrarHorarios(horarios) {
    const contenedor = document.getElementById("contenido-dinamico");

    let html = `
        <div class="modulo-header text-left fade-in-row">
            <div>
                <h2 class="modulo-titulo">Gestión de Horarios</h2>
                <p class="modulo-desc">Define cuándo está abierta tu tienda para los estudiantes.</p>
            </div>
            <button class="btn-add-user" onclick="modalAgregarHorario()">
                <i class='bx bx-plus'></i> Agregar Día
            </button>
        </div>

        <div class="horarios-container fade-in-row">
            <div class="horarios-grid">
    `;

    if (horarios.length === 0) {
        html += `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; opacity:0.6;">
                <i class='bx bx-calendar-x' style="font-size: 4rem; display: block; margin-bottom: 10px;"></i>
                <p>No hay horarios configurados. Pulsa "Agregar Día" para comenzar.</p>
            </div>`;
    } else {
        horarios.forEach(h => {
            const activo = h.estado === "activo";
            html += `
                <div class="horario-card ${activo ? "" : "disabled"}" id="horario-${h.ID_horario}">
                    <div class="horario-card-header">
                        <span class="dia-nombre">${h.dia_semana.toUpperCase()}</span>
                        <label class="switch">
                            <input type="checkbox" ${activo ? "checked" : ""} onchange="toggleEstadoDia(${h.ID_horario}, this)">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="horario-inputs">
                        <div class="time-input-group">
                            <label>APERTURA</label>
                            <input type="time" value="${h.hora_apertura || '08:00'}" ${activo ? "" : "disabled"}>
                        </div>
                        <div class="time-input-group">
                            <label>CIERRE</label>
                            <input type="time" value="${h.hora_cierre || '18:00'}" ${activo ? "" : "disabled"}>
                        </div>
                    </div>
                    <div class="horario-actions">
                        <button class="btn-edit-horario" onclick="modalEditarHorario(${h.ID_horario})" title="Editar detalle">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button class="btn-delete-horario" onclick="modalEliminarHorario(${h.ID_horario})" title="Eliminar día">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>
        <div class="form-actions-container fade-in-row" style="margin-top: 30px;">
            <button class="btn-action-tienda btn-save-tienda" onclick="guardarCambiosRapidos()">
                <i class='bx bx-cloud-upload'></i> Guardar Cambios Rápidos
            </button>
        </div>`;

    contenedor.innerHTML = html;
}

// ============================================================
// GUARDAR CAMBIOS (Actualización Masiva Paralela)
// ============================================================
async function guardarCambiosRapidos() {
    const btn = document.querySelector(".btn-save-tienda");
    const cards = document.querySelectorAll(".horario-card");
    const token = localStorage.getItem("auth_token");

    if (!token || cards.length === 0) return;

    // Feedback visual de carga
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Actualizando...";

    // Generamos las promesas de actualización para cada card
    const promesas = Array.from(cards).map(card => {
        const id = card.id.replace("horario-", "");
        const inputs = card.querySelectorAll("input[type='time']");
        const estado = card.classList.contains("disabled") ? "inactivo" : "activo";

        const datos = {
            hora_apertura: inputs[0].value,
            hora_cierre: inputs[1].value,
            estado: estado
        };

        return fetch(`${API_HORARIOS}/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json", 
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
    });

    try {
        const resultados = await Promise.all(promesas);
        
        // Verificamos si alguna petición falló
        const algunaFalla = resultados.some(res => !res.ok);
        
        if (algunaFalla) {
            throw new Error("Uno o más horarios no pudieron actualizarse.");
        }

        alert("Todos los horarios se han actualizado correctamente.");
        obtenerHorarios(); // Recargar para confirmar datos del servidor
    } catch (error) {
        console.error("Error al guardar cambios rápidos:", error);
        alert("Ocurrió un error al procesar la actualización masiva.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ============================================================
// HELPERS DE INTERFAZ
// ============================================================
function toggleEstadoDia(id, checkbox) {
    const card = document.getElementById(`horario-${id}`);
    const inputs = card.querySelectorAll("input[type='time']");
    
    if (checkbox.checked) {
        card.classList.remove("disabled");
        inputs.forEach(i => i.disabled = false);
    } else {
        card.classList.add("disabled");
        inputs.forEach(i => i.disabled = true);
    }
}

// Exponer funciones para que funcionen desde el HTML dinámico
window.obtenerHorarios = obtenerHorarios;
window.guardarCambiosRapidos = guardarCambiosRapidos;
window.toggleEstadoDia = toggleEstadoDia;