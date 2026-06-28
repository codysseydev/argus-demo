export type ApiErrorType =
  | 'validation'
  | 'forbidden'
  | 'not_found'
  | 'unauthenticated'
  | 'network'
  | 'unknown';

/**
 * The single error type every API call rejects with. `type` classifies the
 * failure so the UI can branch (forbidden -> "not authorized", unauthenticated
 * -> "session expired", validation -> field errors) without re-parsing the
 * envelope. 401 is classified by HTTP status because it comes from the app's
 * auth middleware, not the package envelope.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly type: ApiErrorType,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isForbidden(): boolean {
    return this.type === 'forbidden';
  }

  get isUnauthenticated(): boolean {
    return this.type === 'unauthenticated';
  }

  get isNotFound(): boolean {
    return this.type === 'not_found';
  }

  get isValidation(): boolean {
    return this.type === 'validation';
  }

  /** Field -> messages, populated only for validation (422) failures. */
  get validationErrors(): Record<string, string[]> {
    return this.isValidation ? (this.details as Record<string, string[]>) : {};
  }
}

/**
 * The field errors from a failed mutation, if it failed validation (422). Lets a
 * screen forward `mutation.error` straight into a form's `errors` prop without
 * re-checking the type at each call site. Returns undefined for any non-422
 * failure (those are surfaced as a banner via MutationError instead).
 */
export function validationErrorsOf(error: unknown): Record<string, string[]> | undefined {
  return error instanceof ApiError && error.isValidation ? error.validationErrors : undefined;
}
