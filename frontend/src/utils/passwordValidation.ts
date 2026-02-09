/** Shared password policy: min 8 chars, uppercase, lowercase, number */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasNumber: /\d/,
};

export function validatePassword(password: string): string | undefined {
  if (password.length < PASSWORD_RULES.minLength) {
    return `At least ${PASSWORD_RULES.minLength} characters`;
  }
  if (!PASSWORD_RULES.hasUpper.test(password)) return 'Include an uppercase letter';
  if (!PASSWORD_RULES.hasLower.test(password)) return 'Include a lowercase letter';
  if (!PASSWORD_RULES.hasNumber.test(password)) return 'Include a number';
  return undefined;
}
