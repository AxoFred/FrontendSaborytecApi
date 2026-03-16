// ============================================================
// URL API
// ============================================================

const API_TIENDAS = "http://127.0.0.1:8000/api/tiendas";

let tiendaGlobal = null;


// ============================================================
// OBTENER TIENDA
// ============================================================

async function obtenerTienda(){

    const contenedor = document.getElementById('contenido-dinamico');

    contenedor.innerHTML = `
        <div class="empty-state">
            <i class='bx bxs-store'></i>
            <p>Cargando configuración de tienda...</p>
        </div>
    `;

    try{

        const response = await fetch(API_TIENDAS);

        if(!response.ok){
            throw new Error("No se pudo obtener la tienda");
        }

        const tiendas = await response.json();

        tiendaGlobal = tiendas[0];

        mostrarFormularioTienda(tiendaGlobal);

    }catch(error){

        console.error("Error:", error);

        contenedor.innerHTML = `
            <div class="empty-state">
                <p>Error cargando tienda</p>
            </div>
        `;

    }

}



// ============================================================
// MOSTRAR FORMULARIO
// ============================================================

function mostrarFormularioTienda(tienda){

    const contenedor = document.getElementById('contenido-dinamico');

    contenedor.innerHTML = `

        <div class="modulo-header text-left fade-in-row">
            <div>
                <h2 class="modulo-titulo">Configuración de Mi Tienda</h2>
                <p class="modulo-desc">
                    Actualiza la identidad visual, redes y datos bancarios de tu local.
                </p>
            </div>
        </div>

        <form id="form-tienda" class="fade-in-row">

            <div class="image-upload-section">

                <div class="portada-preview"
                id="portada-bg"
                style="background-image:url('${tienda?.portada || "../img/default-portada.jpg"}')">

                    <div class="upload-overlay">

                        <i class='bx bx-camera'></i>

                        <input type="file"
                        id="input-portada"
                        accept="image/*"
                        onchange="previewImage(event,'portada-bg')">

                    </div>

                    <div class="logo-preview-wrapper">

                        <div class="logo-preview"
                        id="logo-img"
                        style="background-image:url('${tienda?.logo || "../img/default-logo.png"}')">

                            <i class='bx bx-plus' id="plus-icon"></i>

                            <input type="file"
                            id="input-logo"
                            accept="image/*"
                            onchange="previewImage(event,'logo-img')">

                        </div>

                    </div>

                </div>

            </div>



            <div class="form-grid-2">

                <div class="input-group">

                    <label>NOMBRE DE LA TIENDA</label>

                    <input type="text"
                    id="nombre"
                    value="${tienda?.nombre || ""}"
                    placeholder="Nombre comercial">

                </div>

                <div class="input-group">

                    <label>ESTADO DE VISIBILIDAD</label>

                    <select id="visible">

                        <option value="1" ${tienda?.visible == 1 ? "selected":""}>
                        Activo
                        </option>

                        <option value="0" ${tienda?.visible == 0 ? "selected":""}>
                        Inactivo
                        </option>

                    </select>

                </div>

            </div>



            <div class="input-group">

                <label>DESCRIPCIÓN BREVE</label>

                <textarea id="descripcion" rows="2"
                placeholder="Describe tu especialidad...">${tienda?.descripcion || ""}</textarea>

            </div>



            <h3 class="form-subtitulo">Redes Sociales y Contacto</h3>

            <div class="form-grid-2">

                <div class="input-social facebook">
                    <i class='bx bxl-facebook-circle'></i>
                    <input id="facebook" type="text"
                    value="${tienda?.facebook || ""}"
                    placeholder="Facebook">
                </div>

                <div class="input-social instagram">
                    <i class='bx bxl-instagram'></i>
                    <input id="instagram" type="text"
                    value="${tienda?.instagram || ""}"
                    placeholder="Instagram">
                </div>

                <div class="input-social whatsapp">
                    <i class='bx bxl-whatsapp'></i>
                    <input id="whatsapp" type="text"
                    value="${tienda?.whatsapp || ""}"
                    placeholder="WhatsApp">
                </div>

                <div class="input-social tiktok">
                    <i class='bx bxl-tiktok'></i>
                    <input id="tiktok" type="text"
                    value="${tienda?.tiktok || ""}"
                    placeholder="TikTok">
                </div>

            </div>



            <h3 class="form-subtitulo">Información de Pago</h3>

            <div class="form-grid-3">

                <div class="input-group">
                    <label>BANCO</label>
                    <input id="banco" type="text"
                    value="${tienda?.banco || ""}"
                    placeholder="Ej. BBVA">
                </div>

                <div class="input-group">
                    <label>CLABE (18 DÍGITOS)</label>
                    <input id="clabe" type="text"
                    maxlength="18"
                    value="${tienda?.clabe || ""}">
                </div>

                <div class="input-group">
                    <label>TITULAR</label>
                    <input id="titular" type="text"
                    value="${tienda?.titular_cuenta || ""}">
                </div>

            </div>



            <div class="form-actions-container">

                <button type="button"
                class="btn-action-tienda btn-save-tienda"
                onclick="guardarCambiosTienda()">

                    <i class='bx bx-save'></i> Guardar

                </button>

            </div>

        </form>
    `;
}



// ============================================================
// GUARDAR CAMBIOS
// ============================================================

async function guardarCambiosTienda(){

    const id = tiendaGlobal.ID_tienda;

    const datos = {

        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        visible: document.getElementById("visible").value,

        facebook: document.getElementById("facebook").value,
        instagram: document.getElementById("instagram").value,
        whatsapp: document.getElementById("whatsapp").value,
        tiktok: document.getElementById("tiktok").value,

        banco: document.getElementById("banco").value,
        clabe: document.getElementById("clabe").value,
        titular: document.getElementById("titular_cuenta").value

    };

    try{

        const response = await fetch(`${API_TIENDAS}/${id}`,{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body: JSON.stringify(datos)

        });

        if(!response.ok){
            throw new Error("Error actualizando tienda");
        }

        alert("Tienda actualizada correctamente");

    }catch(error){

        console.error("Error:", error);

    }

}



// ============================================================
// PREVIEW IMAGEN
// ============================================================

function previewImage(event, elementId){

    const reader = new FileReader();

    reader.onload = function(){

        const output = document.getElementById(elementId);

        output.style.backgroundImage = `url('${reader.result}')`;

        if(elementId === 'logo-img'){
            document.getElementById('plus-icon').style.display = 'none';
        }

    };

    reader.readAsDataURL(event.target.files[0]);

}