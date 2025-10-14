document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const ruletaGiratoria = document.getElementById('ruleta-giratoria');
    const numerosApostables = document.querySelectorAll('.numero-apuesta');
    const apuestasExternas = document.querySelectorAll('.apuesta-externa');
    const inputApuesta = document.getElementById('monto-apuesta');
    const btnGirar = document.getElementById('btn-girar');
    const saldoDisplay = document.getElementById('saldo-actual');
    const mensajeDisplay = document.getElementById('mensaje-juego');
    const listaGanadores = document.getElementById('lista-ganadores');
    const tablaApuestasBody = document.getElementById('tabla-apuestas-body');
    const initialData = JSON.parse(document.getElementById('initial-data').textContent);

    // Datos del juego
    let saldo = parseInt(saldoDisplay.textContent.replace(/\./g, '').replace(' fichas', ''), 10) || 0;
    let apuestaActual = { tipo: null, valor: null, monto: 0 }; 
    let historialGanadores = initialData.historialGanadores || [];
    let historialApuestas = initialData.historialApuestas || [];
    const usertag = initialData.usertag || 'jugador';
    
    const numerosRuleta = [ { num: 0, color: 'verde' }, { num: 32, color: 'rojo' }, { num: 15, color: 'negro' }, { num: 19, color: 'rojo' }, { num: 4, color: 'negro' }, { num: 21, color: 'rojo' }, { num: 2, color: 'negro' }, { num: 25, color: 'rojo' }, { num: 17, color: 'negro' }, { num: 34, color: 'rojo' }, { num: 6, color: 'negro' }, { num: 27, color: 'rojo' }, { num: 13, color: 'negro' }, { num: 36, color: 'rojo' }, { num: 11, color: 'negro' }, { num: 30, color: 'rojo' }, { num: 8, color: 'negro' }, { num: 23, color: 'rojo' }, { num: 10, color: 'negro' }, { num: 5, color: 'rojo' }, { num: 24, color: 'negro' }, { num: 16, color: 'rojo' }, { num: 33, color: 'negro' }, { num: 1, color: 'rojo' }, { num: 20, color: 'negro' }, { num: 14, color: 'rojo' }, { num: 31, color: 'negro' }, { num: 9, color: 'rojo' }, { num: 22, color: 'negro' }, { num: 18, color: 'rojo' }, { num: 29, color: 'negro' }, { num: 7, color: 'rojo' }, { num: 28, color: 'negro' }, { num: 12, color: 'rojo' }, { num: 35, color: 'negro' }, { num: 3, color: 'rojo' }, { num: 26, color: 'negro' } ];

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

    function renderizarGanadores() {
        listaGanadores.innerHTML = '';
        historialGanadores.forEach(numero => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="${numero.color}">${numero.num}</span>`;
            listaGanadores.appendChild(li);
        });
    }

    function renderizarApuestas() {
        tablaApuestasBody.innerHTML = '';
        historialApuestas.forEach(apuesta => {
            const tr = document.createElement('tr');
            const variacionClass = apuesta.variacion > 0 ? 'ganancia' : 'perdida';
            const signo = apuesta.variacion > 0 ? '+' : '';

            tr.innerHTML = `
                <td>${apuesta.usuario}</td>
                <td>${apuesta.tipo}</td>
                <td>${apuesta.monto.toLocaleString('es-CL')}</td>
                <td>${apuesta.resultado}</td>
                <td class="${variacionClass}">${signo}${apuesta.variacion.toLocaleString('es-CL')}</td>
            `;
            tablaApuestasBody.appendChild(tr);
        });
    }

    async function guardarDatosDeJuego() {
        try {
            await fetch('/actualizar-juego', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    saldo: saldo,
                    historialGanadores: historialGanadores,
                    historialApuestas: historialApuestas
                })
            });
            console.log("Datos del juego guardados en el servidor.");
        } catch (error) {
            console.error('Error de conexión al guardar los datos del juego:', error);
        }
    }
    
    function actualizarSaldoEnPantalla() {
        saldoDisplay.textContent = `${saldo.toLocaleString('es-CL')} fichas`;
    }

    function quitarSeleccion() {
        const seleccionados = document.querySelectorAll('.seleccionado');
        seleccionados.forEach(el => el.classList.remove('seleccionado'));
    }

    numerosApostables.forEach(numeroEl => {
        numeroEl.addEventListener('click', () => {
            if (btnGirar.disabled) return;
            quitarSeleccion();
            numeroEl.classList.add('seleccionado');
            apuestaActual.tipo = 'pleno';
            apuestaActual.valor = parseInt(numeroEl.dataset.numero, 10);
            mensajeDisplay.textContent = `Apostando al número ${apuestaActual.valor}. Ingresa un monto.`;
        });
    });

    apuestasExternas.forEach(apuestaEl => {
        apuestaEl.addEventListener('click', () => {
            if (btnGirar.disabled) return;
            quitarSeleccion();
            apuestaEl.classList.add('seleccionado');
            apuestaActual.tipo = 'color';
            apuestaActual.valor = apuestaEl.dataset.bet;
            mensajeDisplay.textContent = `Apostando al color ${apuestaActual.valor}. Ingresa un monto.`;
        });
    });

    btnGirar.addEventListener('click', () => {
        const monto = parseInt(inputApuesta.value, 10);
        if (apuestaActual.tipo === null || isNaN(monto) || monto <= 0 || monto > saldo) {
            mensajeDisplay.textContent = 'Apuesta inválida. Selecciona una opción y un monto correcto.';
            return;
        }

        saldo -= monto;
        apuestaActual.monto = monto;
        actualizarSaldoEnPantalla();
        
        btnGirar.disabled = true;
        inputApuesta.disabled = true;
        mensajeDisplay.textContent = `¡Apostaste ${apuestaActual.monto.toLocaleString('es-CL')} al ${apuestaActual.valor}! Girando...`;

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
            historialGanadores.unshift(numeroGanador);
            if (historialGanadores.length > 5) historialGanadores.pop();

            let ganancia = 0;
            let resultadoApuesta = 'Perdida';
            let tipoDeApuestaTexto = '';

            if (apuestaActual.tipo === 'pleno' && numeroGanador.num === apuestaActual.valor) {
                ganancia = apuestaActual.monto * 36;
                resultadoApuesta = 'Ganada';
                tipoDeApuestaTexto = `Pleno ${apuestaActual.valor}`;
            } else if (apuestaActual.tipo === 'color' && numeroGanador.color === apuestaActual.valor) {
                ganancia = apuestaActual.monto * 2;
                resultadoApuesta = 'Ganada';
                tipoDeApuestaTexto = `Color ${apuestaActual.valor}`;
            } else {
                tipoDeApuestaTexto = apuestaActual.tipo === 'pleno' ? `Pleno ${apuestaActual.valor}` : `Color ${apuestaActual.valor}`;
            }

            saldo += ganancia;

            const apuestaInfo = {
                usuario: usertag,
                tipo: tipoDeApuestaTexto,
                monto: apuestaActual.monto,
                resultado: resultadoApuesta,
                variacion: ganancia > 0 ? (ganancia - apuestaActual.monto) : -apuestaActual.monto
            };
            historialApuestas.unshift(apuestaInfo);
            if (historialApuestas.length > 5) historialApuestas.pop();
            
            guardarDatosDeJuego();
            renderizarGanadores();
            renderizarApuestas();
            
            if (resultadoApuesta === 'Ganada') {
                mensajeDisplay.textContent = `¡Salió el ${numeroGanador.num}! Ganaste ${(ganancia - apuestaActual.monto).toLocaleString('es-CL')} fichas.`;
            } else {
                mensajeDisplay.textContent = `Salió el ${numeroGanador.num}. Mejor suerte la próxima vez.`;
            }

            actualizarSaldoEnPantalla();
            btnGirar.disabled = false;
            inputApuesta.disabled = false;
            inputApuesta.value = '';
            quitarSeleccion();
            apuestaActual = { tipo: null, valor: null, monto: 0 };
        }, 6500);
    });

    dibujarRuleta();
    actualizarSaldoEnPantalla();
    renderizarGanadores();
    renderizarApuestas();
});