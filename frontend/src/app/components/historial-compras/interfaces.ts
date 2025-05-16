export interface Purchase {
  id: string;
  eventId?: string;
  eventName: string;
  location: string;
  purchaseDate: Date;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  status: 'completed' | 'pending' | 'canceled';
  paymentMethod?: {
    id: number;
    type: string;
    owner: string;
  };
}