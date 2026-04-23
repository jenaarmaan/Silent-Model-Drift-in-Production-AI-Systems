import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import { initDb } from './db.js';
import { DriftDetectionService } from '../shared/drift-service.js';
import logger from './logger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(bodyParser.json());

let db;

// Schema Validation
const DetectSchema = z.object({
    baseline: z.array(z.number()).min(10, "Baseline too small"),
    production: z.array(z.number()).min(10, "Production too small"),
    featureName: z.string().optional()
});

// Middleware: Auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn(`Failed auth attempt: ${err.message}`);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Initialize Database
initDb().then(database => {
    db = database;
    logger.info('✅ SQLite Database initialized');
});

// --- API ENDPOINTS ---

/**
 * Login (Simplified for prototype)
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded for demo
    if (username === 'admin' && password === 'guardian') {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

/**
 * Endpoint to run drift detection (Protected)
 */
app.post('/api/detect', authenticateToken, async (req, res) => {
    try {
        const { baseline, production, featureName = 'General' } = req.body; // featureName added
        
        const results = DriftDetectionService.ksTest2Samp(baseline, production);
        
        // Save to SQLite
        await db.run(
            `INSERT INTO drift_history (statistic, criticalValue, driftDetected, timestamp, sampleSizeBaseline, sampleSizeProduction) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                results.statistic, 
                results.criticalValue, 
                results.driftDetected ? 1 : 0, 
                results.timestamp,
                results.sampleSizes.baseline,
                results.sampleSizes.production
            ]
        );

        // Real-time Alert if drift detected
        if (results.driftDetected) {
            // Internal Socket Alert
            io.emit('drift_alert', {
                feature: featureName,
                message: `🚨 Critical Drift Detected in ${featureName}!`,
                score: results.statistic,
                timestamp: results.timestamp
            });

            // Simulated External Webhook (Slack/PagerDuty)
            logger.info(`[ALERT] Triggering Slack Webhook for ${featureName}...`);
            // await fetch(process.env.SLACK_WEBHOOK_URL, { ... })
        }

        res.json({ ...results, featureName });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation Error', details: err.errors });
        }
        logger.error(`Drift detection failed: ${err.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get historical drift results
 */
app.get('/api/history', async (req, res) => {
    try {
        const history = await db.all('SELECT * FROM drift_history ORDER BY timestamp DESC LIMIT 50');
        res.json(history.map(h => ({ ...h, driftDetected: h.driftDetected === 1 })));
    } catch (err) {
        logger.error(`Failed to fetch history: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'Guardian AI 1.0', security: 'JWT Enabled' });
});

// Use httpServer instead of app.listen for Socket.io
httpServer.listen(port, () => {
    logger.info(`🚀 Guardian AI Production Backend running at http://localhost:${port}`);
});
