export interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export * from './marketplace.types';
export * from './campaigns.types';
export * from './chat.types';
export * from './cart.types';
export * from './wallet.types';
export * from './samples.types';
