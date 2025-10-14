document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const ruletaGiratoria = document.getElementById('ruleta-giratoria');
    const numerosApostables = document.querySelectorAll('.numero-apuesta');
    const inputApuesta = document.getElementById('monto-apuesta');
    const btnGirar = document.getElementById('btn-girar');
    const saldoDisplay = document.getElementById('saldo-actual');
    const mensajeDisplay = document.getElementById('mensaje-juego');

    // Leer el saldo inicial desde el HTML
    let saldo = parseInt(saldoDisplay.textContent.replace(/\./g, ''), 10) || 0;
    
    let apuestaActual = { numero: null, monto: 0 };
    const numerosRuleta = [
        { num: 0, color: 'verde' }, { num: 32, color: 'rojo' }, { num: 15, color: 'negro' },
        { num: 19, color: 'rojo' }, { num: 4, color: 'negro' }, { num: 21, color: 'rojo' },
        { num: 2, color: 'negro' }, { num: 25, color: 'rojo' }, { num: 17, color: 'negro' },
        { num: 34, color: 'rojo' }, { num: 6, color: 'negro' }, { num: 27, color: 'rojo' },
        { num: 13, color: 'negro' }, { num: 36, color: 'rojo' }, { num: 11, color: 'negro' },
        { num: 30, color: 'rojo' }, { num: 8, color: 'negro' }, { num: 23, color: 'rojo' },
        { num: 10, color: 'negro' }, { num: 5, color: 'rojo' }, { num: 24, color: 'negro' },
        { num: 16, color: 'rojo' }, { num: 33, color: 'negro' }, { num: 1, color: 'rojo' },
        { num: 20, color: 'negro' }, { num: 14, color: 'rojo' }, { num: 31, color: 'negro' },
        { num: 9, color: 'rojo' }, { num: 22, color: 'negro' }, { num: 18, color: 'rojo' },
        { num: 29, color: 'negro' }, { num: 7, color: 'rojo' }, { num: 28, color: 'negro' },
        { num: 12, color: 'rojo' }, { num: 35, color: 'negro' }, { num: 3, color: 'rojo' },
        { num: 26, color: 'negro' }
    ];

    function dibujarRuleta() {
        const anguloPorDivision = 360 / numerosRuleta.length;
        const centro = 100;
        const radio = 80;

        numerosRuleta.forEach((n, i) => {
            const anguloInicio = i * anguloPorDivision;
            const anguloFin = (i + 1) * anguloPorDivision;
            const anguloInicioRad = (anguloInicio - 90) * Math.PI / 180;
            const anguloFinRad = (anguloFin - 90) * Math.PI / 180;
            const x1 = centro + 90 * Math.cos(anguloInicioRad);
            const y1 = centro + 90 * Math.sin(anguloInicioRad);
            const x2 = centro + 90 * Math.cos(anguloFinRad);
            const y2 = centro + 90 * Math.sin(anguloFinRad);
            const pathData = `M ${centro},${centro} L ${x1},${y1} A 90,90 0 0,1 ${x2},${y2} Z`;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.classList.add(n.color === 'rojo' ? 'division-roja' : n.color === 'negro' ? 'division-negra' : 'division-verde');
            ruletaGiratoria.appendChild(path);

            const anguloTextoRad = (anguloInicio + anguloPorDivision / 2 - 90) * Math.PI / 180;
            const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
            texto.setAttribute("x", centro + radio * Math.cos(anguloTextoRad));
            texto.setAttribute("y", centro + radio * Math.sin(anguloTextoRad));
            texto.textContent = n.num;
            texto.classList.add("numero-ruleta");
            texto.setAttribute("transform", `rotate(${anguloInicio + anguloPorDivision / 2}, ${texto.getAttribute('x')}, ${texto.getAttribute('y')})`);
            ruletaGiratoria.appendChild(texto);
        });
    }

    async function guardarSaldoEnServidor(nuevoSaldo) {
        try {
            await fetch('/actualizar-saldo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saldo: nuevoSaldo })
            });
        } catch (error) {
            console.error('Error de conexión al guardar el saldo:', error);
        }
    }
    
    function actualizarSaldoEnPantalla() {
        saldoDisplay.textContent = `${saldo.toLocaleString('es-CL')} fichas`;
    }

    numerosApostables.forEach(numeroEl => {
        numeroEl.addEventListener('click', () => {
            if (btnGirar.disabled) return;
            const seleccionadoAnterior = document.querySelector('.numero-apuesta.seleccionado');
            if (seleccionadoAnterior) seleccionadoAnterior.classList.remove('seleccionado');
            numeroEl.classList.add('seleccionado');
            apuestaActual.numero = parseInt(numeroEl.dataset.numero, 10);
            mensajeDisplay.textContent = `Apostando al número ${apuestaActual.numero}. Ingresa un monto.`;
        });
    });

    btnGirar.addEventListener('click', () => {
        const monto = parseInt(inputApuesta.value, 10);
        if (apuestaActual.numero === null || isNaN(monto) || monto <= 0 || monto > saldo) {
            mensajeDisplay.textContent = 'Apuesta inválida. Selecciona un número y un monto menor o igual a tu saldo.';
            return;
        }

        saldo -= monto;
        apuestaActual.monto = monto;
        actualizarSaldoEnPantalla();
        guardarSaldoEnServidor(saldo);
        
        btnGirar.disabled = true;
        inputApuesta.disabled = true;
        mensajeDisplay.textContent = `¡Apostaste ${monto} al ${apuestaActual.numero}! Girando...`;

        ruletaGiratoria.style.transition = 'none';
        ruletaGiratoria.style.transform = 'rotate(0deg)';
        ruletaGiratoria.offsetHeight; 

        const indiceGanador = Math.floor(Math.random() * numerosRuleta.length);
        const numeroGanador = numerosRuleta[indiceGanador];
        const anguloPorDivision = 360 / numerosRuleta.length;
        const targetAngle = 360 - (indiceGanador * anguloPorDivision) - (anguloPorDivision / 2);
        const vueltasCompletas = 5;
        const anguloFinal = (360 * vueltasCompletas) + targetAngle;

        ruletaGiratoria.style.transition = 'transform 6s cubic-bezier(0.1, 0.5, 0.2, 1)';
        ruletaGiratoria.style.transform = `rotate(${anguloFinal}deg)`;

        setTimeout(() => {
            mensajeDisplay.textContent = `El número ganador es ${numeroGanador.num} (${numeroGanador.color}).`;

            if (numeroGanador.num === apuestaActual.numero) {
                const ganancia = apuestaActual.monto * 36;
                saldo += ganancia;
                mensajeDisplay.textContent += ` ¡Felicidades, ganaste ${ganancia.toLocaleString('es-CL')} fichas!`;
                guardarSaldoEnServidor(saldo);
            } else {
                mensajeDisplay.textContent += ' Mejor suerte la próxima vez.';
            }

            actualizarSaldoEnPantalla();
            btnGirar.disabled = false;
            inputApuesta.disabled = false;
            inputApuesta.value = '';
            const seleccionado = document.querySelector('.numero-apuesta.seleccionado');
            if(seleccionado) seleccionado.classList.remove('seleccionado');
            apuestaActual = { numero: null, monto: 0 };
        }, 6500);
    });

    dibujarRuleta();
    actualizarSaldoEnPantalla();
});