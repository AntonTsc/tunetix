export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  image_path?: string;
  role?: string;
  // Añade otras propiedades según necesites
}

export interface ServerResponse {
  success: boolean;
  status?: string;
  message?: string;
  data?: any;
}
