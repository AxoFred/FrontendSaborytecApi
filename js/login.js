// ============================================================
// LOGIN SABORYTEC - VERSIÓN COMPATIBLE CON INICIO.JS
// ============================================================

const form = document.getElementById("loginForm");
//const API_LOGIN = "https://saborytecapi-production.up.railway.app/api/login"; 
const API_LOGIN = "http://saborytecapi.test/api/login"; 

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    // Limpiamos todo para empezar una sesión limpia
    localStorage.clear(); 

    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;

    if (!correo || !password) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    try {
        const response = await fetch(API_LOGIN, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (data.success) {
            // Extraemos los datos del usuario (ya sea que vengan como user o usuario)
            const userData = data.user || data.usuario;

            if (!userData) {
                throw new Error("No se encontraron los datos del usuario en la respuesta");
            }

            // --- CORRECCIÓN PARA QUE INICIO.JS NO TE SAQUE ---
            // Guardamos el token con el nombre exacto que busca el resto de la app
            localStorage.setItem("auth_token", data.token); 
            
            // Guardamos el nombre para el saludo "Hola, [Nombre]"
            localStorage.setItem("user_name", userData.nombre);

            // Guardamos el objeto completo y el ID_rol por seguridad
            localStorage.setItem("usuario", JSON.stringify(userData));

            const rol = Number(userData.ID_rol);
            
            console.log("Login exitoso. Token guardado como 'auth_token'. Rol:", rol);

            // Redirección según rol
            switch (rol) {
                case 1: // Administrador
                    window.location.href = "../views/administrador.html"; 
                    break;
                case 2: // Vendedor
                    window.location.href = "../views/vendedor.html";
                    break;
                case 3: // Cliente (Estudiantes/Docentes)
                    window.location.href = "../views/inicio.html";
                    break;
                default:
                    window.location.href = "../index.html";
                    break;
            }

        } else {
            alert(data.message || "Credenciales incorrectas.");
        }

    } catch (error) {
        console.error("Error en login:", error);
        alert("Error de conexión: " + error.message);
    }
});