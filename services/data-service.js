/**
 * Guardian AI: Data Service
 * Handles data generation, simulation scenarios, and mock persistence.
 */
import { io } from 'socket.io-client';
import { DriftDetectionService } from '../shared/drift-service.js';

export class DataService {
    constructor() {
        this.storageKey = 'guardian_ai_history';
        this.tokenKey = 'guardian_ai_token';
        this.apiBase = 'http://localhost:3001/api';
        this.socket = null;
        this.token = localStorage.getItem(this.tokenKey);
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) throw new Error('Login failed');
            const data = await response.json();
            this.token = data.token;
            localStorage.setItem(this.tokenKey, this.token);
            return true;
        } catch (e) {
            console.error("Login Error:", e);
            return false;
        }
    }

    setupSocketListeners(onAlert) {
        if (!this.socket) {
            this.socket = io('http://localhost:3001');
            this.socket.on('drift_alert', (data) => {
                onAlert(data);
            });
        }
    }

    /**
     * Generate synthetic data for specific scenarios.
     */
    generateScenarioData(nSamples = 500, scenario = 'baseline') {
        const data = {
            income: [],
            creditScore: [],
            debtRatio: []
        };

        for (let i = 0; i < nSamples; i++) {
            if (scenario === 'baseline') {
                data.income.push(DriftDetectionService.randomNormal(50000, 15000));
                data.creditScore.push(DriftDetectionService.randomNormal(650, 100));
                data.debtRatio.push(Math.random() * 40 + 10);
            } else if (scenario === 'recession') {
                data.income.push(DriftDetectionService.randomNormal(32000, 14000));
                data.creditScore.push(DriftDetectionService.randomNormal(570, 120));
                data.debtRatio.push(Math.random() * 70 + 25);
            }
        }
        return data;
    }

    /**
     * Run drift detection via API (with LocalStorage fallback)
     */
    async runDriftDetection(baseline, production) {
        try {
            // Auto-login for demo if no token
            if (!this.token) await this.login('admin', 'guardian');

            const response = await fetch(`${this.apiBase}/detect`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ baseline, production })
            });
            
            if (response.status === 401 || response.status === 403) {
                // Token expired/invalid, try once more after relogin
                await this.login('admin', 'guardian');
                return this.runDriftDetection(baseline, production);
            }

            if (!response.ok) throw new Error('API request failed');
            
            return await response.json();
        } catch (e) {
            console.warn("Backend API unavailable, falling back to local computation:", e);
            const results = DriftDetectionService.ksTest2Samp(baseline, production);
            this.saveDriftResultLocally(results);
            return results;
        }
    }

    /**
     * Fetch history from API (with LocalStorage fallback)
     */
    async getHistory() {
        try {
            const response = await fetch(`${this.apiBase}/history`);
            if (!response.ok) throw new Error('API request failed');
            return await response.json();
        } catch (e) {
            console.warn("Backend API unavailable, using local history:", e);
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        }
    }

    saveDriftResultLocally(result) {
        try {
            const history = this.getHistoryLocally();
            history.push(result);
            if (history.length > 50) history.shift();
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save drift history locally:", e);
        }
    }

    getHistoryLocally() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    clearHistory() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.tokenKey);
        this.token = null;
    }
}
