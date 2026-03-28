export interface User {
  uid: string;
  name: string;
  phone?: string;
  businessName: string;
  createdAt: any;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  stockQuantity: number;
  buyingPrice: number;
  sellingPrice: number;
  lowStockThreshold?: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  userId: string;
  customerId?: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa';
  items: SaleItem[];
  date: any;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: any;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  date: any;
}
