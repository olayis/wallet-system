import { z } from "zod";

type ValidationIssue = { input?: unknown; path?: PropertyKey[] };

function fieldName(issue: ValidationIssue): string {
  return Array.isArray(issue.path) && issue.path.length ? issue.path.join(".") : "value";
}

// A missing key parses as `undefined`, so any issue whose input is undefined is a
// required-field error regardless of the expected type. This maps those to a
// friendly "<field> is required" instead of Zod's default type message.
export function configureValidation(): void {
  z.config({
    customError: (issue) => (issue.input === undefined ? `${fieldName(issue)} is required` : undefined),
  });
}

// For fields that carry their own message for an invalid value: return that
// message when a value is present, but defer to the global rule (above) when the
// field is omitted, so an omitted key still reads "<field> is required".
export const requiredAware =
  (message: string) =>
  (issue: ValidationIssue): string | undefined =>
    issue.input === undefined ? undefined : message;
