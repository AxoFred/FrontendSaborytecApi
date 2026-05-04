// ============================================================
// CARGADOR DE VISTAS DINÁMICAS - SABORYTEC
// ============================================================

function cargarVista(vista) {
    // 1. Verificación de Seguridad: Si no hay token, no cargamos nada
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    fetch(vista)
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar la vista solicitada");
            return response.text();
        })
        .then(html => {
            const container = document.getElementById('contenido');
            if (!container) return;

            // 2. Inyectamos el HTML
            container.innerHTML = html;

            // 3. Ejecutamos scripts de forma limpia
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                
                // Copiamos todos los atributos (src, type, etc.)
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });

                newScript.textContent = oldScript.textContent;

                // 4. Lo añadimos y lo borramos inmediatamente del DOM 
                // para que no se acumulen cientos de etiquetas <script> en el body
                document.body.appendChild(newScript);
                document.body.removeChild(newScript); 
            });

            console.log(`Vista [${vista}] cargada correctamente.`);
        })
        .catch(error => {
            console.error('Error al cargar la vista:', error);
            const container = document.getElementById('contenido');
            if(container) container.innerHTML = "<p>Error al cargar el contenido.</p>";
        });
}

// Hacerlo global
window.cargarVista = cargarVista;