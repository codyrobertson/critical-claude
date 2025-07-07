/**
 * Tests for config loader
 */

import { describe, it, expect } from '@jest/globals';
import { getConfig } from '../config-loader.js';

describe('ConfigLoader', () => {
  it('should load configuration', async () => {
    const config = await getConfig();

    expect(config).toBeDefined();
    expect(config.general).toBeDefined();
    expect(config.brutal_plan).toBeDefined();
    expect(config.critique).toBeDefined();
  });

  it('should have proper brutal plan multipliers', async () => {
    const config = await getConfig();

    expect(config.brutal_plan.base_multipliers).toBeDefined();
    expect(config.brutal_plan.base_multipliers.auth).toBe(3.5);
    expect(config.brutal_plan.base_multipliers.payment).toBe(5.0);
    expect(config.brutal_plan.base_multipliers.default).toBe(2.5);
  });

  it('should have complexity and efficiency factors', async () => {
    const config = await getConfig();

    expect(config.brutal_plan.complexity_factors).toBeDefined();
    expect(config.brutal_plan.complexity_factors.pci_compliance).toBe(1.5);

    expect(config.brutal_plan.efficiency_factors).toBeDefined();
    expect(config.brutal_plan.efficiency_factors.experienced_team).toBe(0.85);
  });

  it('should have phase percentages that sum to 100', async () => {
    const config = await getConfig();
    const phases = config.brutal_plan.phases;

    const sum = phases.research_percent + phases.implementation_percent + phases.hardening_percent;
    expect(sum).toBe(100);
  });
});
