"use client";
import useSWR from "swr";
import { useRouter } from "next/navigation";

interface Office {
  id: string;
  name: string;
  zipCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  position: string | null;
  isActive: boolean;
  officeId: string;
  office: Office;
}

interface AuthResponse {
  success: boolean;
  data?: { user: User };
  error?: { code: string; message: string };
}

const fetcher = async (url: string): Promise<AuthResponse> => {
  const res = await fetch(url);
  return res.json();
};

export function useAuth() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<AuthResponse>(
    "/api/auth/me",
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    mutate();
    router.push("/login");
    router.refresh();
  };

  return {
    user: data?.success ? data.data?.user : null,
    isLoading,
    isError: !!error || (data && !data.success),
    logout,
    mutate,
  };
}
