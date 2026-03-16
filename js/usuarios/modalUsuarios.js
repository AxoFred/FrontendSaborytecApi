// ============================================================
// MODAL CREAR USUARIO
// ============================================================

function modalCrearUsuario() {
  const modal = `
<div class="modal-overlay" id="modalUsuario">

<div class="modal-box">

<h3>Nuevo Usuario</h3>

<form id="formCrearUsuario">

<input type="text" name="nombre" placeholder="Nombre" required>

<input type="text" name="Apaterno" placeholder="Apellido Paterno">

<input type="text" name="Amaterno" placeholder="Apellido Materno">

<input type="email" name="correo" placeholder="Correo" required>

<input type="password" name="password" placeholder="Contraseña" required>

<input type="text" name="telefono" placeholder="Telefono">

<label>Rol</label>
<select name="ID_rol">
<option value="1">Administrador</option>
<option value="2">Vendedor</option>
<option value="3">Cliente</option>
</select>

<label>Estado</label>
<select name="estado">
<option value="activo">Activo</option>
<option value="inactivo">Inactivo</option>
</select>

<div class="modal-actions">

<button type="submit">Guardar</button>

<button type="button" onclick="cerrarModal('modalUsuario')">
Cancelar
</button>

</div>

</form>

</div>
</div>
`;

  document.body.insertAdjacentHTML("beforeend", modal);
}

// ============================================================
// MODAL EDITAR USUARIO
// ============================================================

function modalEditarUsuario(usuario) {
  const modal = `
<div class="modal-overlay" id="modalEditarUsuario">

<div class="modal-box">

<h3>Editar Usuario</h3>

<form id="formEditarUsuario">

<input type="hidden" name="ID_usuario" value="${usuario.ID_usuario}">

<input type="text" name="nombre" value="${usuario.nombre}" required>

<input type="text" name="Apaterno" value="${usuario.Apaterno || ""}">

<input type="text" name="Amaterno" value="${usuario.Amaterno || ""}">

<input type="email" name="correo" value="${usuario.correo}" required>

<input type="password" name="password" placeholder="Nueva contraseña (opcional)">

<input type="text" name="telefono" value="${usuario.telefono || ""}">

<label>Rol</label>
<select name="ID_rol">

<option value="1" ${usuario.ID_rol == 1 ? "selected" : ""}>Administrador</option>
<option value="2" ${usuario.ID_rol == 2 ? "selected" : ""}>Vendedor</option>
<option value="3" ${usuario.ID_rol == 3 ? "selected" : ""}>Cliente</option>

</select>

<label>Estado</label>
<select name="estado">

<option value="activo" ${usuario.estado == "activo" ? "selected" : ""}>Activo</option>
<option value="inactivo" ${usuario.estado == "inactivo" ? "selected" : ""}>Inactivo</option>

</select>

<div class="modal-actions">

<button type="submit">Actualizar</button>

<button type="button" onclick="cerrarModal('modalEditarUsuario')">
Cancelar
</button>

</div>

</form>

</div>
</div>
`;

  document.body.insertAdjacentHTML("beforeend", modal);
}

// ============================================================
// MODAL CONFIRMAR ELIMINAR
// ============================================================

function modalEliminarUsuario(id) {
  const modal = `
<div class="modal-overlay" id="modalEliminarUsuario">

<div class="modal-box">

<h3>Eliminar Usuario</h3>

<p>¿Seguro que deseas eliminar este usuario?</p>

<div class="modal-actions">

<button onclick="confirmarEliminarUsuario(${id})">
Eliminar
</button>

<button onclick="cerrarModal('modalEliminarUsuario')">
Cancelar
</button>

</div>

</div>
</div>
`;

  document.body.insertAdjacentHTML("beforeend", modal);
}

// ============================================================
// CERRAR MODAL
// ============================================================

function cerrarModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.remove();
  }
}
