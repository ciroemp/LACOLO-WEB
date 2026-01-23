function enviarAWhatsApp(event) {
    event.preventDefault(); // Evita que la página se recargue

    // 1. Recolectar datos de los campos
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const servicio = document.getElementById('servicio').options[document.getElementById('servicio').selectedIndex].text;
    const mensaje = document.getElementById('mensaje').value;
    
    // 2. Tu número de teléfono (formato internacional sin el +)
    const telefono = "50377471010"; 

    // 3. Crear el cuerpo del mensaje
    const mensajeFinal = `Hola! Mi nombre es ${nombre}.%0A` +
                         `*Correo:* ${email}%0A` +
                         `*Servicio de interés:* ${servicio}%0A` +
                         `*Proyecto:* ${mensaje}`;

    // 4. Construir la URL de WhatsApp
    const url = `https://wa.me/${telefono}?text=${mensajeFinal}`;

    // 5. Abrir en una nueva ventana
    window.open(url, '_blank');
}