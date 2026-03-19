import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]+/g, "-").replace(/-+/g, "-");
}
