window.addEventListener('scroll', function() {
    const nav = document.querySelector('#mainNav');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

$(document).ready(function() {
    $('#contactForm').on('submit', function(e) {
        e.preventDefault(); // Evita que la página se recargue

        let form = $(this);
        let btn = $('#btnSubmit');
        let responseDiv = $('#responseMessage');

        btn.prop('disabled', true).text('Enviando...');

        $.ajax({
            url: "https://formspree.io/f/tu_id_aca", // Tu endpoint de servicio de correo
            method: "POST",
            data: form.serialize(),
            dataType: "json",
            success: function() {
                responseDiv.fadeIn().text("¡Gracias! Tu mensaje ha sido enviado.").css("color", "green");
                form.trigger("reset");
            },
            error: function() {
                responseDiv.fadeIn().text("Hubo un error. Inténtalo de nuevo.").css("color", "red");
            },
            complete: function() {
                btn.prop('disabled', false).text('Enviar Mensaje');
            }
        });
    });
});