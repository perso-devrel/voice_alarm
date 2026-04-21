import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export function applyPepper(password: string, pepper: string): string {
  return `${password}::${pepper ?? ''}`;
}

export async function hashPassword(password: string, pepper: string): Promise<string> {
  return bcrypt.hash(applyPepper(password, pepper), BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
  pepper: string,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(applyPepper(password, pepper), hash);
}
