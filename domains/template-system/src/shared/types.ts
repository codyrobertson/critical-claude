/**
 * Local Types for Template System Domain
 */

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}