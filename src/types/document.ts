import type { Company } from "./company";

// 見積もり明細
export interface QuoteItem {
  id?: string;
  sortOrder: number;
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

// 見積もりステータス
export type DocumentStatus = "draft" | "issued" | "accepted" | "rejected";

export const DocumentStatusLabels: Record<
  DocumentStatus,
  { label: string; color: "default" | "warning" | "success" | "error" }
> = {
  draft: { label: "下書き", color: "default" },
  issued: { label: "発行済", color: "warning" },
  accepted: { label: "承認", color: "success" },
  rejected: { label: "却下", color: "error" },
};

// 見積もり
export interface Document {
  id: string;
  documentNo: string;
  title: string;
  issueDate: string;
  validUntil: string | null;
  status: DocumentStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  note: string | null;
  paymentTerms: string | null;
  deliveryDate: string | null;
  deliveryPlace: string | null;
  companyId: string;
  personId: string;
  officeId: string;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
  company?: Company;
  person?: { id: string; name: string };
  office?: { id: string; name: string };
}

// 見積もり作成/更新用
export interface DocumentInput {
  documentNo: string;
  title: string;
  issueDate?: string;
  validUntil?: string;
  status?: DocumentStatus;
  taxRate?: number;
  note?: string;
  paymentTerms?: string;
  deliveryDate?: string;
  deliveryPlace?: string;
  companyId: string;
  items?: Omit<QuoteItem, "id">[];
}
