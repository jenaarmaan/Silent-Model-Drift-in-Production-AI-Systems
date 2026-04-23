import Chart from 'chart.js/auto';
import { DriftDetectionService } from './shared/drift-service.js';
import { DataService } from './services/data-service.js';

// --- INITIALIZATION ---

const dataService = new DataService();
let state = {
    baselineData: dataService.generateScenarioData(1000, 'baseline'),
    productionData: dataService.generateScenarioData(500, 'baseline'),
    charts: {
        dist: null,
        timeline: null
    }
};

/**
 * Main entry point
 */
async function init() {
    setupCharts();
    setupAlertSystem();
    attachEventListeners();
    await runMonitoringCycle();
    
    // Initial UI state
    updateTimestamp();
}

function setupAlertSystem() {
    dataService.setupSocketListeners((data) => {
        showToast(data.message, `Score: ${data.score.toFixed(3)} at ${new Date(data.timestamp).toLocaleTimeString()}`);
    });
}

function showToast(title, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<h4>${title}</h4><p>${message}</p>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function attachEventListeners() {
    const selector = document.getElementById('feature-selector');
    
    document.getElementById('trigger-drift').addEventListener('click', async () => {
        state.productionData = dataService.generateScenarioData(500, 'recession');
        await runMonitoringCycle();
        updateUIState('drifted');
    });

    document.getElementById('reset-baseline').addEventListener('click', async () => {
        state.productionData = dataService.generateScenarioData(500, 'baseline');
        await runMonitoringCycle();
        updateUIState('healthy');
    });

    selector.addEventListener('change', async (e) => {
        // In a real app, we would fetch specific baseline/production for this feature
        // For now, we update the UI labels
        const feature = e.target.value;
        const chartTitle = document.querySelector('.chart-header h3');
        chartTitle.innerText = `Distribution Shift (${feature.charAt(0).toUpperCase() + feature.slice(1)})`;
        await runMonitoringCycle();
    });
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('current-timestamp').innerText = `Last updated: ${now.toLocaleTimeString()}`;
}

/**
 * Core Monitoring Logic
 */
async function runMonitoringCycle() {
    try {
        const feature = document.getElementById('feature-selector').value;
        const baseline = state.baselineData[feature];
        const production = state.productionData[feature];

        const results = await dataService.runDriftDetection(baseline, production);
        
        updateDashboardUI(results);
        await updateCharts(results, feature);
        updateTimestamp();
    } catch (error) {
        console.error("Monitoring Cycle Failed:", error);
    }
}

/**
 * UI UPDATE LOGIC
 */

function updateDashboardUI(results) {
    const driftScore = results.statistic;
    
    // Update Circular Progress
    const circle = document.getElementById('drift-score-path');
    const scoreVal = document.getElementById('drift-score-value');
    const statusText = document.getElementById('drift-status');
    const systemStatus = document.getElementById('system-status');
    
    const dashArray = `${(driftScore * 100).toFixed(0)}, 100`;
    circle.setAttribute('stroke-dasharray', dashArray);
    
    // Threshold check (using critical value logic)
    const isDrifting = results.driftDetected;
    circle.style.stroke = isDrifting ? 'var(--danger)' : 'var(--success)';
    scoreVal.innerText = driftScore.toFixed(3);
    
    if (isDrifting) {
        statusText.innerText = "🚨 Drift Detected!";
        statusText.style.color = 'var(--danger)';
        systemStatus.innerHTML = '<span class="dot pulse red"></span> Warning';
    } else {
        statusText.innerText = "Healthy ✅";
        statusText.style.color = 'var(--success)';
        systemStatus.innerHTML = '<span class="dot pulse green"></span> Active';
    }

    // Update KPI metrics (simulated degradation based on drift)
    const baseAcc = isDrifting ? 85 : 97;
    const accuracy = baseAcc + (Math.random() * 3);
    const f1 = (baseAcc - 2) + (Math.random() * 3);
    
    updateProgressBar('accuracy-bar', 'accuracy-val', accuracy);
    updateProgressBar('f1-bar', 'f1-val', f1);
}

function updateProgressBar(barId, valId, value) {
    const bar = document.getElementById(barId);
    const valText = document.getElementById(valId);
    bar.style.width = `${value}%`;
    valText.innerText = `${value.toFixed(1)}%`;
    bar.style.backgroundColor = value < 90 ? 'var(--danger)' : 'var(--primary)';
}

/**
 * CHART LOGIC
 */

function setupCharts() {
    const ctxDist = document.getElementById('distribution-chart').getContext('2d');
    state.charts.dist = new Chart(ctxDist, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Baseline',
                    data: [],
                    borderColor: 'rgba(79, 172, 254, 0.8)',
                    backgroundColor: 'rgba(79, 172, 254, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Production',
                    data: [],
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    const ctxTime = document.getElementById('timeline-chart').getContext('2d');
    state.charts.timeline = new Chart(ctxTime, {
        type: 'line',
        data: {
            labels: Array.from({length: 10}, (_, i) => `T-${10-i}`),
            datasets: [{
                label: 'Drift Score',
                data: [],
                borderColor: '#00f2fe',
                borderWidth: 3,
                tension: 0.3,
                fill: {
                    target: 'origin',
                    above: 'rgba(0, 242, 254, 0.1)'
                }
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8' } },
                y: { min: 0, max: 0.6, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

async function updateCharts(results, feature) {
    updateDistributionChart(feature);
    await updateTimelineChart(results.statistic);
}

function updateDistributionChart(feature) {
    const baseline = state.baselineData[feature];
    const production = state.productionData[feature];
    
    const bins = 40;
    const min = Math.min(...baseline, ...production);
    const max = Math.max(...baseline, ...production);
    const binWidth = (max - min) / bins;
    
    const getHist = (data) => {
        const hist = Array(bins).fill(0);
        data.forEach(v => {
            const b = Math.min(Math.floor((v - min) / binWidth), bins - 1);
            hist[b]++;
        });
        return hist.map(v => v / data.length);
    };

    state.charts.dist.data.labels = Array(bins).fill('');
    state.charts.dist.data.datasets[0].data = getHist(baseline);
    state.charts.dist.data.datasets[1].data = getHist(production);
    state.charts.dist.update('none');
}

async function updateTimelineChart(newScore) {
    const historyData = await dataService.getHistory();
    const history = historyData.map(h => h.statistic).reverse(); // Reverse because DB is desc
    const displayHistory = history.slice(-10);
    
    // Ensure we have at least 10 points for a smooth chart
    while (displayHistory.length < 10) displayHistory.unshift(0.05);

    state.charts.timeline.data.datasets[0].data = displayHistory;
    state.charts.timeline.data.datasets[0].borderColor = newScore > 0.2 ? '#ef4444' : '#00f2fe';
    state.charts.timeline.update();
}

function updateUIState(uiState) {
    const triggerBtn = document.getElementById('trigger-drift');
    if (uiState === 'drifted') {
        triggerBtn.innerText = "⚠️ Market Shift Active";
        triggerBtn.classList.add('danger');
    } else {
        triggerBtn.innerText = "⚡ Trigger Market Shift";
        triggerBtn.classList.remove('danger');
    }
}

// Start Application
init();

