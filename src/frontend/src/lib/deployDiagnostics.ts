/**
 * Diagnostics utility for normalizing errors and providing actionable feedback
 * for deployment and publish operations.
 */

export interface DiagnosticPayload {
  message: string;
  details?: string;
  step?: string;
  cause?: string;
}

/**
 * Normalize any thrown value into a consistent diagnostic payload
 */
export function normalizeToDiagnostic(
  error: unknown,
  step?: string
): DiagnosticPayload {
  // Handle null/undefined
  if (error == null) {
    return {
      message: 'An unknown error occurred',
      step,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const diagnostic: DiagnosticPayload = {
      message: error.message || 'An error occurred',
      step,
    };

    // Extract cause chain if available
    if ('cause' in error && error.cause) {
      diagnostic.cause = stringifySafe(error.cause);
    }

    // Add stack trace to details in development
    if (error.stack && import.meta.env.DEV) {
      diagnostic.details = error.stack;
    }

    return diagnostic;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      step,
    };
  }

  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error) {
    const diagnostic: DiagnosticPayload = {
      message: String((error as { message: unknown }).message),
      step,
    };

    if ('details' in error) {
      diagnostic.details = String((error as { details: unknown }).details);
    }

    if ('cause' in error) {
      diagnostic.cause = stringifySafe((error as { cause: unknown }).cause);
    }

    return diagnostic;
  }

  // Fallback: stringify the error
  return {
    message: 'An unexpected error occurred',
    details: stringifySafe(error),
    step,
  };
}

/**
 * Safely stringify any value, handling circular references
 */
function stringifySafe(value: unknown): string {
  try {
    if (value == null) return String(value);
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    // Try JSON.stringify with circular reference handling
    const seen = new WeakSet();
    return JSON.stringify(
      value,
      (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular]';
          }
          seen.add(val);
        }
        return val;
      },
      2
    );
  } catch {
    // Fallback to toString
    try {
      return String(value);
    } catch {
      return '[Unstringifiable value]';
    }
  }
}

/**
 * Format a diagnostic payload for console logging
 */
export function formatDiagnosticForConsole(diagnostic: DiagnosticPayload): string {
  const parts: string[] = [];
  
  if (diagnostic.step) {
    parts.push(`[${diagnostic.step}]`);
  }
  
  parts.push(diagnostic.message);
  
  if (diagnostic.details) {
    parts.push(`\nDetails: ${diagnostic.details}`);
  }
  
  if (diagnostic.cause) {
    parts.push(`\nCause: ${diagnostic.cause}`);
  }
  
  return parts.join(' ');
}

/**
 * Format a diagnostic payload for user-facing display
 */
export function formatDiagnosticForUser(diagnostic: DiagnosticPayload): {
  title: string;
  message: string;
  details?: string;
} {
  const title = diagnostic.step 
    ? `Failed at: ${diagnostic.step}`
    : 'Operation failed';
  
  return {
    title,
    message: diagnostic.message,
    details: diagnostic.details || diagnostic.cause,
  };
}
