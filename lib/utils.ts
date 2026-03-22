import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanProductName(name: string | undefined | null): string {
  if (!name) return "";
  return name.replace(/\s+\d{3,}$/, '');
}
