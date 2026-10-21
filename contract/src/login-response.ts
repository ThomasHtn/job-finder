/**
 * Answer of a successful sign-in.
 */
export interface LoginResponse {
  /**
   * Session token, sent back in the APP_TOKEN_HEADER of every API request.
   */
  token: string;
}
