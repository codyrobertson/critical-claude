/**
 * Simplified Analytics Model
 * Consolidated from analytics domain
 */
// Utility functions
export function generateMetricId(command, action) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeComponent = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    if (command) {
        const slug = `${command}${action ? `-${action}` : ''}`
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .slice(0, 15); // Limit length
        return `m-${slug}-${timestamp}-${timeComponent}`;
    }
    return `metric-${timestamp}-${timeComponent}`;
}
export function createMetric(data) {
    return {
        id: generateMetricId(data.command, data.action),
        command: data.command,
        action: data.action,
        success: data.success,
        executionTime: data.executionTime,
        timestamp: new Date(),
        error: data.error
    };
}
export function calculateStats(metrics) {
    const totalMetrics = metrics.length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => m.timestamp >= sevenDaysAgo);
    const successfulMetrics = metrics.filter(m => m.success);
    // Calculate top commands
    const commandCounts = new Map();
    metrics.forEach(metric => {
        const key = metric.action ? `${metric.command} ${metric.action}` : metric.command;
        commandCounts.set(key, (commandCounts.get(key) || 0) + 1);
    });
    const topCommands = Array.from(commandCounts.entries())
        .map(([command, count]) => ({ command, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    // Calculate error breakdown
    const errorCounts = new Map();
    metrics.filter(m => !m.success && m.error).forEach(metric => {
        const error = metric.error;
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });
    const errorBreakdown = Array.from(errorCounts.entries())
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    return {
        totalMetrics,
        recentCommands: recentMetrics.length,
        successRate: totalMetrics > 0 ? successfulMetrics.length / totalMetrics : 0,
        topCommands,
        errorBreakdown
    };
}
