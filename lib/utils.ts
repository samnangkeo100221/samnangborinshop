import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let counter = 1000;
export function generateUniqueId(prefix: string = 'id'): string {
  counter += 1;
  const time = typeof Date !== 'undefined' ? Date.now() : 100000;
  return `${prefix}-${time}-${counter}`;
}

export function getCurrentIsoDate(): string {
  return new Date().toISOString();
}
