export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  matricule: number;
  password: string;
  role: string;
  projet:string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  matricule: number;
  role: string;
  projet:string;
}

