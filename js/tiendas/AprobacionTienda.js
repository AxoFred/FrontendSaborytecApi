/**
 * Saborytec - Gestión de Aprobación de Tiendas
 * Desarrollado por: FREDY & VICTOR
 */

// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
//const API_BASE_TIENDAS = "https://saborytecapi-production.up.railway.app/api";
const API_BASE_TIENDAS = "http://saborytecapi.test/api";

const URL_API_APROBACION = `${API_BASE_TIENDAS}/admin/tiendas`;

// Helper para obtener las cabeceras de autorización sincronizadas
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token'); // CORRECCIÓN: Usar auth_token
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };
};

// ==========================================
// CARGAR TIENDAS PENDIENTES
// ==========================================
async function cargarTiendasPendientes() {
    const contenedor = document.getElementById('contenido-dinamico');
    
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="loader-container" style="text-align:center; padding:50px;">
            <p style="color:white;">Cargando tiendas pendientes de revisión...</p>
        </div>`;

    try {
        const response = await fetch(`${URL_API_APROBACION}/pendientes`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Acceso denegado: Token inválido");
                localStorage.clear();
                window.location.href = "../index.html"; // Redirigir al login institucional
                return;
            }
            throw new Error(`Error ${response.status}: No se pudo obtener la información`);
        }

        const respuestaJson = await response.json();
        const tiendas = Array.isArray(respuestaJson) ? respuestaJson : (respuestaJson.data || []);
        
        renderTiendas(tiendas);
    } catch (error) {
        console.error("Error al cargar tiendas:", error);
        contenedor.innerHTML = `
            <div class="alerta-error" style="color:white; background:rgba(255,0,0,0.2); padding:20px; border-radius:15px; text-align:center;">
                <h3 style="margin-top:0;">Fallo de conexión</h3>
                <p>${error.message}</p>
                <button onclick="cargarTiendasPendientes()" style="background:#376072; border:none; color:white; padding:10px 20px; border-radius:8px; cursor:pointer; margin-top:10px;">Reintentar</button>
            </div>`;
    }
}

// ==========================================
// RENDERIZADO DE TARJETAS (CARDS)
// ==========================================
function renderTiendas(tiendas) {
    const contenedor = document.getElementById('contenido-dinamico');
    
    if (!tiendas || tiendas.length === 0) {
        contenedor.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 50px; color: #ccc;">
                <i class="fas fa-store-slash" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                <p>No hay tiendas esperando revisión en este momento.</p>
            </div>`;
        return;
    }

    let html = `
        <div class="header-seccion" style="margin-bottom: 25px;">
            <h2 style="color: white; margin: 0;">Tiendas por Aprobar</h2>
            <p style="color: #888;">Valida los datos de registro antes de autorizar la publicación.</p>
        </div>
        <div class="grid-tiendas" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:25px;">
    `;

    tiendas.forEach(t => {
        //const baseUrl = "https://saborytecapi-production.up.railway.app";
        const baseUrl = "http://saborytecapi.test";

        const logoNombre = t.logo ? t.logo.split('/').pop() : null;
        const portadaNombre = t.portada ? t.portada.split('/').pop() : null;

        const urlLogo = logoNombre 
            ? `${baseUrl}/storage/logos/${logoNombre}` 
            : 'https://placehold.co/80x80?text=Logo';

        const urlPortada = portadaNombre 
            ? `${baseUrl}/storage/portadas/${portadaNombre}` 
            : 'https://placehold.co/400x150?text=Sin+Portada';

        html += `
            <div class="card-tienda" id="tienda-${t.ID_tienda}" style="background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:15px; overflow:hidden; transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
                
                <div class="card-media" style="position:relative; height:150px; background:#222;">
                    
                    <img src="${urlPortada}" 
                         style="width:100%; height:100%; object-fit:cover; opacity: 0.8;" 
                         alt="Portada"
                         onerror="this.onerror=null; this.src='https://placehold.co/400x150?text=Error';">
                    
                    <div class="logo-wrapper" style="position:absolute; bottom:-30px; left:20px;">
                        
                        <img src="${urlLogo}" 
                             style="width:70px; height:70px; border-radius:50%; border:3px solid #1a1a1a; background:#222; object-fit:cover;" 
                             alt="Logo"
                             onerror="this.onerror=null; this.src='https://placehold.co/80x80?text=Error';">
                    
                    </div>
                </div>

                <div class="card-body" style="padding:40px 20px 20px 20px; color:white;">
                    
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; font-size:1.2rem;">${t.nombre}</h3>
                        <span class="badge" style="background:rgba(255, 159, 67, 0.2); color:#ff9f43; padding:4px 8px; border-radius:5px; font-size:11px; text-transform:uppercase;">${t.aprobacion}</span>
                    </div>
                    
                    <p class="descripcion" style="font-size:14px; color:#aaa; margin-bottom:20px; height:40px; overflow:hidden;">
                        ${t.descripcion || 'Sin descripción proporcionada.'}
                    </p>
                    
                    <div class="info-pago" style="background:rgba(255,255,255,0.03); border-radius:10px; padding:15px; margin-bottom:20px; border: 1px solid rgba(255,255,255,0.05);">
                        <h4 style="font-size:12px; color:#376072; margin:0 0 10px 0; text-transform:uppercase;">Información Bancaria</h4>
                        <p style="margin:5px 0; font-size:13px;"><strong>Banco:</strong> ${t.banco || 'N/A'}</p>
                        <p style="margin:5px 0; font-size:13px;">
                            <strong>CLABE:</strong> 
                            <code style="color:#2ecc71; background:rgba(0,0,0,0.3); padding:2px 5px; border-radius:4px;">
                                ${t.clabe || 'No registrada'}
                            </code>
                        </p>
                    </div>

                    <div class="acciones" style="display:flex; gap:10px;">
                        <button onclick="procesarAccion(${t.ID_tienda}, 'aprobar')" 
                                style="flex:2; background:#376072; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">
                            Aprobar Tienda
                        </button>
                        
                        <button onclick="procesarAccion(${t.ID_tienda}, 'rechazar')" 
                                style="flex:1; background:rgba(255,71,87,0.1); color:#ff4757; border:1px solid rgba(255,71,87,0.2); padding:12px; border-radius:8px; cursor:pointer;">
                            Rechazar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contenedor.innerHTML = html;
}

// ==========================================
// PROCESAR ACCIÓN
// ==========================================
async function procesarAccion(id, accion) {
    if (!confirm(`¿Estás seguro de que deseas ${accion.toUpperCase()} esta tienda?`)) return;

    try {
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';

        const response = await fetch(`${URL_API_APROBACION}/${id}/${accion}`, {
            method: 'POST',
            headers: headers
        });

        const data = await response.json();

        if (response.ok && (data.status === 'success' || data.success)) {
            const elemento = document.getElementById(`tienda-${id}`);
            if (elemento) {
                elemento.style.transform = 'scale(0.8)';
                elemento.style.opacity = '0';
                setTimeout(() => {
                    cargarTiendasPendientes();
                }, 400);
            }
        } else {
            alert("Error del servidor: " + (data.message || "No se pudo completar la acción"));
        }
    } catch (error) {
        console.error(`Error al ejecutar ${accion}:`, error);
        alert("Fallo crítico: No se pudo conectar con el servidor.");
    }
}