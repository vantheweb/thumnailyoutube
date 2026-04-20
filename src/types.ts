export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isApproved: boolean;
  subscribedUntil: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Plan {
  id: string;
  name: string;
  months: number;
  price: string;
}

export const PLANS: Plan[] = [
  { id: '1m', name: '1 Tháng', months: 1, price: '99,000đ' },
  { id: '3m', name: '3 Tháng', months: 3, price: '249,000đ' },
  { id: '6m', name: '6 Tháng', months: 6, price: '449,000đ' },
  { id: '12m', name: '12 Tháng', months: 12, price: '799,000đ' },
];
