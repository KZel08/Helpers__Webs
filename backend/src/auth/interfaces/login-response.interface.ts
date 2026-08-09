export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}
