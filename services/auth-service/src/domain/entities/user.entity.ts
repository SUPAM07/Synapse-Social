export interface UserEntity {
  id: string;
  login: string;
  password: string;
  email: string;
  isConfirmed: boolean;
  fullName: string;
  picturePath?: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<UserEntity, 'password'>;

export const toPublicUser = (user: UserEntity): PublicUser => {
  const { password: _password, ...publicUser } = user;
  return publicUser;
};
