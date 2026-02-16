"use client";
import useSWR from "swr";

export interface QuoteItem {
  id?: string;
  sortOrder: number;
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
}

export interface Document {
  id: string;
  documentNo: string;
  title: string;
  issueDate: string;
  validUntil: string | null;
  status: string;
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
  company?: { id: string; name: string };
  person?: { id: string; name: string };
  office?: { id: string; name: string };
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentsResponse {
  success: boolean;
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DocumentResponse {
  success: boolean;
  data: Document;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  return res.json();
};

export function useDocuments(page = 1, search = "", status = "") {
  const query = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(search && { search }),
    ...(status && { status }),
  });

  const { data, error, isLoading, mutate } = useSWR<DocumentsResponse>(
    `/api/documents?${query}`,
    fetcher
  );

  return {
    documents: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error || (data && !data.success),
    mutate,
  };
}

export function useDocument(id: string) {
  const { data, error, isLoading, mutate } = useSWR<DocumentResponse>(
    id ? `/api/documents/${id}` : null,
    fetcher
  );

  return {
    document: data?.data,
    isLoading,
    isError: !!error || (data && !data.success),
    mutate,
  };
}

export async function generateDocumentNumber(): Promise<string> {
  const res = await fetch("/api/documents/generate-number");
  const data = await res.json();
  return data.data?.documentNo || "";
}

export async function createDocument(data: Partial<Document> & { items?: QuoteItem[] }) {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateDocument(
  id: string,
  data: Partial<Document> & { items?: QuoteItem[] }
) {
  const res = await fetch(`/api/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteDocument(id: string) {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });
  return res.json();
}
