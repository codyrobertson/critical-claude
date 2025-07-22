/**
 * Viewer Service
 * Simplified viewer service that delegates to legacy implementation
 */

import { Result } from '../../shared/types.js';

export interface ViewerRequest {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  theme?: 'dark' | 'light';
}

export interface ViewerResponse extends Result<string> {
  viewerStarted?: boolean;
}

export class ViewerService {
  async launchViewer(request?: ViewerRequest): Promise<ViewerResponse> {
    // For now, delegate to legacy implementation
    return {
      success: false,
      error: 'Viewer system not yet migrated. Use legacy CLI: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js viewer'
    };
  }

  async getViewerStatus(): Promise<Result<boolean>> {
    return {
      success: true,
      data: false
    };
  }
}