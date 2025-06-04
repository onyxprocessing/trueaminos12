/**
 * Empty toast implementation
 * This module provides a silent implementation of the toast API
 */

export const toast = (_options: any) => {};

export function useToast() {
  return {
    toast: (_options: any) => {},
    dismiss: () => {}
  };
}