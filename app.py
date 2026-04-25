import gradio as gr
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from scipy import stats
import datetime

# --- STATISTICAL ENGINE ---
def run_ks_test(baseline, production):
    statistic, p_value = stats.ks_2samp(baseline, production)
    # Threshold logic based on sample size (alpha=0.05)
    n1, n2 = len(baseline), len(production)
    critical_value = 1.36 * np.sqrt((n1 + n2) / (n1 * n2))
    drift_detected = statistic > critical_value
    return {
        "statistic": statistic,
        "critical_value": critical_value,
        "drift_detected": drift_detected,
        "p_value": p_value
    }

def generate_data(scenario='baseline'):
    np.random.seed(42)
    baseline = np.random.normal(50000, 10000, 1000)
    if scenario == 'Trigger Market Shift':
        # Simulate recession shift: lower mean, higher variance
        production = np.random.normal(42000, 15000, 500)
    else:
        production = np.random.normal(50100, 10200, 500)
    return baseline, production

# --- UI LOGIC ---
def monitor_cycle(scenario_type):
    baseline, production = generate_data(scenario_type)
    results = run_ks_test(baseline, production)
    
    # 1. Distribution Plot
    fig = go.Figure()
    fig.add_trace(go.Histogram(x=baseline, name='Baseline', opacity=0.6, marker_color='#4facfe', nbinsx=40))
    fig.add_trace(go.Histogram(x=production, name='Production', opacity=0.6, marker_color='#f093fb', nbinsx=40))
    fig.update_layout(
        barmode='overlay', 
        paper_bgcolor='rgba(0,0,0,0)', 
        plot_bgcolor='rgba(0,0,0,0)',
        font_color="#94a3b8",
        margin=dict(l=0, r=0, t=30, b=0),
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )

    # 2. Status Formatting
    status_icon = "🚨 DRIFT DETECTED" if results['drift_detected'] else "✅ SYSTEM HEALTHY"
    status_color = "#ef4444" if results['drift_detected'] else "#10b981"
    
    # 3. KPI Simulation
    acc = 98.2 if not results['drift_detected'] else 84.5 + np.random.random()
    f1 = 97.5 if not results['drift_detected'] else 81.2 + np.random.random()
    
    return (
        fig, 
        f"{results['statistic']:.3f}", 
        f"<div style='color: {status_color}; font-weight: 800; font-size: 1.5rem;'>{status_icon}</div>",
        f"{acc:.1f}%",
        f"{f1:.1f}%"
    )

# --- GRADIO INTERFACE ---
with gr.Blocks(theme=gr.themes.Soft(), css="""
    .gradio-container { background: #0f172a; color: white; }
    .glass-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }
    h1 { color: #4facfe; font-weight: 800 !important; }
    .stat-label { color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #f8fafc; }
""") as demo:
    
    with gr.Row():
        gr.HTML("""
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 2rem;">🛡️</span>
                <h1>Guardian <span style="color: #f8fafc;">AI</span> | Drift Monitor</h1>
            </div>
        """)
        timestamp = gr.Label(value=f"Last Check: {datetime.datetime.now().strftime('%H:%M:%S')}", show_label=False)

    with gr.Row():
        with gr.Column(scale=1):
            scenario = gr.Radio(["Reset Baseline", "Trigger Market Shift"], value="Reset Baseline", label="Simulation Controls")
            run_btn = gr.Button("⚡ Run Analysis", variant="primary")
            
            with gr.Group(elem_classes="glass-card"):
                gr.HTML("<p class='stat-label'>Drift Score (KS)</p>")
                drift_val = gr.HTML("<div class='stat-value'>0.020</div>")
                status_html = gr.HTML("<div style='color: #10b981; font-weight: 800;'>✅ SYSTEM HEALTHY</div>")

        with gr.Column(scale=3):
            with gr.Group(elem_classes="glass-card"):
                plot = gr.Plot(label="Feature Distribution Shift")
            
            with gr.Row():
                with gr.Group(elem_classes="glass-card"):
                    gr.HTML("<p class='stat-label'>Model Accuracy</p>")
                    acc_val = gr.HTML("<div class='stat-value'>98.2%</div>")
                with gr.Group(elem_classes="glass-card"):
                    gr.HTML("<p class='stat-label'>F1 Score</p>")
                    f1_val = gr.HTML("<div class='stat-value'>97.5%</div>")

    run_btn.click(monitor_cycle, inputs=[scenario], outputs=[plot, drift_val, status_html, acc_val, f1_val])
    demo.load(monitor_cycle, inputs=[scenario], outputs=[plot, drift_val, status_html, acc_val, f1_val])

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
