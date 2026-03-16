// ============================================================
// CONFIGURACIÓN DE LOGIN
// ============================================================

const form = document.getElementById("loginForm");
const API_LOGIN = "http://127.0.0.1:8000/api/login";

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    // 1. Limpieza previa: Borrar datos de sesiones anteriores para evitar conflictos
    localStorage.removeItem("usuario");

    // 2. Captura de valores
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;

    // Validación básica antes de enviar
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
            body: JSON.stringify({
                correo: correo,
                password: password
            })
        });

        const data = await response.json();

        console.log("Respuesta API:", data);

        if (data.success) {
            // 3. GUARDADO: Guardamos el objeto usuario completo como string
            // Esto incluye ID_usuario, ID_rol, nombre, etc.
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            // 4. DIRECCIONAMIENTO SEGÚN ROL
            // Usamos Number() para asegurar que la comparación sea numérica
            const rol = Number(data.usuario.ID_rol);

            switch (rol) {
                case 1: // Administrador
                    window.location.href = "administrador.html";
                    break;
                case 2: // Vendedor
                    window.location.href = "vendedor.html";
                    break;
                default: // Cliente u otros
                    window.location.href = "inicio.html";
                    break;
            }

        } else {
            // 5. Manejo de error de credenciales
            alert(data.message || "Correo o contraseña incorrectos.");
        }

    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("Hubo un problema al conectar con el servidor. Verifica que la API esté encendida.");
    }
});