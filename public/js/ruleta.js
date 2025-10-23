document.addEventListener('DOMContentLoaded', () => {
    // Conectar con el servidor de Socket.IO
    const socket = io();

    // Elementos del DOM
    const ruletaGiratoria = document.getElementById('ruleta-giratoria');
    const numerosApostables = document.querySelectorAll('.numero-apuesta');
    const apuestasExternas = document.querySelectorAll('.apuesta-externa');
    const inputApuesta = document.getElementById('monto-apuesta');
    const btnGirar = document.getElementById('btn-girar');
    const saldoDisplay = document.getElementById('saldo-actual');
    const mensajeDisplay = document.getElementById('mensaje-juego');
    const divGanadores = document.getElementById('lista-ganadores-horizontal'); // Contenedor horizontal
    const tablaApuestasBody = document.getElementById('tabla-apuestas-body');
    const initialDataElement = document.getElementById('initial-data'); // Elemento script

    // Verificar si initialDataElement existe antes de intentar parsear
    let initialData = { historialGanadores: [], historialApuestas: [], usertag: 'jugador' };
    if (initialDataElement) {
        try {
            initialData = JSON.parse(initialDataElement.textContent);
        } catch (e) {
            console.error("Error parsing initial data:", e);
            // Mantener valores por defecto si hay error
        }
    } else {
        console.warn("Elemento #initial-data no encontrado. Usando valores por defecto para historial.");
    }


    // Datos del juego
    let saldo = 0;
    // Intentar obtener el saldo inicial de forma segura
    if (saldoDisplay) {
        saldo = parseInt(saldoDisplay.textContent.replace(/\./g, '').replace(' fichas', ''), 10) || 0;
    } else {
        console.error("Elemento #saldo-actual no encontrado.");
    }

    let apuestaActual = { tipo: null, valor: null, monto: 0 };
    let historialGanadores = initialData.historialGanadores || [];
    let historialApuestas = initialData.historialApuestas || [];
    const usertag = initialData.usertag || 'jugador';

    const numerosRuleta = [ { num: 0, color: 'verde' }, { num: 32, color: 'rojo' }, { num: 15, color: 'negro' }, { num: 19, color: 'rojo' }, { num: 4, color: 'negro' }, { num: 21, color: 'rojo' }, { num: 2, color: 'negro' }, { num: 25, color: 'rojo' }, { num: 17, color: 'negro' }, { num: 34, color: 'rojo' }, { num: 6, color: 'negro' }, { num: 27, color: 'rojo' }, { num: 13, color: 'negro' }, { num: 36, color: 'rojo' }, { num: 11, color: 'negro' }, { num: 30, color: 'rojo' }, { num: 8, color: 'negro' }, { num: 23, color: 'rojo' }, { num: 10, color: 'negro' }, { num: 5, color: 'rojo' }, { num: 24, color: 'negro' }, { num: 16, color: 'rojo' }, { num: 33, color: 'negro' }, { num: 1, color: 'rojo' }, { num: 20, color: 'negro' }, { num: 14, color: 'rojo' }, { num: 31, color: 'negro' }, { num: 9, color: 'rojo' }, { num: 22, color: 'negro' }, { num: 18, color: 'rojo' }, { num: 29, color: 'negro' }, { num: 7, color: 'rojo' }, { num: 28, color: 'negro' }, { num: 12, color: 'rojo' }, { num: 35, color: 'negro' }, { num: 3, color: 'rojo' }, { num: 26, color: 'negro' } ];
    let anguloActual = 0; // Para el giro correcto

    function dibujarRuleta() {
        if (!ruletaGiratoria) return; // Salir si el elemento no existe
        ruletaGiratoria.innerHTML = ''; // Limpiar por si acaso
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
        if (!divGanadores) return; // Salir si el elemento no existe
        divGanadores.innerHTML = '';
        historialGanadores.forEach(numero => {
            const span = document.createElement('span');
            span.classList.add(numero.color);
            span.textContent = numero.num;
            divGanadores.appendChild(span);
        });
    }

    function renderizarApuestas() {
        if (!tablaApuestasBody) return; // Salir si el elemento no existe
        tablaApuestasBody.innerHTML = '';
        historialApuestas.forEach(apuesta => {
            const tr = document.createElement('tr');
            const variacionClass = apuesta.variacion > 0 ? 'ganancia' : 'perdida';
            const signo = apuesta.variacion > 0 ? '+' : '';
            tr.innerHTML = `<td>${apuesta.usuario}</td><td>${apuesta.tipo}</td><td>${apuesta.monto.toLocaleString('es-CL')}</td><td>${apuesta.resultado}</td><td class="${variacionClass}">${signo}${apuesta.variacion.toLocaleString('es-CL')}</td>`;
            tablaApuestasBody.appendChild(tr);
        });
    }

    function actualizarSaldoEnPantalla() {
        if (!saldoDisplay) return; // Salir si el elemento no existe
        saldoDisplay.textContent = `${saldo.toLocaleString('es-CL')} fichas`;
    }

    function quitarSeleccion() {
        document.querySelectorAll('.seleccionado').forEach(el => el.classList.remove('seleccionado'));
    }

    if (numerosApostables) {
        numerosApostables.forEach(el => {
            el.addEventListener('click', () => {
                if (!btnGirar || btnGirar.disabled) return;
                quitarSeleccion();
                el.classList.add('seleccionado');
                apuestaActual.tipo = 'pleno';
                apuestaActual.valor = parseInt(el.dataset.numero, 10);
                if (mensajeDisplay) mensajeDisplay.textContent = `Apostando al número ${apuestaActual.valor}. Ingresa un monto.`;
            });
        });
    }

    if (apuestasExternas) {
        apuestasExternas.forEach(el => {
            el.addEventListener('click', () => {
                if (!btnGirar || btnGirar.disabled) return;
                quitarSeleccion();
                el.classList.add('seleccionado');

                const [tipo, valor] = el.dataset.bet.split('-');
                apuestaActual.tipo = tipo;
                apuestaActual.valor = valor;

                let textoApuesta = valor.toUpperCase();
                if (tipo === 'docena') textoApuesta = `Docena ${valor}`;
                if (tipo === 'columna') textoApuesta = `Columna ${valor}`;
                if (tipo === 'mitad') textoApuesta = valor === 'falta' ? '1-18' : '19-36';

                if (mensajeDisplay) mensajeDisplay.textContent = `Apostando a ${textoApuesta}. Ingresa un monto.`;
            });
        });
    }

    if (btnGirar) {
        btnGirar.addEventListener('click', () => {
            if (!inputApuesta) return;
            const monto = parseInt(inputApuesta.value, 10);
            if (apuestaActual.tipo === null || isNaN(monto) || monto <= 0 || monto > saldo) {
                if (mensajeDisplay) mensajeDisplay.textContent = 'Apuesta inválida. Selecciona una opción y un monto correcto.';
                return;
            }

            saldo -= monto;
            apuestaActual.monto = monto;
            actualizarSaldoEnPantalla();

            btnGirar.disabled = true;
            inputApuesta.disabled = true;
            if (mensajeDisplay) mensajeDisplay.textContent = `¡Apostaste ${apuestaActual.monto.toLocaleString('es-CL')}! Girando...`;

            if (ruletaGiratoria) {
                ruletaGiratoria.style.transition = 'none';
                ruletaGiratoria.style.transform = `rotate(${anguloActual % 360}deg)`;

                setTimeout(() => {
                    const indiceGanador = Math.floor(Math.random() * numerosRuleta.length);
                    const numeroGanador = numerosRuleta[indiceGanador];
                    const num = numeroGanador.num;
                    const anguloPorDivision = 360 / numerosRuleta.length;
                    const targetAngle = 360 - (indiceGanador * anguloPorDivision) - (anguloPorDivision / 2);
                    const vueltasCompletas = 5;
                    const anguloFinal = anguloActual + (360 * vueltasCompletas) + targetAngle - (anguloActual % 360);

                    ruletaGiratoria.style.transition = 'transform 6s cubic-bezier(0.1, 0.5, 0.2, 1)';
                    ruletaGiratoria.style.transform = `rotate(${anguloFinal}deg)`;
                    anguloActual = anguloFinal;

                    setTimeout(() => {
                        historialGanadores.unshift(numeroGanador);
                        if (historialGanadores.length > 5) historialGanadores.pop();

                        let ganancia = 0;
                        let resultadoApuesta = 'Perdida';
                        let tipoDeApuestaTexto = '';

                        switch (apuestaActual.tipo) {
                            case 'pleno':
                                tipoDeApuestaTexto = `Pleno ${apuestaActual.valor}`;
                                if (num === apuestaActual.valor) ganancia = apuestaActual.monto * 36;
                                break;
                            case 'color':
                                tipoDeApuestaTexto = `Color ${apuestaActual.valor}`;
                                if (num !== 0 && numeroGanador.color === apuestaActual.valor) ganancia = apuestaActual.monto * 2;
                                break;
                            case 'paridad':
                                tipoDeApuestaTexto = apuestaActual.valor === 'par' ? 'Par' : 'Impar';
                                if (num !== 0 && ((num % 2 === 0 && apuestaActual.valor === 'par') || (num % 2 !== 0 && apuestaActual.valor === 'impar'))) {
                                    ganancia = apuestaActual.monto * 2;
                                }
                                break;
                            case 'mitad':
                                tipoDeApuestaTexto = apuestaActual.valor === 'falta' ? '1-18 (Falta)' : '19-36 (Pasa)';
                                if (num >= 1 && num <= 18 && apuestaActual.valor === 'falta') ganancia = apuestaActual.monto * 2;
                                if (num >= 19 && num <= 36 && apuestaActual.valor === 'pasa') ganancia = apuestaActual.monto * 2;
                                break;
                            case 'docena':
                                tipoDeApuestaTexto = `Docena ${apuestaActual.valor}`;
                                if (num >= 1 && num <= 12 && apuestaActual.valor === '1') ganancia = apuestaActual.monto * 3;
                                if (num >= 13 && num <= 24 && apuestaActual.valor === '2') ganancia = apuestaActual.monto * 3;
                                if (num >= 25 && num <= 36 && apuestaActual.valor === '3') ganancia = apuestaActual.monto * 3;
                                break;
                            case 'columna':
                                tipoDeApuestaTexto = `Columna ${apuestaActual.valor}`;
                                const col1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
                                const col2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
                                const col3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
                                if (col1.includes(num) && apuestaActual.valor === '1') ganancia = apuestaActual.monto * 3;
                                if (col2.includes(num) && apuestaActual.valor === '2') ganancia = apuestaActual.monto * 3;
                                if (col3.includes(num) && apuestaActual.valor === '3') ganancia = apuestaActual.monto * 3;
                                break;
                        }

                        if (ganancia > 0) resultadoApuesta = 'Ganada';
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

                        socket.emit('nueva-jugada', {
                            saldo: saldo,
                            usertag: usertag,
                            historialGanadores: historialGanadores,
                            historialApuestas: historialApuestas
                        });

                        if (mensajeDisplay) {
                           if (resultadoApuesta === 'Ganada') {
                                mensajeDisplay.textContent = `¡Salió el ${numeroGanador.num}! Ganaste ${(ganancia - apuestaActual.monto).toLocaleString('es-CL')} fichas.`;
                            } else {
                                mensajeDisplay.textContent = `Salió el ${numeroGanador.num}. Mejor suerte la próxima vez.`;
                            }
                        }

                        actualizarSaldoEnPantalla();
                        btnGirar.disabled = false;
                        inputApuesta.disabled = false;
                        inputApuesta.value = '';
                        quitarSeleccion();
                        apuestaActual = { tipo: null, valor: null, monto: 0 };
                    }, 6100);
                }, 20);
            } else {
                 console.error("Elemento #ruleta-giratoria no encontrado al intentar girar.");
                 // Resetear estado si falla el giro
                 saldo += apuestaActual.monto; // Devolver apuesta
                 actualizarSaldoEnPantalla();
                 btnGirar.disabled = false;
                 inputApuesta.disabled = false;
                 if (mensajeDisplay) mensajeDisplay.textContent = "Error al iniciar el giro. Intenta de nuevo.";
            }
        });
    }


    socket.on('actualizar-historial', (data) => {
        console.log("Recibido historial actualizado del servidor.");
        historialGanadores = data.historialGanadores || [];
        historialApuestas = data.historialApuestas || [];

        renderizarGanadores();
        renderizarApuestas();
    });

    // Iniciar
    dibujarRuleta();
    actualizarSaldoEnPantalla();
    renderizarGanadores();
    renderizarApuestas();
});