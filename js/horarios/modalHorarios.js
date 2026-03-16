// ============================================================
// MODALES (INTERFAZ)
// ============================================================

function modalAgregarHorario() {
    if (document.getElementById("modalHorario")) return;
    const modal = `
    <div class="modal-overlay" id="modalHorario">
        <div class="modal-box">
            <h3>Nuevo Horario</h3>
            <form id="formCrearHorario">
                <label>Día</label>
                <select name="dia_semana" required>
                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                    <option value="miercoles">Miércoles</option>
                    <option value="jueves">Jueves</option>
                    <option value="viernes">Viernes</option>
                    <option value="sabado">Sábado</option>
                    <option value="domingo">Domingo</option>
                </select>
                <label>Apertura</label>
                <input type="time" name="hora_apertura" required>
                <label>Cierre</label>
                <input type="time" name="hora_cierre" required>
                <div class="modal-actions">
                    <button type="submit">Guardar</button>
                    <button type="button" onclick="cerrarModal('modalHorario')">Cancelar</button>
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
        <div class="modal-box">
            <h3>Editar Horario</h3>
            <form id="formEditarHorario">
                <input type="hidden" name="ID_horario" value="${h.ID_horario}">
                <label>Día</label>
                <select name="dia_semana">
                    <option value="lunes" ${h.dia_semana == "lunes" ? "selected" : ""}>Lunes</option>
                    <option value="martes" ${h.dia_semana == "martes" ? "selected" : ""}>Martes</option>
                    <option value="miercoles" ${h.dia_semana == "miercoles" ? "selected" : ""}>Miércoles</option>
                    <option value="jueves" ${h.dia_semana == "jueves" ? "selected" : ""}>Jueves</option>
                    <option value="viernes" ${h.dia_semana == "viernes" ? "selected" : ""}>Viernes</option>
                    <option value="sabado" ${h.dia_semana == "sabado" ? "selected" : ""}>Sábado</option>
                    <option value="domingo" ${h.dia_semana == "domingo" ? "selected" : ""}>Domingo</option>
                </select>
                <label>Apertura</label>
                <input type="time" name="hora_apertura" value="${h.hora_apertura}" required>
                <label>Cierre</label>
                <input type="time" name="hora_cierre" value="${h.hora_cierre}" required>
                <label>Estado</label>
                <select name="estado">
                    <option value="activo" ${h.estado == "activo" ? "selected" : ""}>Activo</option>
                    <option value="inactivo" ${h.estado == "inactivo" ? "selected" : ""}>Inactivo</option>
                </select>
                <div class="modal-actions">
                    <button type="submit">Actualizar</button>
                    <button type="button" onclick="cerrarModal('modalEditarHorario')">Cancelar</button>
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
    // CREAR
    if (e.target.id === "formCrearHorario") {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(e.target));
        datos.ID_usuario_vendedor = ID_USUARIO_LOGUEADO; // ID dinámico del login
        datos.estado = "activo";

        try {
            const res = await fetch(API_HORARIOS, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(datos)
            });
            if (res.ok) {
                cerrarModal("modalHorario");
                obtenerHorarios();
            } else {
                const errorData = await res.json();
                alert("Error: " + (errorData.message || "No se pudo crear"));
            }
        } catch (err) { console.error(err); }
    }

    // EDITAR
    if (e.target.id === "formEditarHorario") {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(e.target));
        const id = datos.ID_horario;
        delete datos.ID_horario;

        try {
            const res = await fetch(`${API_HORARIOS}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(datos)
            });
            if (res.ok) {
                cerrarModal("modalEditarHorario");
                obtenerHorarios();
            } else { alert("Error al actualizar"); }
        } catch (err) { console.error(err); }
    }
});

function modalEliminarHorario(id) {
    const modal = `
    <div class="modal-overlay" id="modalEliminarHorario">
        <div class="modal-box">
            <h3>¿Eliminar horario?</h3>
            <div class="modal-actions">
                <button onclick="confirmarEliminar(${id})">Sí, eliminar</button>
                <button onclick="cerrarModal('modalEliminarHorario')">Cancelar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", modal);
}

async function confirmarEliminar(id) {
    await fetch(`${API_HORARIOS}/${id}`, { method: "DELETE" });
    cerrarModal("modalEliminarHorario");
    obtenerHorarios();
}

function cerrarModal(id) {
    const m = document.getElementById(id);
    if (m) m.remove();
}