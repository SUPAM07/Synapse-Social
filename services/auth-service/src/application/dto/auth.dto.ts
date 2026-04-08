export interface RegisterDto {
  login: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  login: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface SendPasswordResetDto {
  email: string;
}

export interface ConfirmEmailDto {
  token: string;
}
