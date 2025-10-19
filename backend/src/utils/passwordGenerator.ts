import bcrypt from 'bcryptjs';

/**
 * Generate a random password
 * @param length Length of the password (default: 8)
 * @returns Random password string
 */
export const generatePassword = (length: number = 8): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';

  // Ensure at least one lowercase, uppercase, digit, and special char
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%';

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate username from full name
 * @param fullName Full name of the user
 * @returns Generated username (firstname.lastname)
 */
export const generateUsername = (fullName: string): string => {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  return `${parts[0]}.${parts[parts.length - 1]}`;
};

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if passwords match
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
