/**
 * Sanitizes payloads before sending to Supabase
 * Removes all columns that are auto-generated, read-only, or derived
 */

const BLOCKED_COLUMNS = [
  // Auto-generated IDs
  "id",
  // Timestamps (auto-generated)
  "created_at",
  "updated_at",
  "reading_timestamp",
  "resolved_at",
  // Calculated/read-only fields
  "quantity_available",
  "total_price",
  "total_cost",
  "is_alarm",
];

/**
 * Removes blocked columns from a payload object
 * @param data - The object to sanitize
 * @returns A new object with blocked columns removed
 */
export function sanitizePayload<T extends Record<string, any>>(
  data: T
): Partial<T> {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sanitized = { ...data };

  BLOCKED_COLUMNS.forEach((column) => {
    if (column in sanitized) {
      delete sanitized[column as keyof T];
    }
  });

  return sanitized;
}

/**
 * Sanitizes an array of objects
 * @param dataArray - Array of objects to sanitize
 * @returns Array of sanitized objects
 */
export function sanitizePayloadArray<T extends Record<string, any>>(
  dataArray: T[]
): Partial<T>[] {
  return dataArray.map((data) => sanitizePayload(data));
}
