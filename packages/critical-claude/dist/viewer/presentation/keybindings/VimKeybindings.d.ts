/**
 * Vim Keybindings
 * Implements vim-style keyboard navigation and commands
 */
import { KeyModifiers } from '../views/IView.js';
export type VimMode = 'normal' | 'insert' | 'visual' | 'command';
export interface VimCommand {
    keys: string[];
    mode: VimMode[];
    action: string;
    description: string;
}
export interface VimState {
    mode: VimMode;
    commandBuffer: string;
    count: number;
    register: string;
    lastCommand?: VimCommand;
    visualStart?: {
        line: number;
        column: number;
    };
    visualEnd?: {
        line: number;
        column: number;
    };
}
export declare class VimKeybindings {
    private state;
    private commands;
    private commandTimeout;
    processKey(key: string, modifiers: KeyModifiers): string | null;
    getMode(): VimMode;
    setMode(mode: VimMode): void;
    getState(): VimState;
    private normalizeKey;
    private findMatchingCommands;
    private executeCommand;
    private resetCommandBuffer;
    getCommands(mode?: VimMode): VimCommand[];
    getKeybindingHelp(): string[];
}
//# sourceMappingURL=VimKeybindings.d.ts.map