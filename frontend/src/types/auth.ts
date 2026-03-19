// Rolurile posibile ale unui utilizator in aplicatie
export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

// Date trimise la login
export interface LoginRequest {
  email: string;
  password: string;
}

// Date trimise la inregistrare
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

// Raspunsul primit de la backend dupa login
export interface LoginResponse {
  token: string;
  userId: number;
  role: Role;
  fullName: string;
}

// Raspunsul primit de la backend dupa register
export interface RegisterResponse {
  userId: number;
  role: Role;
  fullName: string;
}

// Datele utilizatorului autentificat, stocate in memorie
export interface AuthUser {
  token: string;
  userId: number;
  role: Role;
  fullName: string;
  email: string;
}

export interface AuthState {
  token: string | null;
  userId: number | null;
  role: Role | null;
  fullName: string | null;
  email: string | null;
  isAuthenticated: boolean;
}