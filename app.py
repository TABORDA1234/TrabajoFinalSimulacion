import os
import random
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Definición de Estados según el notebook e inferencia del negocio
estados_info = [
    {"code": "S1", "name": "Inicio", "desc": "Landing Page de Colombia Comparte", "type": "Inicial"},
    {"code": "S2", "name": "Emprender (Edifica)", "desc": "Sección del programa Edifica para emprendedores", "type": "Intermedio"},
    {"code": "S3", "name": "Registro Emprendedor - Paso 1", "desc": "Inicio del formulario de registro", "type": "Intermedio"},
    {"code": "S4", "name": "Registro Emprendedor - Paso 2", "desc": "Ingreso de datos del emprendimiento", "type": "Intermedio"},
    {"code": "S5", "name": "Registro Emprendedor - Envío", "desc": "Confirmación y envío del formulario", "type": "Intermedio"},
    {"code": "S6", "name": "Error de Red en Registro", "desc": "Falla técnica al enviar formulario de registro", "type": "Error"},
    {"code": "S7", "name": "Registro Exitoso", "desc": "El emprendedor se registró exitosamente en Edifica", "type": "Final Exitoso"},
    {"code": "S8", "name": "Acompañamiento Empresarial", "desc": "Solicitud de acompañamiento para empresas", "type": "Intermedio"},
    {"code": "S9", "name": "Error Acompañamiento", "desc": "Falla al enviar correo de acompañamiento", "type": "Error"},
    {"code": "S10", "name": "Contacto Empresarial Exitoso", "desc": "Solicitud de acompañamiento enviada con éxito", "type": "Final Exitoso"},
    {"code": "S11", "name": "Quiénes Somos (Institucional)", "desc": "Lectura de misión, visión y equipo", "type": "Intermedio"},
    {"code": "S12", "name": "Programa Edifica (Información)", "desc": "Lectura de detalles sobre el programa Edifica", "type": "Intermedio"},
    {"code": "S13", "name": "Contacto General - Paso 1", "desc": "Ingreso a formulario de contacto general", "type": "Intermedio"},
    {"code": "S14", "name": "Contacto General - Paso 2", "desc": "Llenado de datos personales", "type": "Intermedio"},
    {"code": "S15", "name": "Contacto General - Envío", "desc": "Envío de formulario de contacto", "type": "Intermedio"},
    {"code": "S16", "name": "Error Contacto General", "desc": "Falla en envío del formulario de contacto general", "type": "Error"},
    {"code": "S17", "name": "Contacto Exitoso", "desc": "Formulario de contacto enviado correctamente", "type": "Final Exitoso"},
    {"code": "S18", "name": "Misión en Acción", "desc": "Ver impacto y obras de la fundación", "type": "Intermedio"},
    {"code": "S19", "name": "Testimonios", "desc": "Ver testimonios de beneficiarios", "type": "Intermedio"},
    {"code": "S20", "name": "Portafolio de Emprendedores", "desc": "Directorio de emprendimientos", "type": "Intermedio"},
    {"code": "S21", "name": "Noticias", "desc": "Novedades y actualidad de la fundación", "type": "Intermedio"},
    {"code": "S22", "name": "Top Speakers / Eventos", "desc": "Visualización de próximos eventos y oradores", "type": "Intermedio"},
    {"code": "S23", "name": "Login Tu Aula", "desc": "Ingreso de credenciales para el aula virtual", "type": "Intermedio"},
    {"code": "S24", "name": "Autenticando", "desc": "Validación de credenciales en curso", "type": "Intermedio"},
    {"code": "S25", "name": "Carga Aula Virtual", "desc": "Cargando componentes del aula", "type": "Intermedio"},
    {"code": "S26", "name": "Error Credenciales", "desc": "Falla al iniciar sesión por clave incorrecta", "type": "Error"},
    {"code": "S27", "name": "Acceso a Tu Aula Exitoso", "desc": "Ingreso correcto al panel del aula virtual", "type": "Final Exitoso"},
    {"code": "S28", "name": "Recuperación de Contraseña", "desc": "Proceso de recuperación de acceso", "type": "Seguimiento"},
    {"code": "S29", "name": "Mentores", "desc": "Conocer a los mentores del programa", "type": "Intermedio"},
    {"code": "S30", "name": "Biblioteca Tu Aula", "desc": "Acceso a recursos de estudio", "type": "Intermedio"},
    {"code": "S31", "name": "Políticas", "desc": "Términos y condiciones, políticas de privacidad", "type": "Intermedio"},
    {"code": "S32", "name": "Donaciones", "desc": "Portal de aportes económicos", "type": "Final Exitoso"},
    {"code": "S33", "name": "Portal Latam", "desc": "Redirección a sucursal regional", "type": "Final Exitoso"},
    {"code": "S34", "name": "Salida / Abandono", "desc": "El usuario sale del sitio sin completar un objetivo clave", "type": "Final Negativo"}
]

# Base Journeys (Recorridos)
recorridos_base = [
    ["S1", "S2", "S3", "S4", "S5", "S7"],
    ["S1", "S3", "S4", "S5", "S6"],
    ["S1", "S11", "S12", "S3", "S4", "S5", "S7"],
    ["S1", "S12", "S3", "S4", "S5", "S7"],
    ["S1", "S2", "S3", "S4", "S34"],
    ["S1", "S21", "S12", "S3", "S4", "S5", "S6"],
    ["S1", "S11", "S2", "S34"],
    ["S1", "S2", "S8", "S10"],
    ["S1", "S12", "S13", "S14", "S15", "S17"],
    ["S1", "S2", "S12", "S8", "S10"],
    ["S1", "S23", "S24", "S25", "S27"],
    ["S1", "S23", "S24", "S25", "S26"],
    ["S1", "S23", "S28", "S24", "S25", "S27"],
    ["S1", "S23", "S24", "S25", "S27", "S30", "S34"],
    ["S1", "S23", "S24", "S25", "S27", "S29", "S34"],
    ["S1", "S23", "S24", "S25", "S27", "S23", "S34"],
    ["S1", "S21", "S23", "S24", "S25", "S26"],
    ["S1", "S23", "S28", "S34"],
    ["S1", "S22", "S23", "S24", "S25", "S27"],
    ["S1", "S11", "S23", "S24", "S25", "S27"],
    ["S1", "S8", "S10"],
    ["S1", "S8", "S9"],
    ["S1", "S11", "S13", "S14", "S15", "S17"],
    ["S1", "S13", "S14", "S15", "S16"],
    ["S1", "S22", "S8", "S10"],
    ["S1", "S33", "S13", "S14", "S15", "S17"],
    ["S1", "S18", "S13", "S14", "S15", "S17"],
    ["S1", "S11", "S29", "S8", "S10"],
    ["S1", "S12", "S8", "S10"],
    ["S1", "S13", "S34"],
    ["S1", "S21", "S11", "S34"],
    ["S1", "S18", "S21", "S34"],
    ["S1", "S22", "S11", "S34"],
    ["S1", "S18", "S21", "S11", "S34"],
    ["S1", "S32", "S34"],
    ["S1", "S11", "S34"],
    ["S1", "S33", "S34"],
    ["S1", "S2", "S12", "S34"],
    ["S1", "S18", "S34"],
    ["S1", "S21", "S34"],
    ["S1", "S11", "S18", "S22", "S13", "S14", "S15", "S17"],
    ["S1", "S2", "S12", "S3", "S34"],
    ["S1", "S23", "S24", "S25", "S27", "S30", "S11", "S34"],
    ["S1", "S32", "S11", "S34"],
    ["S1", "S11", "S8", "S10"],
    ["S1", "S21", "S22", "S13", "S14", "S15", "S16"],
    ["S1", "S29", "S23", "S24", "S25", "S26"],
    ["S1", "S18", "S33", "S34"],
    ["S1", "S12", "S11", "S34"],
    ["S1", "S21", "S11", "S29", "S34"],
    ["S1", "S12", "S34"],
    ["S1", "S11", "S29", "S34"],
    ["S1", "S22", "S34"],
    ["S1", "S8", "S10"],
    ["S1", "S23", "S28", "S27"],
    ["S1", "S3", "S4", "S34"],
    ["S1", "S13", "S14", "S15", "S16"],
    ["S1", "S32", "S11", "S34"],
    ["S1", "S21", "S11", "S18", "S34"],
    ["S1", "S2", "S34"]
]

estados = [e["code"] for e in estados_info]

# Calculation of Matrixes
def calcular_matrices():
    matriz_conteos = pd.DataFrame(0, index=estados, columns=estados)
    for recorrido in recorridos_base:
        for i in range(len(recorrido) - 1):
            estado_actual = recorrido[i]
            estado_siguiente = recorrido[i + 1]
            matriz_conteos.loc[estado_actual, estado_siguiente] += 1
    
    matriz_prob = matriz_conteos.div(matriz_conteos.sum(axis=1), axis=0).fillna(0)
    return matriz_conteos, matriz_prob

matriz_conteos, matriz_prob = calcular_matrices()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({
        "estados": estados_info,
        "recorridos": recorridos_base,
        "matriz_conteos": matriz_conteos.to_dict(),
        "matriz_prob": matriz_prob.to_dict()
    })

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.json
    num_users = data.get('num_users', 100)
    max_steps = data.get('max_steps', 20)
    
    simulated_users = []
    path_counts = {}
    
    counts = {"exitoso": 0, "abandonos": 0, "errores": 0, "seguimiento": 0, "total_steps": 0}
    
    # Matriz empírica basada en la simulación
    empirical_counts = pd.DataFrame(0, index=estados, columns=estados)
    
    # Run simulation using markov chains
    for u in range(num_users):
        current_state = "S1"
        path = [current_state]
        
        for _ in range(max_steps - 1):
            # Check probabilities for next state
            probs = matriz_prob.loc[current_state]
            if probs.sum() == 0:
                break # Sink state
            
            # Select next state
            next_state = random.choices(estados, weights=probs.values)[0]
            path.append(next_state)
            
            # Contar la transición empírica
            empirical_counts.loc[current_state, next_state] += 1
            
            current_state = next_state
        
        final_state = path[-1]
        
        # Track path frequency
        path_tuple = tuple(path)
        path_counts[path_tuple] = path_counts.get(path_tuple, 0) + 1
        
        final_type = next((s["type"] for s in estados_info if s["code"] == final_state), "Desconocido")
        
        if final_type == "Final Exitoso":
            counts["exitoso"] += 1
        elif final_type == "Final Negativo":
            counts["abandonos"] += 1
        elif final_type == "Error":
            counts["errores"] += 1
        elif final_type == "Seguimiento":
            counts["seguimiento"] += 1
        else:
            # If intermedio, count as abandon since they didn't finish properly
            counts["abandonos"] += 1
            final_type = "Abandono (Inconcluso)"
            
        counts["total_steps"] += len(path)
        
        # save preview
        if len(simulated_users) < 10:
            simulated_users.append({
                "id": u + 1,
                "path": path,
                "final_state": final_state,
                "final_type": final_type
            })
            
    # Format and sort simulated paths
    sorted_paths = sorted(path_counts.items(), key=lambda x: x[1], reverse=True)
    all_simulated_paths = [{"path": list(k), "count": v} for k, v in sorted_paths[:1000]] # top 1000 to avoid crash
            
    # Compute metrics
    avg_steps = counts["total_steps"] / num_users
    
    # Calculate critical state (where most people transition to S34 or an error state)
    # We can inspect the probability matrix. State with highest prob to go to S34 or Error
    error_states = [s["code"] for s in estados_info if s["type"] == "Error" or s["code"] == "S34"]
    critical_prob = -1
    critical_state = None
    
    for s in estados:
        prob = sum(matriz_prob.loc[s, e] for e in error_states if e in matriz_prob.columns)
        # Avoid sink states with 0 sum overall
        if matriz_prob.loc[s].sum() > 0 and prob > critical_prob:
            critical_prob = prob
            critical_state = s
            
    critical_info = next((s for s in estados_info if s["code"] == critical_state), None)
    
    # Improve suggestions
    suggestion = "Revisar la interfaz de esta sección para hacer más claros los llamados a la acción (CTAs)."
    if critical_state in ["S23", "S24"]:
        suggestion = "El inicio de sesión tiene muchos errores. Sugerimos implementar login con Google/Microsoft para facilitar el acceso."
    elif critical_state in ["S3", "S4"]:
        suggestion = "El formulario de registro es largo. Divídelo en menos pasos o guarda el progreso automáticamente."
    elif critical_state in ["S11", "S12", "S21"]:
        suggestion = "Los usuarios leen información y se van. Agrega botones flotantes o pop-ups amigables ofreciendo acompañamiento o donación."
    elif critical_info and "Error" in critical_info["type"]:
        suggestion = "Se detectan errores técnicos. Revisar la conectividad del servidor o la validación del formulario."
        
    return jsonify({
        "metrics": {
            "success_rate": (counts["exitoso"] / num_users) * 100,
            "abandon_rate": (counts["abandonos"] / num_users) * 100,
            "error_rate": (counts["errores"] / num_users) * 100,
            "pending_rate": (counts["seguimiento"] / num_users) * 100,
            "avg_steps": round(avg_steps, 2)
        },
        "preview": simulated_users,
        "critical_state": {
            "code": critical_info["code"],
            "name": critical_info["name"],
            "risk_prob": round(critical_prob * 100, 2)
        },
        "suggestion": suggestion,
        "empirical_counts": empirical_counts.to_dict(),
        "simulated_paths": all_simulated_paths
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
