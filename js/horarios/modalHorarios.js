/**
 * Saborytec - Sistema de Modales para Horarios
 * Desarrollado por: FREDY & VICTOR
 * Ajustado para: Autenticación Sanctum y Prevención de Duplicados
 */

// ============================================================
// MODALES (INTERFAZ)
// ============================================================

function modalAgregarHorario() {
    if (document.getElementById("modalHorario")) return;
    const modal = `
    <div class="modal-overlay" id="modalHorario">
        <div class="modal-box fade-in-up">
            <div class="modal-header-simple">
                <i class='bx bx-calendar-plus'></i>
                <h3>Nuevo Horario</h3>
            </div>
            <form id="formCrearHorario">
                <div class="input-group-modal">
                    <label><i class='bx bx-calendar-event'></i> Día de la Semana</label>
                    <select name="dia_semana" class="input-moderno" required>
                        <option value="lunes">Lunes</option>
                        <option value="martes">Martes</option>
                        <option value="miercoles">Miércoles</option>
                        <option value="jueves">Jueves</option>
                        <option value="viernes">Viernes</option>
                        <option value="sabado">Sábado</option>
                        <option value="domingo">Domingo</option>
                    </select>
                </div>
                
                <div class="input-row-modal">
                    <div class="input-group-modal">
                        <label>Apertura</label>
                        <input type="time" name="hora_apertura" class="input-moderno" value="08:00" required>
                    </div>
                    <div class="input-group-modal">
                        <label>Cierre</label>
                        <input type="time" name="hora_cierre" class="input-moderno" value="18:00" required>
                    </div>
                </div>

                <div class="modal-actions-moderno">
                    <button type="submit" class="btn-confirmar">Guardar Horario</button>
                    <button type="button" class="btn-cancelar" onclick="cerrarModal('modalHorario')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", modal);
}

function modalEditarHorario(id) {
    const h = horariosGlobal.find(item => item.ID_horario == id);
    if (!h) return;

    const modal = `
    <div class="modal-overlay" id="modalEditarHorario">
        <div class="modal-box fade-in-up">
            <div class="modal-header-simple">
                <i class='bx bx-edit-alt'></i>
                <h3>Editar Horario</h3>
            </div>
            <form id="formEditarHorario">
                <input type="hidden" name="ID_horario" value="${h.ID_horario}">
                
                <div class="input-group-modal">
                    <label>Día</label>
                    <input type="text" value="${h.dia_semana.toUpperCase()}" class="input-moderno" readonly style="background: #f0f0f0; color: #888;">
                    <input type="hidden" name="dia_semana" value="${h.dia_semana}">
                </div>

                <div class="input-row-modal">
                    <div class="input-group-modal">
                        <label>Apertura</label>
                        <input type="time" name="hora_apertura" value="${h.hora_apertura}" class="input-moderno" required>
                    </div>
                    <div class="input-group-modal">
                        <label>Cierre</label>
                        <input type="time" name="hora_cierre" value="${h.hora_cierre}" class="input-moderno" required>
                    </div>
                </div>

                <div class="input-group-modal">
                    <label>Estado del día</label>
                    <select name="estado" class="input-moderno">
                        <option value="activo" ${h.estado == "activo" ? "selected" : ""}>Activo (Abierto)</option>
                        <option value="inactivo" ${h.estado == "inactivo" ? "selected" : ""}>Inactivo (Cerrado)</option>
                    </select>
                </div>

                <div class="modal-actions-moderno">
                    <button type="submit" class="btn-confirmar">Actualizar</button>
                    <button type="button" class="btn-cancelar" onclick="cerrarModal('modalEditarHorario')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", modal);
}

// ============================================================
// PROCESAMIENTO DE FORMULARIOS (SUBMIT)
// ============================================================

document.addEventListener("submit", async function(e) {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
    };

    // --- CREAR ---
    if (e.target.id === "formCrearHorario") {
        e.preventDefault();
        const btn = e.target.querySelector("button[type='submit']");
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";

        const datos = Object.fromEntries(new FormData(e.target));
        datos.estado = "activo";

        try {
            const res = await fetch(API_HORARIOS, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(datos)
            });

            const data = await res.json();

            if (res.ok) {
                cerrarModal("modalHorario");
                obtenerHorarios();
            } else {
                // Muestra el mensaje de "Ya tienes un horario para este día" enviado por Laravel
                alert("⚠️ " + (data.message || "No se pudo crear el horario"));
            }
        } catch (err) { 
            alert("Error de conexión con el servidor.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    // --- EDITAR ---
    if (e.target.id === "formEditarHorario") {
        e.preventDefault();
        const btn = e.target.querySelector("button[type='submit']");
        btn.disabled = true;

        const datos = Object.fromEntries(new FormData(e.target));
        const id = datos.ID_horario;
        delete datos.ID_horario;

        try {
            const res = await fetch(`${API_HORARIOS}/${id}`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(datos)
            });

            if (res.ok) {
                cerrarModal("modalEditarHorario");
                obtenerHorarios();
            } else { 
                alert("Error al actualizar el horario."); 
            }
        } catch (err) { 
            console.error(err); 
        } finally {
            btn.disabled = false;
        }
    }
});

// ============================================================
// GUARDADO RÁPIDO (MASIVO)
// ============================================================

async function guardarCambiosRapidos() {
    const btn = document.querySelector(".btn-save-tienda");
    const cards = document.querySelectorAll(".horario-card");
    const token = localStorage.getItem("auth_token");

    if (!token || cards.length === 0) return;

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Actualizando...";

    const promesas = Array.from(cards).map(card => {
        const id = card.id.replace("horario-", "");
        const inputs = card.querySelectorAll("input[type='time']");
        const estado = card.classList.contains("disabled") ? "inactivo" : "activo";

        return fetch(`${API_HORARIOS}/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json", 
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                hora_apertura: inputs[0].value,
                hora_cierre: inputs[1].value,
                estado: estado
            })
        });
    });

    try {
        const resultados = await Promise.all(promesas);
        if (resultados.some(res => !res.ok)) throw new Error();
        alert("✅ Horarios actualizados.");
        obtenerHorarios();
    } catch (error) {
        alert("Hubo un error en la actualización masiva.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ============================================================
// ELIMINACIÓN
// ============================================================

function modalEliminarHorario(id) {
    const modal = `
    <div class="modal-overlay" id="modalEliminarHorario">
        <div class="modal-box fade-in-up text-center">
            <div style="color: #ff3b30; font-size: 4rem; margin-bottom: 15px;">
                <i class='bx bx-trash-alt'></i>
            </div>
            <h3>¿Eliminar este día?</h3>
            <p style="color: #666; margin-bottom: 20px;">Esta acción quitará el horario de atención para este día.</p>
            <div class="modal-actions-moderno">
                <button class="btn-confirmar btn-peligro" onclick="confirmarEliminar(${id})">Sí, eliminar</button>
                <button class="btn-cancelar" onclick="cerrarModal('modalEliminarHorario')">Cancelar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", modal);
}

async function confirmarEliminar(id) {
    const token = localStorage.getItem("auth_token");
    try {
        const res = await fetch(`${API_HORARIOS}/${id}`, { 
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });

        if (res.ok) {
            cerrarModal("modalEliminarHorario");
            obtenerHorarios();
        } else {
            alert("No se pudo eliminar.");
        }
    } catch (err) { console.error(err); }
}

// ============================================================
// HELPERS
// ============================================================

function cerrarModal(id) {
    const m = document.getElementById(id);
    if (m) {
        m.classList.add("fade-out");
        setTimeout(() => m.remove(), 200);
    }
}

// Exportación global
window.modalAgregarHorario = modalAgregarHorario;
window.modalEditarHorario = modalEditarHorario;
window.modalEliminarHorario = modalEliminarHorario;
window.confirmarEliminar = confirmarEliminar;
window.guardarCambiosRapidos = guardarCambiosRapidos;
window.cerrarModal = cerrarModal;