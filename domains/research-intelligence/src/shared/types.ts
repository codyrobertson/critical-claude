/**
 * Local Types for Research Intelligence Domain
 */

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}