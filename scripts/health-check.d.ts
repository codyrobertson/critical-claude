#!/usr/bin/env node
export default HealthChecker;
declare class HealthChecker {
    results: {
        timestamp: string;
        status: string;
        checks: never[];
        errors: never[];
        warnings: never[];
        summary: {};
    };
    log(message: any, type?: string): void;
    runCheck(name: any, checkFunction: any): Promise<boolean>;
    checkSystemRequirements(): Promise<boolean>;
    checkFileSystem(): Promise<boolean>;
    checkCLIInstallation(): Promise<boolean>;
    checkDomains(): Promise<boolean>;
    checkBasicFunctionality(): Promise<boolean>;
    checkAnalytics(): Promise<boolean>;
    checkPerformance(): Promise<boolean>;
    checkDataPersistence(): Promise<boolean>;
    runCommand(command: any, args: any): Promise<any>;
    runAllChecks(): Promise<boolean>;
    generateReport(): boolean;
    getStatusEmoji(): "🟢" | "🟡" | "🔴" | "⚪";
}
//# sourceMappingURL=health-check.d.ts.map