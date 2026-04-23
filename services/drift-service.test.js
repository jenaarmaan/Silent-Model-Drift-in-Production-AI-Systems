import { describe, it, expect } from 'vitest';
import { DriftDetectionService } from '../shared/drift-service.js';

describe('DriftDetectionService - KS Test', () => {
    
    it('should detect NO drift for identical distributions', () => {
        const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const data2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result = DriftDetectionService.ksTest2Samp(data1, data2);
        
        expect(result.statistic).toBe(0);
        expect(result.driftDetected).toBe(false);
    });

    it('should detect drift for significantly different distributions', () => {
        // Normal(50, 5) vs Normal(80, 5)
        const baseline = Array.from({ length: 100 }, () => DriftDetectionService.randomNormal(50, 5));
        const production = Array.from({ length: 100 }, () => DriftDetectionService.randomNormal(80, 5));
        
        const result = DriftDetectionService.ksTest2Samp(baseline, production);
        
        expect(result.statistic).toBeGreaterThan(0.5);
        expect(result.driftDetected).toBe(true);
    });

    it('should handle small shifts gracefully (below critical value)', () => {
        const baseline = Array.from({ length: 500 }, () => DriftDetectionService.randomNormal(50, 10));
        const production = Array.from({ length: 500 }, () => DriftDetectionService.randomNormal(51, 10));
        
        const result = DriftDetectionService.ksTest2Samp(baseline, production);
        
        // At n=500, critical value is approx 0.086
        // A shift of 1 with std 10 is unlikely to trigger 0.086
        expect(result.driftDetected).toBe(false);
    });

    it('should handle edge cases: empty arrays', () => {
        const result = DriftDetectionService.ksTest2Samp([], []);
        expect(result.driftDetected).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should handle edge cases: invalid data types', () => {
        const data1 = [1, 2, 'invalid', null, NaN];
        const data2 = [1, 2, 3];
        const result = DriftDetectionService.ksTest2Samp(data1, data2);
        
        // Should clean data and compare [1, 2] with [1, 2, 3]
        expect(result.sampleSizes.baseline).toBe(2);
        expect(result.driftDetected).toBe(false);
    });

    it('should handle ties correctly', () => {
        const data1 = [1, 1, 1, 1, 1];
        const data2 = [2, 2, 2, 2, 2];
        const result = DriftDetectionService.ksTest2Samp(data1, data2);
        
        // CDF1 jumps to 1.0 at x=1, CDF2 stays 0 until x=2. Max diff is 1.0.
        expect(result.statistic).toBe(1);
        expect(result.driftDetected).toBe(true);
    });
});
