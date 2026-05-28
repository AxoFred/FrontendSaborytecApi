const API_URL_CALIFICACION = "https://saborytecapi-production.up.railway.app/api";
const API_URL = "https://saborytecapi-production.up.railway.app/api/cliente";
const STORAGE_URL = "https://saborytecapi-production.up.railway.app/storage/";

//const API_URL_CALIFICACION = "http://saborytecapi.test/api";
//const API_URL = "http://saborytecapi.test/api/cliente";
//const STORAGE_URL = "http://saborytecapi.test/storage/";

let weather = null;
let loadingWeather = true;

document.addEventListener("DOMContentLoaded", () => {
    if (!verificarSesion()) return;

    renderizarBienvenida();
    obtenerClima(); 
    cargarTiendas();
    cargarProductosDestacados();
});

function obtenerHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function verificarSesion() {
    const token = localStorage.getItem('auth_token');
    if (!token || token === "undefined" || token === "null") {
        localStorage.clear();
        window.location.href = "../index.html";
        return false;
    }
    return true;
}

function renderizarBienvenida() {
    const userName = localStorage.getItem("user_name") || "Estudiante";
    const welcomeEl = document.getElementById("user-welcome");
    if (welcomeEl) welcomeEl.innerText = `Hola, ${userName}`;
}
function renderizarClima() {

    const welcomeSection = document.querySelector('.welcome-banner');

    if (!welcomeSection || !weather) return;

    const climaHTML = `
    
    <div class="weather-card">

        <div class="weather-top">

            <div>

                <p class="weather-city">
                    📍 ${weather.city}
                </p>

                <p class="weather-condition">
                    ${weather.condition}
                </p>

            </div>

            <img 
                src="${weather.icon}"
                class="weather-icon"
            >

        </div>

        <h1 class="weather-temp">
            ${weather.temperature}°C
        </h1>

        <div class="weather-info">

            <span>
                💧 ${weather.humidity}%
            </span>

            <span>
                ☔ ${weather.chance_of_rain}%
            </span>

        </div>

        <div class="weather-recommendation">
            ${weather.recommendation}
        </div>

    </div>
    `;

    welcomeSection.insertAdjacentHTML('beforeend', climaHTML);
}
async function obtenerClima() {

    try {

        navigator.geolocation.getCurrentPosition(

            async (position) => {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const response = await fetch(
                    `https://saborytecapi-production.up.railway.app/api/weather?lat=${lat}&lon=${lon}`
                );

                const data = await response.json();

                if (data.success) {

                    weather = data;

                    renderizarClima();

                }

                loadingWeather = false;
            },

            (error) => {

                console.log(error);

                loadingWeather = false;

            }

        );

    } catch (error) {

        console.log(error);

        loadingWeather = false;

    }
}
async function cargarTiendas() {
    const grid = document.getElementById("stores-grid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/tiendas`, {
            method: 'GET',
            headers: obtenerHeaders()
        });

        if (response.status === 401) return manejarSesionExpirada();
        if (!response.ok) throw new Error("Error en el servidor");
        
        let tiendas = await response.json();
        renderizarTiendas(tiendas, grid);

    } catch (error) {
        console.error("Error cargando tiendas:", error);
        grid.innerHTML = `<p style="color:red">Error de conexión.</p>`;
    }
}

function renderizarTiendas(tiendas, grid) {
    if (!tiendas || tiendas.length === 0) {
        grid.innerHTML = '<p class="text-muted">No hay tiendas disponibles.</p>';
        return;
    }

    grid.innerHTML = tiendas.map(tienda => {
        const imgPortada = tienda.portada ? STORAGE_URL + tienda.portada : '../Assets/img/default-store.jpg';
        const imgLogo = tienda.logo ? STORAGE_URL + tienda.logo : '../Assets/img/default-logo.png';
        const estaAbierto = tienda.estado === 'activo';
        
        // Convertimos el objeto tienda a un string seguro para el HTML
        const tiendaJson = JSON.stringify(tienda).replace(/"/g, '&quot;');

        return `
            <div class="store-card ${!estaAbierto ? 'closed' : ''}" 
                 onclick="abrirModalTienda(${tiendaJson})">
                <div class="store-img">
                    <img src="${imgPortada}" class="portada-img" onerror="this.src='../Assets/img/default-store.jpg'">
                    <div class="logo-overlay">
                        <img src="${imgLogo}" onerror="this.src='../Assets/img/default-logo.png'">
                    </div>
                    <span class="store-status ${estaAbierto ? 'status-open' : 'status-closed'}">
                        ${estaAbierto ? 'ABIERTO' : 'CERRADO'}
                    </span>
                </div>
                <div class="store-content">
                    <h4>${tienda.nombre}</h4>
                    <p class="store-desc">${tienda.descripcion || 'Sin descripción.'}</p>
                </div>
            </div>
        `;
    }).join('');
}

// --- LÓGICA DEL MODAL ---

function abrirModalTienda(tienda) {
    const modal = document.getElementById('tiendaModal');
    const body = document.getElementById('modal-body');

    // BLOQUEA EL SCROLL DEL BODY
    document.body.style.overflow = 'hidden';

    body.innerHTML = `
    
    <style>

        .modal-fade{
            animation:modalFade .25s ease;
            max-height:80vh;
            overflow-y:auto;
            padding-right:5px;
            
        }

        .modal-fade::-webkit-scrollbar{
            width:6px;
        }

        .modal-fade::-webkit-scrollbar-thumb{
            background:#ccc;
            border-radius:10px;
        }

        @keyframes modalFade{
            from{
                opacity:0;
                transform:translateY(15px) scale(.98);
            }
            to{
                opacity:1;
                transform:translateY(0) scale(1);
            }
        }

        .modal-portada{
            width:100%;
            height:180px;
            object-fit:cover;
            border-radius:14px;
            box-shadow:0 4px 12px rgba(0,0,0,.12);
        }

        .modal-header-store{
            display:flex;
            align-items:center;
            gap:15px;
            margin-top:15px;
        }

        .modal-logo{
            width:75px;
            height:75px;
            border-radius:50%;
            object-fit:cover;
            border:3px solid white;
            box-shadow:0 4px 10px rgba(0,0,0,.15);
        }

        .modal-title{
            color:#ffffff;
            margin:0;
            font-size:1.8rem;
            font-family:'Bebas Neue', sans-serif;
        }

        .status-badge{
            display:inline-block;
            margin-top:6px;
            padding:5px 12px;
            border-radius:20px;
            color:white;
            font-size:.75rem;
            font-weight:600;
        }

        .modal-description{
            color:#ffffff;
            margin-top:15px;
            line-height:1.5;
            font-size:.95rem;
        }

        .modal-box{
            background:#101010;
            border-radius:14px;
            padding:16px;
            margin-top:18px;
            border:1px solid #000000;
            color:#ffffff;
        }

        .modal-box h3{
            margin-bottom:12px;
            font-size:1rem;
        }

        .modal-box p{
            margin:6px 0;
            font-size:.9rem;
        }

        .social-container{
            display:flex;
            flex-wrap:wrap;
            gap:10px;
        }

        .social-btn{
            padding:9px 14px;
            border-radius:10px;
            color:white;
            text-decoration:none;
            font-weight:600;
            transition:.2s ease;
            font-size:.85rem;
        }

        .social-btn:hover{
            transform:translateY(-2px);
            opacity:.9;
        }

        .facebook{
            background:#1877f2;
        }

        .instagram{
            background:#E1306C;
        }

        .whatsapp{
            background:#25D366;
        }

        .tiktok{
            background:#000;
        }

        /* CONTENEDOR DE CALIFICACIONES CON SCROLL */

        #calificaciones-container{
            max-height:260px;
            overflow-y:auto;
            padding-right:5px;
        }

        #calificaciones-container::-webkit-scrollbar{
            width:6px;
        }

        #calificaciones-container::-webkit-scrollbar-thumb{
            background:#ccc;
            border-radius:10px;
        }

        .calificacion-card{
            background:#101010;
            border-radius:12px;
            padding:12px;
            margin-bottom:12px;
            border:1px solid #575656;
            transition:.2s ease;
        }

        .calificacion-card:hover{
            transform:translateY(-2px);
            box-shadow:0 4px 12px rgba(0,0,0,.06);
        }

        .calificacion-header{
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:8px;
        }

        .calificacion-header strong{
            font-size:.9rem;
        }

        .calificacion-stars{
            color:#ffc107;
            font-size:1rem;
        }

        .calificacion-comment{
            color:#ffffff;
            line-height:1.4;
            font-size:.9rem;
            margin:0;
        }

        .btn-products{

            width:100%;
            margin-top:20px;
            padding:14px;
            border:none;
            border-radius:12px;
            background:#ffffff;
            color:black;
            font-size:.95rem;
            font-weight:700;
            cursor:pointer;
            transition:.2s ease;
        }

        .btn-products:hover{
            background:#376072;
            transform:translateY(-2px);
        }

        @media(max-width:768px){

            .modal-header-store{
                flex-direction:column;
                align-items:flex-start;
            }

            .modal-title{
                font-size:1.5rem;
            }

            .modal-portada{
                height:150px;
            }

            .social-container{
                flex-direction:column;
            }

            .social-btn{
                text-align:center;
            }
        }

    </style>

    <div class="modal-fade">

        <img 
            src="${tienda.portada ? STORAGE_URL + tienda.portada : '../Assets/img/default-store.jpg'}" 
            class="modal-portada"
        >

        <div class="modal-header-store">

            <img 
                src="${tienda.logo ? STORAGE_URL + tienda.logo : '../Assets/img/default-logo.png'}"
                class="modal-logo"
            >

            <div>

                <h2 class="modal-title">
                    ${tienda.nombre}
                </h2>

                <span 
                    class="status-badge"
                    style="background:${tienda.estado === 'activo' ? '#28a745' : '#dc3545'};"
                >
                    ${tienda.estado === 'activo' ? 'ABIERTO' : 'CERRADO'}
                </span>

            </div>

        </div>

        <p class="modal-description">
            ${tienda.descripcion || 'Sin descripción disponible.'}
        </p>

        <div class="modal-box">

            <h3>Datos Bancarios</h3>

            <p><strong>Banco:</strong> ${tienda.banco || 'N/A'}</p>
            <p><strong>Titular:</strong> ${tienda.titular_cuenta || 'N/A'}</p>
            <p><strong>CLABE:</strong> ${tienda.clabe || 'No disponible'}</p>

        </div>

        <div class="modal-box">

            <h3>Redes Sociales</h3>

            <div class="social-container">

                ${tienda.facebook ? `
                    <a href="${tienda.facebook}" target="_blank" class="social-btn facebook">
                        Facebook
                    </a>
                ` : ''}

                ${tienda.instagram ? `
                    <a href="${tienda.instagram}" target="_blank" class="social-btn instagram">
                        Instagram
                    </a>
                ` : ''}

                ${tienda.whatsapp ? `
                    <a href="https://wa.me/${tienda.whatsapp}" target="_blank" class="social-btn whatsapp">
                        WhatsApp
                    </a>
                ` : ''}

                ${tienda.tiktok ? `
                    <a href="${tienda.tiktok}" target="_blank" class="social-btn tiktok">
                        TikTok
                    </a>
                ` : ''}

            </div>

        </div>

        <div class="modal-box">

            <h3>Calificaciones</h3>

            <div id="calificaciones-container">
                <p>Cargando calificaciones...</p>
            </div>

        </div>

        <button 
            class="btn-products"
            onclick="window.location.href='explorar.html?tienda=${tienda.ID_tienda}'"
        >
            VER PRODUCTOS
        </button>

    </div>
    `;

    modal.style.display = 'block';

    const modalContent = modal.querySelector('.modal-content');

    if (modalContent) {
        modalContent.style.maxWidth = '750px';
        modalContent.style.width = '92%';
        modalContent.style.borderRadius = '18px';
        modalContent.style.padding = '18px';
        modalContent.style.background = '#000000';
        modalContent.style.maxHeight = '85vh';
        modalContent.style.overflow = 'hidden';
    }

    cargarCalificaciones(tienda.ID_tienda);
}


async function cargarCalificaciones(idTienda) {
    try {
        const response = await fetch(
            `${API_URL_CALIFICACION}/tienda/${idTienda}/calificaciones`,
            {
                method: 'GET',
                headers: obtenerHeaders()
            }
        );

        if (!response.ok) {
            throw new Error('Error cargando calificaciones');
        }

        const result = await response.json();
        const calificaciones = result.data;

        const contenedor = document.getElementById('calificaciones-container');

        if (!calificaciones || calificaciones.length === 0) {
            contenedor.innerHTML = `
                <p style="color:#777;">
                    Esta tienda aún no tiene calificaciones.
                </p>
            `;
            return;
        }

        contenedor.innerHTML = calificaciones.map(c => `

    <div class="calificacion-card">

        <div class="calificacion-header">

            <div>

                <strong>
                    ${c.usuario?.nombre || 'Usuario'}
                </strong>

                <div style="
                    margin-top:4px;
                    color:#ffc107;
                    font-size:1rem;
                    letter-spacing:1px;
                ">
                    ${'⭐'.repeat(c.puntuacion || 0)}
                </div>

            </div>

        </div>

        <div style="
            margin-bottom:10px;
            font-size:.82rem;
            color:#ffffff;
            background:#202020;
            padding:8px 10px;
            border-radius:8px;
            line-height:1.4;
        ">

            🛒 ${
                c.pedido?.detalles
                    ?.map(d => d.producto?.nombre)
                    .filter(Boolean)
                    .join(', ')
                || 'Pedido realizado'
            }

        </div>

        <p class="calificacion-comment">
            ${c.comentario || 'Sin comentario'}
        </p>

    </div>

`).join('');

    } catch (error) {
        console.error(error);

        document.getElementById('calificaciones-container').innerHTML = `
            <p style="color:red;">
                No se pudieron cargar las calificaciones.
            </p>
        `;
    }
}

function cerrarModal() {
    document.getElementById('tiendaModal').style.display = 'none';

    // RESTAURA EL SCROLL NORMAL DEL HTML
    document.body.style.overflow = '';
}

window.onclick = function(event) {
    const modal = document.getElementById('tiendaModal');
    if (event.target == modal) cerrarModal();
};

// --- RESTO DE FUNCIONES ---

async function cargarProductosDestacados() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/productos/destacados`, {
            method: 'GET',
            headers: obtenerHeaders()
        });
        
        if (response.status === 401) return manejarSesionExpirada();
        const productos = await response.json();

        grid.innerHTML = productos.map(p => `
            <article class="product-card hot">
                <div class="product-img">
                    <img src="${p.imagen ? STORAGE_URL + 'productos/' + p.imagen : '../Assets/img/default-product.png'}">
                </div>
                <div class="product-info">
                    <h3>${p.nombre}</h3>
                    <span class="price">$${parseFloat(p.precio).toFixed(2)}</span>
                    <button class="add-btn" onclick="window.location.href='detalle.html?id=${p.ID_producto}'">
                        VER DETALLES
                    </button>
                </div>
            </article>
        `).join('');
    } catch (error) {
        grid.innerHTML = '<p class="text-muted">No se pudieron cargar los destacados.</p>';
    }
}

function manejarSesionExpirada() {
    alert("Tu sesión ha expirado.");
    localStorage.clear();
    window.location.href = "../index.html"; 
}

const logoutBtn = document.querySelector('.cart-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "../index.html"; 
    });
}