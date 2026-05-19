document.addEventListener('DOMContentLoaded', () => {
    // State
    let appData = null;
    let resultChart = null;

    // Elements
    const statesTableBody = document.querySelector('#states-table tbody');
    const pathsContainer = document.getElementById('paths-container');
    const matCountsTable = document.getElementById('table-mat-counts');
    const matProbTable = document.getElementById('table-mat-prob');
    
    // Fetch initial data
    fetch('/api/data')
        .then(res => res.json())
        .then(data => {
            appData = data;
            renderStates(data.estados);
            renderPaths(data.recorridos);
            renderMatrix(data.matriz_conteos, matCountsTable, data.estados, false);
            renderMatrix(data.matriz_prob, matProbTable, data.estados, true);
        });

    // Tab switching for matrices
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // Run Simulation
    document.getElementById('btn-simulate').addEventListener('click', () => {
        const numUsers = parseInt(document.getElementById('num-users').value) || 1000;
        const maxSteps = parseInt(document.getElementById('max-steps').value) || 20;

        const btn = document.getElementById('btn-simulate');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Simulando...</span>';
        btn.disabled = true;

        fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num_users: numUsers, max_steps: maxSteps })
        })
        .then(res => res.json())
        .then(results => {
            document.getElementById('results-section').classList.remove('hidden');
            renderResults(results);
            renderChart(results.metrics);
            
            // Re-render count matrix with actual simulated users' data
            if (results.empirical_counts && appData) {
                renderMatrix(results.empirical_counts, matCountsTable, appData.estados, false);
                // Also update the title of the tab to indicate it's simulated data
                document.querySelector('.tab-btn[data-target="mat-counts"]').innerText = `Matriz de Conteos (${numUsers} Simulados)`;
            }
            
            // Update paths section with all simulated paths grouped by frequency
            if (results.simulated_paths) {
                renderSimulatedPaths(results.simulated_paths);
                document.querySelector('#paths-section h2').innerText = `Recorridos Simulados (${results.simulated_paths.length} únicos)`;
            }
            
            // smooth scroll to results
            document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    });

    function renderStates(estados) {
        statesTableBody.innerHTML = estados.map(s => `
            <tr>
                <td><strong>${s.code}</strong></td>
                <td>${s.name}</td>
                <td>${s.desc}</td>
                <td><span class="badge ${getBadgeClass(s.type)}">${s.type}</span></td>
            </tr>
        `).join('');
    }

    function renderPaths(paths) {
        pathsContainer.innerHTML = paths.map(path => `
            <div class="path-item">
                ${path.map((node, i) => `
                    <span class="path-node" title="${getStateName(node)}">${node}</span>
                    ${i < path.length - 1 ? '<span class="path-arrow">→</span>' : ''}
                `).join('')}
            </div>
        `).join('');
    }
    
    function renderSimulatedPaths(pathsWithCount) {
        pathsContainer.innerHTML = pathsWithCount.map(item => `
            <div class="path-item">
                <div class="path-count-badge">${item.count}x</div>
                <div class="path-nodes">
                    ${item.path.map((node, i) => `
                        <span class="path-node" title="${getStateName(node)}">${node}</span>
                        ${i < item.path.length - 1 ? '<span class="path-arrow">→</span>' : ''}
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    function renderMatrix(matrix, container, estados, isProb) {
        const codes = estados.map(e => e.code);
        
        // Header
        let html = `<thead><tr><th>Estado</th>${codes.map(c => `<th title="${getStateName(c)}">${c}</th>`).join('')}</tr></thead><tbody>`;
        
        // Rows
        for (const row of codes) {
            html += `<tr><th>${row}</th>`;
            for (const col of codes) {
                const val = matrix[col] ? (matrix[col][row] || 0) : 0;
                let displayVal = isProb ? val.toFixed(2) : val;
                
                // Color intensity based on value
                let bg = 'transparent';
                if (val > 0) {
                    const intensity = isProb ? val * 0.5 : Math.min(val / 10, 0.5);
                    bg = `rgba(59, 130, 246, ${intensity})`;
                }
                
                html += `<td style="background-color: ${bg}">${displayVal == 0 ? '-' : displayVal}</td>`;
            }
            html += `</tr>`;
        }
        html += '</tbody>';
        container.innerHTML = html;
    }

    function renderResults(results) {
        const m = results.metrics;
        document.getElementById('val-success').innerText = m.success_rate.toFixed(1) + '%';
        document.getElementById('val-abandon').innerText = m.abandon_rate.toFixed(1) + '%';
        document.getElementById('val-error').innerText = m.error_rate.toFixed(1) + '%';
        document.getElementById('val-pending').innerText = m.pending_rate.toFixed(1) + '%';
        document.getElementById('val-steps').innerText = m.avg_steps;

        // Preview table
        document.querySelector('#preview-table tbody').innerHTML = results.preview.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${u.path.join(' → ')}">
                    ${u.path.join(' → ')}
                </td>
                <td><strong>${u.final_state}</strong> - ${getStateName(u.final_state)}</td>
                <td><span class="badge ${getBadgeClass(u.final_type)}">${u.final_type}</span></td>
            </tr>
        `).join('');

        // Critical State Insights
        document.getElementById('cs-code').innerText = results.critical_state.code;
        document.getElementById('cs-name').innerText = results.critical_state.name;
        document.getElementById('cs-prob').innerText = results.critical_state.risk_prob + '%';
        document.getElementById('cs-suggestion').innerText = results.suggestion;
    }

    function renderChart(metrics) {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        
        if (resultChart) {
            resultChart.destroy();
        }

        resultChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Éxito', 'Abandono', 'Error', 'Seguimiento'],
                datasets: [{
                    label: 'Porcentaje de Usuarios (%)',
                    data: [metrics.success_rate, metrics.abandon_rate, metrics.error_rate, metrics.pending_rate],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)', // Success (verde)
                        'rgba(255, 193, 7, 0.8)',  // Abandon (warning)
                        'rgba(231, 76, 60, 0.8)',  // Error (rojo)
                        'rgba(52, 152, 219, 0.8)'   // Pending (azul)
                    ],
                    borderWidth: 0,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    // Utils
    function getBadgeClass(type) {
        if (!type) return '';
        const t = type.toLowerCase();
        if (t.includes('inicial')) return 'badge-inicial';
        if (t.includes('intermedio')) return 'badge-intermedio';
        if (t.includes('exitoso')) return 'badge-exito';
        if (t.includes('error')) return 'badge-error';
        if (t.includes('negativo') || t.includes('abandono')) return 'badge-abandono';
        if (t.includes('seguimiento')) return 'badge-seguimiento';
        return '';
    }

    function getStateName(code) {
        if (!appData) return code;
        const st = appData.estados.find(s => s.code === code);
        return st ? st.name : code;
    }
});
