import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes without style conflicts.
 * All dynamic class names in React components should flow through cn()
 * so Tailwind's purge scanner can reliably detect them.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
