"use client";
import useSWR from "swr";

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

interface CompaniesResponse {
  success: boolean;
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CompanyResponse {
  success: boolean;
  data: Company;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  return res.json();
};

export function useCompanies(page = 1, search = "") {
  const query = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(search && { search }),
  });

  const { data, error, isLoading, mutate } = useSWR<CompaniesResponse>(
    `/api/companies?${query}`,
    fetcher
  );

  return {
    companies: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error || (data && !data.success),
    mutate,
  };
}

export function useCompany(id: string) {
  const { data, error, isLoading, mutate } = useSWR<CompanyResponse>(
    id ? `/api/companies/${id}` : null,
    fetcher
  );

  return {
    company: data?.data,
    isLoading,
    isError: !!error || (data && !data.success),
    mutate,
  };
}

export async function createCompany(data: Partial<Company>) {
  const res = await fetch("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCompany(id: string, data: Partial<Company>) {
  const res = await fetch(`/api/companies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCompany(id: string) {
  const res = await fetch(`/api/companies/${id}`, {
    method: "DELETE",
  });
  return res.json();
}
