document.addEventListener('DOMContentLoaded', () => {
    // Select the expiration date input field
    const fechaVencimientoInput = document.querySelector('input[name="fv"]');

    if (fechaVencimientoInput) {
        fechaVencimientoInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
            let formattedValue = '';

            if (value.length > 2) {
                // Insert slash after the month (first 2 digits)
                formattedValue = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                formattedValue = value;
            }

            // Limit the length to 5 characters (MM/YY)
            e.target.value = formattedValue.substring(0, 5);
        });
    }
});
