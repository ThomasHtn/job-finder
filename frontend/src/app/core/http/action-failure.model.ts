/**
 * An action that failed, kept as data rather than as text so the message follows a language switch.
 */
export interface ActionFailure {
  /**
   * Translation key of the sentence naming the action, with a `{{detail}}` placeholder.
   */
  key: string;

  /**
   * What went wrong, as thrown by the call.
   */
  cause: unknown;
}
