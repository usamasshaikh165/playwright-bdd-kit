/**
 * Generate a random letters-only string of the given length.
 * Letters-only (rather than alphanumeric) because many name fields reject
 * digits; a purely alphabetic value passes the widest range of validators.
 * @param l - Length of the random string (default: 6)
 * @returns Random uppercase letters-only string
 */
export const randomVariable = (l: number = 6): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < l; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};
