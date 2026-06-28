import { describe, it, expect } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
  it('flags forbidden / unauthenticated / not_found / validation by type', () => {
    expect(new ApiError(403, 'forbidden', 'x').isForbidden).toBe(true);
    expect(new ApiError(401, 'unauthenticated', 'x').isUnauthenticated).toBe(true);
    expect(new ApiError(404, 'not_found', 'x').isNotFound).toBe(true);
    expect(new ApiError(422, 'validation', 'x').isValidation).toBe(true);
  });

  it('exposes validationErrors only for validation type', () => {
    const v = new ApiError(422, 'validation', 'bad', { since: ['The since is not a valid date.'] });
    expect(v.validationErrors).toEqual({ since: ['The since is not a valid date.'] });
    expect(new ApiError(403, 'forbidden', 'x', { ability: 'view-jobs' }).validationErrors).toEqual({});
  });

  it('is an Error with a name and message', () => {
    const e = new ApiError(500, 'unknown', 'boom');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiError');
    expect(e.message).toBe('boom');
  });
});
