export const MAX_LOGIN_LENGTH = 100;

/** Letters, digits and hyphens (underscores for managed-user suffixes), with an optional [bot] suffix. No dots, so emails and file names are rejected. */
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?(?:\[bot\])?$/;

export function isLoginLike(text: string): boolean {
  return text.length > 0 && text.length <= MAX_LOGIN_LENGTH && LOGIN.test(text);
}

/** The key that matches a seat with a user in the report: trimmed and lower case. */
export const loginKey = (login: string): string => login.trim().toLowerCase();

/** The login in a cell: trimmed, without surrounding quotes or a leading "@". Null when it is not a login. */
export function readLogin(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim()
    .replace(/^@/, '');
  return isLoginLike(text) ? text : null;
}
