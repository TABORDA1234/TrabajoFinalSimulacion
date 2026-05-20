document.addEventListener('DOMContentLoaded', () => {
    // ── CONFIGURACIÓN Y ESTADO DEL SIMULADOR ──
    let appData = null;
    let transProbs = {}; // Matriz de probabilidades de transición
    let stateNames = {}; // Códigos de estado a nombres legibles
    
    // Estadísticas acumuladas en vivo
    let simCount = 0;
    let successCount = 0;
    let abandonCount = 0;
    let totalStepsCount = 0;
    
    // Acumulador de frecuencias por estado final
    let finalStateFrequencies = {};

    // Elementos del DOM
    const canvas = document.getElementById('flow-canvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('flow-tooltip');
    
    // KPIs
    const valSims = document.getElementById('live-val-sims');
    const valSuccess = document.getElementById('live-val-success');
    const valAbandon = document.getElementById('live-val-abandon');
    const valSteps = document.getElementById('live-val-steps');
    
    // Paneles en vivo
    const liveChips = document.getElementById('live-chips');
    const liveFinalBadge = document.getElementById('live-final-badge');
    const livePathSteps = document.getElementById('live-path-steps');
    const liveSimNum = document.getElementById('live-sim-num');
    const liveResList = document.getElementById('live-res-list');
    const liveLogScroll = document.getElementById('live-log-scroll');
    
    // Controles
    const btnGo     = document.getElementById('live-btn-go');
    const btnBatch  = document.getElementById('live-btn-batch');
    const btnReset  = document.getElementById('live-btn-reset');
    const simStatus = document.getElementById('live-sim-status');

    // Custom speed dropdown
    let currentDelay = 250; // ms por paso (default 1x)
    const speedDropdown     = document.getElementById('speed-dropdown');
    const speedDropdownBtn  = document.getElementById('speed-dropdown-btn');
    const speedDropdownMenu = document.getElementById('speed-dropdown-menu');
    const speedCurrentLabel = document.getElementById('speed-current-label');

    // Abrir/cerrar el dropdown
    speedDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedDropdown.classList.toggle('open');
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', () => speedDropdown.classList.remove('open'));

    // Seleccionar opción
    speedDropdownMenu.querySelectorAll('.speed-option').forEach(opt => {
        opt.addEventListener('click', () => {
            currentDelay = parseInt(opt.dataset.value);
            speedCurrentLabel.textContent = opt.textContent.trim();
            speedDropdownMenu.querySelectorAll('.speed-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            speedDropdown.classList.remove('open');
        });
    });

    // ── GEOMETRÍA DE NODOS EN CANVAS ──
    const LW = 700, LH = 600; // Dimensiones lógicas de referencia
    let scale = 1;

    const NODES = {
        S1:  {x: 350, y: 45,  r: 20, col: '#f0b040', cat: 'inicio'},
        S2:  {x: 100, y: 120, r: 14, col: '#ff9944', cat: 'edifica'},
        S11: {x: 270, y: 120, r: 14, col: '#00c8ff', cat: 'inst'},
        S8:  {x: 450, y: 120, r: 14, col: '#a855f7', cat: 'contacto'},
        S23: {x: 610, y: 120, r: 14, col: '#00e87a', cat: 'aula'},
        S3:  {x: 60,  y: 205, r: 12, col: '#ff9944', cat: 'edifica'},
        S12: {x: 155, y: 205, r: 12, col: '#ff9944', cat: 'edifica'},
        S18: {x: 240, y: 205, r: 12, col: '#00c8ff', cat: 'inst'},
        S21: {x: 315, y: 205, r: 12, col: '#00c8ff', cat: 'inst'},
        S22: {x: 390, y: 205, r: 12, col: '#00c8ff', cat: 'inst'},
        S13: {x: 470, y: 205, r: 12, col: '#a855f7', cat: 'contacto'},
        S28: {x: 555, y: 205, r: 12, col: '#00e87a', cat: 'aula'},
        S24: {x: 635, y: 205, r: 12, col: '#00e87a', cat: 'aula'},
        S4:  {x: 60,  y: 290, r: 12, col: '#ff9944', cat: 'edifica'},
        S19: {x: 145, y: 290, r: 11, col: '#00c8ff', cat: 'inst'},
        S20: {x: 225, y: 290, r: 11, col: '#00c8ff', cat: 'inst'},
        S29: {x: 310, y: 290, r: 11, col: '#00c8ff', cat: 'inst'},
        S31: {x: 390, y: 290, r: 11, col: '#00c8ff', cat: 'inst'},
        S14: {x: 470, y: 290, r: 12, col: '#a855f7', cat: 'contacto'},
        S25: {x: 560, y: 290, r: 12, col: '#00e87a', cat: 'aula'},
        S5:  {x: 60,  y: 375, r: 12, col: '#ff9944', cat: 'edifica'},
        S32: {x: 155, y: 375, r: 11, col: '#00c8ff', cat: 'inst'},
        S33: {x: 240, y: 375, r: 11, col: '#00c8ff', cat: 'inst'},
        S30: {x: 325, y: 375, r: 11, col: '#00e87a', cat: 'aula'},
        S15: {x: 470, y: 375, r: 12, col: '#a855f7', cat: 'contacto'},
        S6:  {x: 30,  y: 460, r: 13, col: '#ff4d6a', cat: 'error'},
        S7:  {x: 110, y: 460, r: 15, col: '#00e87a', cat: 'exito'},
        S9:  {x: 390, y: 460, r: 13, col: '#ff4d6a', cat: 'error'},
        S10: {x: 490, y: 460, r: 15, col: '#00e87a', cat: 'exito'},
        S16: {x: 390, y: 545, r: 13, col: '#ff4d6a', cat: 'error'},
        S17: {x: 490, y: 545, r: 15, col: '#00e87a', cat: 'exito'},
        S26: {x: 570, y: 460, r: 13, col: '#ff4d6a', cat: 'error'},
        S27: {x: 655, y: 460, r: 15, col: '#00e87a', cat: 'exito'},
        S34: {x: 240, y: 490, r: 17, col: '#ffb340', cat: 'salida'}
    };

    const CAT_LABELS = {
        inicio: 'Inicio',
        edifica: 'Edifica',
        contacto: 'Contacto',
        inst: 'Institucional',
        aula: 'Tu Aula',
        exito: 'Éxito',
        error: 'Error',
        salida: 'Abandono'
    };

    const FINALES = ['S6', 'S7', 'S9', 'S10', 'S16', 'S17', 'S26', 'S27', 'S34'];

    // Variables de render dinámico para animación
    let activeNode = null;
    let activeEdge = null;
    let visitedNodes = new Set();
    let visitedEdges = new Set();

    // ── BOOTSTRAP: CARGAR DATOS E INICIALIZAR ──
    function init() {
        // Consultamos los datos generales de estados y transiciones en Flask
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                appData = data;
                
                // Mapear nombres
                data.estados.forEach(e => {
                    stateNames[e.code] = e.name;
                });
                
                // Construir transiciones
                // matriz_prob es un diccionario de columnas (Destino) conteniendo diccionarios de filas (Origen)
                // transProbs[Origen][Destino] = prob
                data.estados.forEach(orig => {
                    const rowCode = orig.code;
                    transProbs[rowCode] = {};
                    data.estados.forEach(dest => {
                        const colCode = dest.code;
                        const prob = data.matriz_prob[colCode] ? (data.matriz_prob[colCode][rowCode] || 0) : 0;
                        if (prob > 0) {
                            transProbs[rowCode][colCode] = prob;
                        }
                    });
                });
                
                // Escuchar resize de pantalla
                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();
                
                // Inicializar paneles de control vacíos
                resetSimulators();
            })
            .catch(err => {
                console.error("Error al inicializar simulador de flujo:", err);
                simStatus.innerHTML = '<span style="color:var(--danger)">Error al inicializar los datos del modelo</span>';
            });
            
        // Registrar listeners de controles
        btnGo.addEventListener('click', runOneSimulation);
        btnBatch.addEventListener('click', runBatchSimulations);
        btnReset.addEventListener('click', resetSimulators);
    }

    // ── RENDER CANVAS Y REDES DE FLUJO ──
    function resizeCanvas() {
        const wrap = canvas.parentElement;
        const W = wrap.clientWidth;
        const H = wrap.clientHeight || 480;
        
        canvas.width = W;
        canvas.height = H;
        
        // Ajustamos la escala basándonos en las proporciones lógicas
        scale = Math.min(W / LW, H / LH) * 0.95;
        
        drawNetwork();
    }

    // Traducir coordenadas lógicas a píxeles físicos
    function tx(code) { return canvas.width / 2 + (NODES[code].x - LW / 2) * scale; }
    function ty(code) { return 20 + NODES[code].y * scale; }
    function tr(code) { return NODES[code].r * scale; }

    function hexToRgb(hex) {
        let c = hex.replace('#', '');
        let r = parseInt(c.substring(0, 2), 16);
        let g = parseInt(c.substring(2, 4), 16);
        let b = parseInt(c.substring(4, 6), 16);
        return `${r},${g},${b}`;
    }

    function drawNetwork() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Dibujar aristas
        Object.keys(transProbs).forEach(from => {
            if (!NODES[from]) return;
            Object.keys(transProbs[from]).forEach(to => {
                if (!NODES[to] || from === to) return;

                const key = `${from}>${to}`;
                const isActive = activeEdge === key;
                const isVisited = visitedEdges.has(key);

                const x1 = tx(from), y1 = ty(from);
                const x2 = tx(to),   y2 = ty(to);

                const dx = x2 - x1, dy = y2 - y1;
                const len = Math.sqrt(dx*dx + dy*dy) || 1;
                const ox = -dy / len * 2.5, oy = dx / len * 2.5;

                ctx.beginPath();
                ctx.moveTo(x1 + ox, y1 + oy);
                const cx = x1 + dx * 0.3 + ox * 3;
                const cy = y1 + dy * 0.3 + oy * 3;
                ctx.quadraticCurveTo(cx, cy, x2 + ox, y2 + oy);

                if (isActive) {
                    ctx.strokeStyle = 'rgba(79, 142, 255, 1)';
                    ctx.lineWidth = 2.5 * scale;
                    ctx.setLineDash([]);
                    ctx.shadowColor = 'rgba(79, 142, 255, 0.7)';
                    ctx.shadowBlur = 10;
                } else if (isVisited) {
                    ctx.strokeStyle = 'rgba(79, 142, 255, 0.55)';
                    ctx.lineWidth = 2 * scale;
                    ctx.setLineDash([]);
                    ctx.shadowColor = 'rgba(79, 142, 255, 0.25)';
                    ctx.shadowBlur = 5;
                } else {
                    const prob = transProbs[from][to] || 0;
                    // Líneas inactivas visibles: azul-gris tenue pero apreciable sobre fondo negro
                    const opacity = 0.18 + prob * 0.38; // mínimo 0.18, máximo ~0.56 para prob alta
                    ctx.strokeStyle = `rgba(120, 150, 220, ${opacity})`;
                    ctx.lineWidth = (0.8 + prob * 0.8) * scale; // más gruesa si es más probable
                    ctx.setLineDash([4, 5]);
                    ctx.shadowBlur = 0;
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.shadowBlur = 0;

                // Flecha
                if (isActive || isVisited) {
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const ar = tr(to) + 5;
                    const ax = x2 + ox - Math.cos(angle) * ar;
                    const ay = y2 + oy - Math.sin(angle) * ar;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(ax - 7 * scale * Math.cos(angle - 0.35), ay - 7 * scale * Math.sin(angle - 0.35));
                    ctx.lineTo(ax - 7 * scale * Math.cos(angle + 0.35), ay - 7 * scale * Math.sin(angle + 0.35));
                    ctx.closePath();
                    ctx.fillStyle = isActive ? 'rgba(79, 142, 255, 1)' : 'rgba(79, 142, 255, 0.5)';
                    ctx.shadowColor = isActive ? 'rgba(79, 142, 255, 0.8)' : 'transparent';
                    ctx.shadowBlur = isActive ? 8 : 0;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
        });

        // 2. Dibujar nodos
        Object.keys(NODES).forEach(id => {
            const n = NODES[id];
            const x = tx(id), y = ty(id), r = tr(id);
            const rgb = hexToRgb(n.col);
            const isActive  = activeNode === id;
            const isVisited = visitedNodes.has(id) && !isActive;

            // Halo de brillo exterior grande
            const haloR = isActive ? r * 3.5 : (isVisited ? r * 2.2 : r * 1.6);
            const haloAlpha = isActive ? 0.35 : (isVisited ? 0.15 : 0.06);
            const gHalo = ctx.createRadialGradient(x, y, 0, x, y, haloR);
            gHalo.addColorStop(0, `rgba(${rgb}, ${haloAlpha})`);
            gHalo.addColorStop(1, `rgba(${rgb}, 0)`);
            ctx.beginPath();
            ctx.arc(x, y, haloR, 0, Math.PI * 2);
            ctx.fillStyle = gHalo;
            ctx.fill();

            // Borde exterior del nodo
            ctx.beginPath();
            ctx.arc(x, y, r + 2 * scale, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${rgb}, ${isActive ? 0.9 : isVisited ? 0.6 : 0.2})`;
            ctx.lineWidth = (isActive ? 2 : 1) * scale;
            if (isActive) {
                ctx.shadowColor = n.col;
                ctx.shadowBlur = 18;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Relleno sólido del nodo
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            if (isActive) {
                const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, n.col);
                grad.addColorStop(1, n.col + 'bb');
                ctx.fillStyle = grad;
            } else if (isVisited) {
                ctx.fillStyle = `rgba(${rgb}, 0.3)`;
            } else {
                ctx.fillStyle = `rgba(${rgb}, 0.12)`;
            }
            ctx.fill();

            // Texto del nodo
            const fontSize = Math.round(Math.max(7.5, r * 0.72));
            ctx.font = `${isActive ? '800' : '700'} ${fontSize}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive ? '#fff' : (isVisited ? n.col : `rgba(${rgb}, 0.85)`);
            if (isActive) {
                ctx.shadowColor = 'rgba(0,0,0,0.6)';
                ctx.shadowBlur = 4;
            }
            ctx.fillText(id, x, y);
            ctx.shadowBlur = 0;
        });
    }

    // ── MOUSE MOUSEOVER E INTERACCIÓN TOOLTIP ──
    canvas.addEventListener('mousemove', e => {
        if (!appData) return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        let hitNode = null;
        
        Object.keys(NODES).forEach(id => {
            const dx = mx - tx(id);
            const dy = my - ty(id);
            if (Math.sqrt(dx*dx + dy*dy) <= tr(id) + 4) {
                hitNode = id;
            }
        });
        
        if (hitNode) {
            const n = NODES[hitNode];
            const name = stateNames[hitNode] || hitNode;
            
            // Frecuencias para llegadas en simulaciones en vivo
            const arrivals = finalStateFrequencies[hitNode] || 0;
            const pct = simCount > 0 ? (arrivals / simCount * 100).toFixed(1) : '0.0';
            
            tooltip.innerHTML = `
                <b>${hitNode}: ${name}</b>
                <div class="flow-tooltip-cat">${CAT_LABELS[n.cat]}</div>
                <div class="flow-tooltip-stat" style="color:${n.col}">
                    ${arrivals} arribos acumulados (${pct}%)
                </div>
            `;
            
            // Ubicación del tooltip
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const ttW = 200, ttH = 75;
            let lx = e.clientX + 15;
            let ly = e.clientY - 15;
            
            if (lx + ttW > vw) lx = e.clientX - ttW - 5;
            if (ly + ttH > vh) ly = e.clientY - ttH - 5;
            
            tooltip.style.left = `${lx}px`;
            tooltip.style.top = `${ly}px`;
            tooltip.style.display = 'block';
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.style.display = 'none';
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

    // ── ALGORITMO Y LÓGICA DE SIMULACIÓN DE MARKOV ──
    
    // Generar un recorrido completo basado en la matriz de probabilidades
    function generatePath() {
        const path = ['S1'];
        let current = 'S1';
        
        for (let i = 0; i < 25; i++) {
            if (FINALES.includes(current)) break;
            
            const transitions = transProbs[current];
            if (!transitions || Object.keys(transitions).length === 0) break;
            
            const next = chooseNextState(transitions);
            if (!next) break;
            
            path.push(next);
            current = next;
        }
        
        return path;
    }

    // Ruleta ponderada para elegir el siguiente estado
    function chooseNextState(transitions) {
        const states = Object.keys(transitions);
        const probs = Object.values(transitions);
        
        const r = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < states.length; i++) {
            cumulative += probs[i];
            if (r <= cumulative) {
                return states[i];
            }
        }
        return states[states.length - 1]; // Salvaguarda
    }

    // ── ANIMACIÓN PASO A PASO ──
    function animatePath(path, onFinish) {
        // Reiniciar variables de dibujo de ruta
        visitedNodes.clear();
        visitedEdges.clear();
        activeNode = null;
        activeEdge = null;
        
        // Limpiar contenedor de chips de vista previa
        liveChips.innerHTML = '';
        liveFinalBadge.innerHTML = '';
        livePathSteps.textContent = '–';
        
        const delay = currentDelay;
        
        path.forEach((state, idx) => {
            setTimeout(() => {
                // Actualizar sets del dibujo
                if (idx > 0) {
                    visitedNodes.add(path[idx - 1]);
                    visitedEdges.add(`${path[idx - 1]}>${state}`);
                }
                activeNode = state;
                activeEdge = idx > 0 ? `${path[idx - 1]}>${state}` : null;
                
                // Redibujar Canvas
                drawNetwork();
                
                // Insertar chip visual de estado
                if (idx > 0) {
                    const arrow = document.createElement('span');
                    arrow.className = 'live-chip-arrow';
                    arrow.textContent = '›';
                    liveChips.appendChild(arrow);
                }
                
                const chip = document.createElement('span');
                chip.className = 'live-chip';
                const nodeInfo = NODES[state];
                if (nodeInfo) {
                    chip.style.background = `${nodeInfo.col}10`;
                    chip.style.color = nodeInfo.col;
                    chip.style.borderColor = `${nodeInfo.col}30`;
                    chip.textContent = state;
                    chip.title = stateNames[state] || state;
                } else {
                    chip.textContent = state;
                }
                
                liveChips.appendChild(chip);
                liveChips.scrollTop = liveChips.scrollHeight; // Auto-scroll
                
                livePathSteps.textContent = idx + 1;
                
                // Al finalizar
                if (idx === path.length - 1) {
                    const isSuccess = ['S7', 'S10', 'S17', 'S27'].includes(state);
                    const isError = ['S6', 'S9', 'S16', 'S26'].includes(state);
                    
                    let badgeClass = 'badge-abandono';
                    let label = stateNames[state] || state;
                    
                    if (isSuccess) {
                        badgeClass = 'badge-exito';
                    } else if (isError) {
                        badgeClass = 'badge-error';
                    } else if (state === 'S34') {
                        badgeClass = 'badge-abandono';
                    }
                    
                    liveFinalBadge.innerHTML = `<span class="badge ${badgeClass}">${state} - ${label}</span>`;
                    
                    if (onFinish) onFinish(path, state);
                }
                
            }, idx * delay);
        });
    }

    // ── ACCIÓN: EJECUTAR 1 SIMULACIÓN INDIVIDUAL ──
    function runOneSimulation() {
        simCount++;
        disableControls(true);
        
        liveSimNum.textContent = simCount;
        valSims.textContent = simCount;
        simStatus.innerHTML = `Estado: <b>Simulando usuario #${simCount} paso a paso...</b>`;
        
        const path = generatePath();
        animatePath(path, (fullPath, finalState) => {
            // Registrar resultados
            recordSimulationMetrics(fullPath, finalState);
            
            // Habilitar controles
            disableControls(false);
            simStatus.innerHTML = `Estado: <b>Sim #${simCount} completada. Destino: ${stateNames[finalState] || finalState} (${fullPath.length} pasos)</b>`;
            
            // Registrar en el log scroll
            addLogToScroll(simCount, fullPath, finalState);
        });
    }

    // ── ACCIÓN: CORRER 10 SIMULACIONES RÁPIDAS EN LOTE ──
    function runBatchSimulations() {
        disableControls(true);
        let batchIdx = 0;
        const delay = currentDelay;
        
        function nextBatch() {
            if (batchIdx >= 10) {
                disableControls(false);
                simStatus.innerHTML = `Estado: <b>Lote de 10 simulaciones finalizado en simulación #${simCount}</b>`;
                return;
            }
            
            batchIdx++;
            simCount++;
            liveSimNum.textContent = simCount;
            valSims.textContent = simCount;
            
            const path = generatePath();
            const finalState = path[path.length - 1];
            
            // Dibujar la ruta final de manera estática y ultra-rápida sin timers largos
            visitedNodes = new Set(path);
            activeNode = finalState;
            activeEdge = null;
            visitedEdges.clear();
            for (let i = 0; i < path.length - 1; i++) {
                visitedEdges.add(`${path[i]}>${path[i+1]}`);
            }
            drawNetwork();
            
            // Rellenar chips al instante
            liveChips.innerHTML = '';
            path.forEach((state, idx) => {
                if (idx > 0) {
                    const arrow = document.createElement('span');
                    arrow.className = 'live-chip-arrow';
                    arrow.textContent = '›';
                    liveChips.appendChild(arrow);
                }
                const chip = document.createElement('span');
                chip.className = 'live-chip';
                const nodeInfo = NODES[state];
                if (nodeInfo) {
                    chip.style.background = `${nodeInfo.col}10`;
                    chip.style.color = nodeInfo.col;
                    chip.style.borderColor = `${nodeInfo.col}30`;
                    chip.textContent = state;
                }
                liveChips.appendChild(chip);
            });
            
            // Colocar insignia final
            const isSuccess = ['S7', 'S10', 'S17', 'S27'].includes(finalState);
            const isError = ['S6', 'S9', 'S16', 'S26'].includes(finalState);
            let badgeClass = 'badge-abandono';
            if (isSuccess) badgeClass = 'badge-exito';
            else if (isError) badgeClass = 'badge-error';
            liveFinalBadge.innerHTML = `<span class="badge ${badgeClass}">${finalState} - ${stateNames[finalState] || finalState}</span>`;
            
            livePathSteps.textContent = path.length;
            
            // Guardar métricas y loggear
            recordSimulationMetrics(path, finalState);
            addLogToScroll(simCount, path, finalState);
            
            simStatus.innerHTML = `Estado: <b>Lote: ${batchIdx}/10 corriendo · Sim #${simCount}</b>`;
            
            setTimeout(nextBatch, Math.max(80, delay / 2.5));
        }
        
        nextBatch();
    }

    // Guardar métricas y actualizar KPIs
    function recordSimulationMetrics(path, finalState) {
        // 1. Acumular conteos en vivo
        totalStepsCount += path.length;
        
        const isSuccess = ['S7', 'S10', 'S17', 'S27'].includes(finalState);
        const isAbandon = finalState === 'S34';
        
        if (isSuccess) successCount++;
        if (isAbandon) abandonCount++;
        
        finalStateFrequencies[finalState] = (finalStateFrequencies[finalState] || 0) + 1;
        
        // 2. Actualizar KPIs del header
        valSuccess.textContent = `${(successCount / simCount * 100).toFixed(1)}%`;
        valAbandon.textContent = `${(abandonCount / simCount * 100).toFixed(1)}%`;
        valSteps.textContent = (totalStepsCount / simCount).toFixed(1);
        
        // 3. Actualizar la barra de resultados de frecuencias
        updateResultsFrequenciesList();
    }

    // Agregar un fila en la tarjeta de bitácora del historial
    function addLogToScroll(id, path, finalState) {
        const isSuccess = ['S7', 'S10', 'S17', 'S27'].includes(finalState);
        const isError = ['S6', 'S9', 'S16', 'S26'].includes(finalState);
        const col = isSuccess ? '#27ae60' : (isError ? '#e74c3c' : '#7f8c8d');
        
        const row = document.createElement('div');
        row.className = 'live-log-row';
        row.innerHTML = `
            <span class="live-log-id" style="color:${col}">#${id}</span>
            <span class="live-log-path" title="${path.join(' → ')}">${path.join('→')}</span>
            <span class="live-log-steps" style="color:${col}">${path.length}p</span>
        `;
        
        liveLogScroll.insertBefore(row, liveLogScroll.firstChild);
        
        // Mantener tope máximo de 15 registros para evitar sobrecarga del DOM
        if (liveLogScroll.children.length > 15) {
            liveLogScroll.removeChild(liveLogScroll.lastChild);
        }
    }

    // Dibujar las barras de progreso del acumulador de resultados finales
    function updateResultsFrequenciesList() {
        // Ordenar estados finales por frecuencia acumulada
        const sorted = Object.keys(finalStateFrequencies).sort((a, b) => {
            return finalStateFrequencies[b] - finalStateFrequencies[a];
        }).slice(0, 6);
        
        const maxFrequency = finalStateFrequencies[sorted[0]] || 1;
        
        liveResList.innerHTML = sorted.map(st => {
            const count = finalStateFrequencies[st];
            const pct = (count / simCount * 100).toFixed(1);
            
            const isSuccess = ['S7', 'S10', 'S17', 'S27'].includes(st);
            const isError = ['S6', 'S9', 'S16', 'S26'].includes(st);
            const col = isSuccess ? '#27ae60' : (isError ? '#e74c3c' : '#7f8c8d');
            
            const fillWidth = (count / maxFrequency * 100).toFixed(0);
            
            return `
                <div class="sim-res-row">
                    <span class="sim-res-name" style="color:${col}" title="${st}: ${stateNames[st] || st}">
                        ${st} · ${stateNames[st] || st}
                    </span>
                    <div class="sim-res-track">
                        <div class="sim-res-fill" style="width:${fillWidth}%; background:${col}"></div>
                    </div>
                    <span class="sim-res-pct" style="color:${col}">${pct}%</span>
                </div>
            `;
        }).join('');
    }

    // ── ACCIÓN: REINICIAR TODO ──
    function resetSimulators() {
        simCount = 0;
        successCount = 0;
        abandonCount = 0;
        totalStepsCount = 0;
        finalStateFrequencies = {};
        
        // Reiniciar variables visuales
        visitedNodes.clear();
        visitedEdges.clear();
        activeNode = null;
        activeEdge = null;
        
        // Redibujar
        drawNetwork();
        
        // Reset KPIs en vivo
        valSims.textContent = '0';
        valSuccess.textContent = '0.0%';
        valAbandon.textContent = '0.0%';
        valSteps.textContent = '0.0';
        
        // Limpiar paneles
        liveChips.innerHTML = '<span style="font-size:11px;color:var(--text-secondary)">Pulsa "Simular usuario" para iniciar</span>';
        liveFinalBadge.innerHTML = '';
        livePathSteps.textContent = '–';
        liveSimNum.textContent = '–';
        liveResList.innerHTML = '<span style="font-size:11px;color:var(--text-secondary)">Simulaciones vacías</span>';
        liveLogScroll.innerHTML = '<span style="font-size:11px;color:var(--text-secondary)">Historial vacío</span>';
        
        disableControls(false);
        simStatus.innerHTML = 'Estado: <b>Listo — Datos del modelo Markov cargados</b>';
    }

    // ── UTILIDADES DE INTERFAZ ──
    function disableControls(state) {
        btnGo.disabled     = state;
        btnBatch.disabled  = state;
        btnReset.disabled  = state;
        speedDropdownBtn.disabled = state;
        if (state) {
            speedDropdown.classList.remove('open');
        }
    }

    // Inicializar al cargar el DOM
    init();
});
