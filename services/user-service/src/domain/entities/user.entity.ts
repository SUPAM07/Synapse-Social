export interface UserEntity {
  id: string;
  login: string;
  email: string;
  fullName: string;
  picturePath?: string | null;
  role: 'user' | 'admin';
  isConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyEntity {
  id: string;
  name: string;
  description?: string | null;
  picturePath?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
