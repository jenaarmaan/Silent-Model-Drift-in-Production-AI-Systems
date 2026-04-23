/**
 * Guardian AI: Drift Detection Service
 * Optimized for production-grade statistical analysis.
 */

export class DriftDetectionService {
    /**
     * Kolmogorov-Smirnov Test for 2 samples.
     * Optimized implementation: O(N log N + M log M)
     * Includes robust data validation and error handling.
     * 
     * @param {number[]} data1 - Baseline dataset
     * @param {number[]} data2 - Production dataset
     * @returns {Object} Results including statistic and drift status
     */
    static ksTest2Samp(data1, data2) {
        // --- 1. DATA VALIDATION ---
        if (!Array.isArray(data1) || !Array.isArray(data2)) {
            throw new Error("Invalid input: data must be arrays.");
        }
        
        const cleanData1 = data1.filter(v => typeof v === 'number' && !isNaN(v));
        const cleanData2 = data2.filter(v => typeof v === 'number' && !isNaN(v));

        if (cleanData1.length === 0 || cleanData2.length === 0) {
            return { statistic: 0, criticalValue: 0, driftDetected: false, error: "Empty or invalid data" };
        }

        const n1 = cleanData1.length;
        const n2 = cleanData2.length;

        // --- 2. OPTIMIZED KS-TEST ---
        // Sort individual arrays
        const sorted1 = [...cleanData1].sort((a, b) => a - b);
        const sorted2 = [...cleanData2].sort((a, b) => a - b);

        let i1 = 0;
        let i2 = 0;
        let dMax = 0;
        let cdf1 = 0;
        let cdf2 = 0;

        // Iterate through both sorted lists simultaneously (Merging pattern)
        while (i1 < n1 || i2 < n2) {
            const val1 = i1 < n1 ? sorted1[i1] : Infinity;
            const val2 = i2 < n2 ? sorted2[i2] : Infinity;

            if (val1 === val2) {
                // Handle ties
                const currentVal = val1;
                while (i1 < n1 && sorted1[i1] === currentVal) i1++;
                while (i2 < n2 && sorted2[i2] === currentVal) i2++;
            } else if (val1 < val2) {
                i1++;
            } else {
                i2++;
            }

            cdf1 = i1 / n1;
            cdf2 = i2 / n2;
            dMax = Math.max(dMax, Math.abs(cdf1 - cdf2));
        }

        // --- 3. STATISTICAL SIGNIFICANCE ---
        // At alpha=0.05, constant is 1.36
        // For production, this alpha should be configurable.
        const alpha = 0.05;
        const cAlpha = 1.36; 
        const criticalValue = cAlpha * Math.sqrt((n1 + n2) / (n1 * n2));
        const driftDetected = dMax > criticalValue;

        return {
            statistic: dMax,
            criticalValue: criticalValue,
            pAlpha: alpha,
            driftDetected: driftDetected,
            sampleSizes: { baseline: n1, production: n2 },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Box-Muller transform for normal distribution generation.
     */
    static randomNormal(mean, std) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
}
