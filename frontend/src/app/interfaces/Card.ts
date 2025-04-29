export default interface Card {
  id?: number;
  id_usuario?: number;
  tipo: string;
  titular?: string;
  pan: number;
  cvc?: number;
  fecha_expiracion: string;
  created_at?: string;
  divisa: string
}
