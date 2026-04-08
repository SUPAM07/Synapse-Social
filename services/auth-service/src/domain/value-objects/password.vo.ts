import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class PasswordVO {
  private readonly hashed: string;

  private constructor(hashed: string) {
    this.hashed = hashed;
  }

  static async create(plaintext: string): Promise<PasswordVO> {
    if (plaintext.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const hashed = await bcrypt.hash(plaintext, SALT_ROUNDS);
    return new PasswordVO(hashed);
  }

  static fromHash(hashed: string): PasswordVO {
    return new PasswordVO(hashed);
  }

  async compare(plaintext: string): Promise<boolean> {
    return bcrypt.compare(plaintext, this.hashed);
  }

  toString(): string {
    return this.hashed;
  }
}
