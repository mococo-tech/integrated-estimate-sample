// 顧客企業
export interface Company {
  id: string;
  name: string;
  zipCode: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  contactName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// 顧客作成/更新用
export interface CompanyInput {
  name: string;
  zipCode?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  contactName?: string;
  note?: string;
}
