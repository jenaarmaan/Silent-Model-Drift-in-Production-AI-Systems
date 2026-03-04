import Chart from 'chart.js/auto';

// --- DRIFT DETECTION SERVICE ---

class DriftDetectionService {
    /**
     * Kolmogorov-Smirnov Test for 2 samples
     * Based on SciPy implementation principles
     */
    static ksTest2Samp(data1, data2) {
        const n1 = data1.length;
        const n2 = data2.length;
        const sorted1 = [...data1].sort((a, b) => a - b);
        const sorted2 = [...data2].sort((a, b) => a - b);
        
        const allPoints = [...new Set([...sorted1, ...sorted2])].sort((a, b) => a - b);
        
        let dMax = 0;
        let cdf1 = 0;
        let cdf2 = 0;
        let i1 = 0;
        let i2 = 0;
        
        for (const val of allPoints) {
            while (i1 < n1 && sorted1[i1] <= val) {
                i1++;
                cdf1 = i1 / n1;
            }
            while (i2 < n2 && sorted2[i2] <= val) {
                i2++;
                cdf2 = i2 / n2;
            }
            dMax = Math.max(dMax, Math.abs(cdf1 - cdf2));
        }
        
        // Critical value check (Simplified)
        // At alpha=0.05, c(alpha) = 1.36
        const criticalValue = 1.36 * Math.sqrt((n1 + n2) / (n1 * n2));
        const driftDetected = dMax > criticalValue;
        
        return {
            statistic: dMax,
            criticalValue: criticalValue,
            driftDetected: driftDetected
        };
    }

    /**
     * Generate synthetic data
     */
    static generateData(nSamples = 500, hasDrift = false) {
        const data = {
            income: [],
            creditScore: [],
            debtRatio: []
        };

        for (let i = 0; i < nSamples; i++) {
            if (!hasDrift) {
                // Baseline: Normal distributions
                data.income.push(this.randomNormal(50000, 15000));
                data.creditScore.push(this.randomNormal(650, 100));
                data.debtRatio.push(Math.random() * 40 + 10);
            } else {
                // Drift: Recession scenario (Income drops, debt rises)
                data.income.push(this.randomNormal(35000, 12000));
                data.creditScore.push(this.randomNormal(580, 110));
                data.debtRatio.push(Math.random() * 60 + 20);
            }
        }
        return data;
    }

    static randomNormal(mean, std) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
}

// --- DASHBOARD UI LOGIC ---

let baselineData = DriftDetectionService.generateData(1000, false);
let productionData = DriftDetectionService.generateData(500, false);
let driftHistory = [];
let distChart, timelineChart;

function init() {
    updateTimestamp();
    setupCharts();
    runMonitoringCycle();
    
    document.getElementById('trigger-drift').addEventListener('click', () => {
        productionData = DriftDetectionService.generateData(500, true);
        runMonitoringCycle();
        updateUIState('drifted');
    });

    document.getElementById('reset-baseline').addEventListener('click', () => {
        productionData = DriftDetectionService.generateData(500, false);
        runMonitoringCycle();
        updateUIState('healthy');
    });
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('current-timestamp').innerText = `Last updated: ${now.toLocaleTimeString()}`;
}

function runMonitoringCycle() {
    const results = DriftDetectionService.ksTest2Samp(baselineData.income, productionData.income);
    const driftScore = results.statistic;
    
    // Update Score Circle
    const circle = document.getElementById('drift-score-path');
    const scoreVal = document.getElementById('drift-score-value');
    const statusText = document.getElementById('drift-status');
    const systemStatus = document.getElementById('system-status');
    
    const dashArray = `${(driftScore * 100).toFixed(0)}, 100`;
    circle.setAttribute('stroke-dasharray', dashArray);
    circle.style.stroke = driftScore > 0.2 ? 'var(--danger)' : 'var(--success)';
    scoreVal.innerText = driftScore.toFixed(3);
    
    if (driftScore > 0.2) {
        statusText.innerText = "🚨 Drift Detected!";
        statusText.style.color = 'var(--danger)';
        systemStatus.innerHTML = '<span class="dot pulse red"></span> Warning';
    } else {
        statusText.innerText = "Healthy ✅";
        statusText.style.color = 'var(--success)';
        systemStatus.innerHTML = '<span class="dot pulse green"></span> Active';
    }

    // Update KPI metrics (simulated degradation)
    const accuracy = driftScore > 0.2 ? (85 + Math.random() * 5) : (97 + Math.random() * 2);
    const f1 = driftScore > 0.2 ? (82 + Math.random() * 5) : (96 + Math.random() * 2);
    
    updateBar('accuracy-bar', 'accuracy-val', accuracy);
    updateBar('f1-bar', 'f1-val', f1);

    // Update charts
    updateDistributionChart(baselineData.income, productionData.income);
    updateTimelineChart(driftScore);
    updateTimestamp();
}

function updateBar(barId, valId, value) {
    const bar = document.getElementById(barId);
    const valText = document.getElementById(valId);
    bar.style.width = `${value}%`;
    valText.innerText = `${value.toFixed(1)}%`;
    bar.style.backgroundColor = value < 90 ? 'var(--danger)' : 'var(--primary)';
}

function setupCharts() {
    const ctxDist = document.getElementById('distribution-chart').getContext('2d');
    distChart = new Chart(ctxDist, {
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
    timelineChart = new Chart(ctxTime, {
        type: 'line',
        data: {
            labels: Array.from({length: 10}, (_, i) => `T-${10-i}`),
            datasets: [{
                label: 'Drift Score',
                data: Array(10).fill(0.05),
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

function updateDistributionChart(baseline, production) {
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
        // smooth a bit
        return hist.map(v => v / data.length);
    };

    distChart.data.labels = Array(bins).fill('');
    distChart.data.datasets[0].data = getHist(baseline);
    distChart.data.datasets[1].data = getHist(production);
    distChart.update('none');
}

function updateTimelineChart(newScore) {
    driftHistory.push(newScore);
    if (driftHistory.length > 10) driftHistory.shift();
    
    timelineChart.data.datasets[0].data = driftHistory;
    
    // Change color if drifting
    timelineChart.data.datasets[0].borderColor = newScore > 0.2 ? '#ef4444' : '#00f2fe';
    timelineChart.update();
}

function updateUIState(state) {
    const triggerBtn = document.getElementById('trigger-drift');
    if (state === 'drifted') {
        triggerBtn.innerText = "⚠️ Market Shift Active";
        triggerBtn.classList.add('danger');
    } else {
        triggerBtn.innerText = "⚡ Trigger Market Shift";
        triggerBtn.classList.remove('danger');
    }
}

// Start
init();
