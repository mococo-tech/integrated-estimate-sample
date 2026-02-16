// ユーザー（担当者）
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  phone: string | null;
  position: string | null;
  isActive: boolean;
  officeId: string;
}

// 自社情報
export interface Office {
  id: string;
  name: string;
  zipCode: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  bankInfo: string | null;
  invoiceNo: string | null;
}
