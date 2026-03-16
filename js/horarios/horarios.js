// URL base de tu API
const API_HORARIOS = "http://127.0.0.1:8000/api/horarios";

// Extraemos los datos del usuario logueado
const usuarioStorage = localStorage.getItem("usuario");
const usuarioData = usuarioStorage ? JSON.parse(usuarioStorage) : null;
const ID_USUARIO_LOGUEADO = usuarioData ? usuarioData.ID_usuario : null;

let horariosGlobal = []; // Para que los modales puedan consultar datos

// ============================================================
// OBTENER HORARIOS
// ============================================================
async function obtenerHorarios() {
    const contenedor = document.getElementById("contenido-dinamico");
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Cargando horarios...</p>";

    if (!ID_USUARIO_LOGUEADO) {
        contenedor.innerHTML = "<p>Error: Sesión no válida. Inicia sesión de nuevo.</p>";
        return;
    }

    try {
        // Usamos la ruta específica de vendedor que definiste en api.php
        const response = await fetch(`${API_HORARIOS}/vendedor/${ID_USUARIO_LOGUEADO}`, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("No se pudieron obtener los horarios");

        const horarios = await response.json();
        horariosGlobal = horarios;
        mostrarHorarios(horarios);

    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="empty-state"><p>Error cargando horarios del servidor</p></div>`;
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
                <p class="modulo-desc">Configura los horarios de atención para tu tienda.</p>
            </div>
            <button class="btn-add-user" onclick="modalAgregarHorario()">
                <i class='bx bx-plus'></i> Agregar Día
            </button>
        </div>

        <div class="horarios-container fade-in-row">
            <div class="horarios-grid">
    `;

    if (horarios.length === 0) {
        html += `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No tienes horarios registrados.</p>`;
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
                            <input type="time" value="${h.hora_apertura}" ${activo ? "" : "disabled"}>
                        </div>
                        <div class="time-input-group">
                            <label>CIERRE</label>
                            <input type="time" value="${h.hora_cierre}" ${activo ? "" : "disabled"}>
                        </div>
                    </div>
                    <div class="horario-actions">
                        <button class="btn-edit-horario" onclick="modalEditarHorario(${h.ID_horario})">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="btn-delete-horario" onclick="modalEliminarHorario(${h.ID_horario})">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>
        <div class="form-actions-container">
            <button class="btn-action-tienda btn-save-tienda" onclick="guardarCambiosRapidos()">
                <i class='bx bx-save'></i> Guardar Cambios Rápidos
            </button>
        </div>`;

    contenedor.innerHTML = html;
}

// ============================================================
// GUARDAR CAMBIOS DESDE LAS CARDS (BOTON INFERIOR)
// ============================================================
async function guardarCambiosRapidos() {
    const cards = document.querySelectorAll(".horario-card");
    
    for (let card of cards) {
        const id = card.id.replace("horario-", "");
        const inputs = card.querySelectorAll("input[type='time']");
        const estado = card.classList.contains("disabled") ? "inactivo" : "activo";

        const datos = {
            hora_apertura: inputs[0].value,
            hora_cierre: inputs[1].value,
            estado: estado
        };

        await fetch(`${API_HORARIOS}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(datos)
        });
    }
    alert("Horarios actualizados");
    obtenerHorarios();
}

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