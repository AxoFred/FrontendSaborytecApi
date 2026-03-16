// ============================================================
// URL API
// ============================================================

const API_URL = "http://127.0.0.1:8000/api/usuarios";

let usuariosGlobal = [];


// ============================================================
// OBTENER USUARIOS
// ============================================================

async function obtenerUsuarios(){

    const contenedor = document.getElementById("contenido-dinamico");

    contenedor.innerHTML = "<p>Cargando usuarios...</p>";

    try{

        const response = await fetch(API_URL);

        if(!response.ok){
            throw new Error("No se pudieron obtener usuarios");
        }

        const usuarios = await response.json();

        usuariosGlobal = usuarios;

        mostrarSeccionUsuarios(usuarios);

    }catch(error){

        console.error("Error cargando usuarios:", error);

        contenedor.innerHTML = `
            <div class="empty-state">
                <p>Error cargando usuarios</p>
            </div>
        `;
    }

}



// ============================================================
// MOSTRAR USUARIOS
// ============================================================

function mostrarSeccionUsuarios(usuarios){

    const contenedor = document.getElementById("contenido-dinamico");

    let html = `
        <div class="modulo-header">

            <div class="text-left">
                <h3 class="modulo-titulo">Gestión de Usuarios</h3>
                <p class="modulo-desc">
                    Visualiza y administra los privilegios de los usuarios registrados.
                </p>
            </div>

            <button class="btn-add-user" onclick="modalCrearUsuario()">
                <i class='bx bx-user-plus'></i> Nuevo Usuario
            </button>

        </div>

        <div class="table-wrapper">

            <table class="premium-table">

                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Paterno</th>
                        <th>Materno</th>
                        <th>Correo</th>
                        <th>Telefono</th>
                        <th>Estado</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
    `;



usuarios.forEach(user => {

    const estado = user.estado || "activo";

    const estadoClass =
        estado === "activo"
        ? "status-online"
        : "status-offline";



    let rolNombre = "Cliente";

    if(user.rol && user.rol.rol){
        rolNombre = user.rol.rol;
    }



    const rolClass = rolNombre.toLowerCase();



    const inicial =
        user.nombre
        ? user.nombre.charAt(0).toUpperCase()
        : "?";



    html += `

        <tr class="fade-in-row">

            <td class="user-cell">
                <div class="user-avatar">${inicial}</div>
                <span>${user.nombre}</span>
            </td>

            <td>${user.Apaterno || ""}</td>

            <td>${user.Amaterno || ""}</td>

            <td>${user.correo || ""}</td>

            <td>${user.telefono || ""}</td>

            <td>
                <span class="status-pill ${estadoClass}">
                    ${estado}
                </span>
            </td>

            <td>
                <span class="rol-badge ${rolClass}">
                    ${rolNombre}
                </span>
            </td>

            <td class="actions-cell">

                <button class="action-btn edit"
                onclick="abrirEditarUsuario(${user.ID_usuario})">
                <i class='bx bx-edit-alt'></i>
                </button>

                <button class="action-btn delete"
                onclick="modalEliminarUsuario(${user.ID_usuario})">
                <i class='bx bx-trash'></i>
                </button>

            </td>

        </tr>

    `;

});



    html += `
                </tbody>
            </table>
        </div>
    `;

    contenedor.innerHTML = html;

}



// ============================================================
// ABRIR MODAL EDITAR
// ============================================================

function abrirEditarUsuario(id){

    const usuario = usuariosGlobal.find(
        u => u.ID_usuario == id
    );

    if(!usuario){
        console.error("Usuario no encontrado");
        return;
    }

    modalEditarUsuario(usuario);

}



// ============================================================
// CONFIRMAR ELIMINAR
// ============================================================

async function confirmarEliminarUsuario(id){

    try{

        const response = await fetch(`${API_URL}/${id}`,{
            method:"DELETE"
        });

        if(!response.ok){
            throw new Error("Error eliminando usuario");
        }

        cerrarModal("modalEliminarUsuario");

        obtenerUsuarios();

    }catch(error){

        console.error("Error eliminando:", error);

    }

}



// ============================================================
// FORMULARIO CREAR USUARIO
// ============================================================

document.addEventListener("submit", async function(e){

    if(e.target.id === "formCrearUsuario"){

        e.preventDefault();

        const datos = Object.fromEntries(new FormData(e.target));

        try{

            const response = await fetch(API_URL,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify(datos)
            });

            if(!response.ok){
                throw new Error("Error creando usuario");
            }

            cerrarModal("modalUsuario");

            obtenerUsuarios();

        }catch(error){

            console.error("Error:", error);

        }

    }

});



// ============================================================
// FORMULARIO EDITAR USUARIO
// ============================================================

document.addEventListener("submit", async function(e){

    if(e.target.id === "formEditarUsuario"){

        e.preventDefault();

        let datos = Object.fromEntries(new FormData(e.target));

        const id = datos.ID_usuario;

        // contraseña opcional
        if(!datos.password || datos.password.trim() === ""){
            delete datos.password;
        }

        try{

            const response = await fetch(`${API_URL}/${id}`,{
                method:"PUT",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify(datos)
            });

            if(!response.ok){
                throw new Error("Error actualizando usuario");
            }

            cerrarModal("modalEditarUsuario");

            obtenerUsuarios();

        }catch(error){

            console.error("Error:", error);

        }

    }

});