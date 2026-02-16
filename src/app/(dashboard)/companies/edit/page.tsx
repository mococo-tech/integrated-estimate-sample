"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useCompany } from "@/hooks/useCompanies";
import CompanyForm from "@/components/features/companies/CompanyForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function EditCompanyContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { company, isLoading, isError } = useCompany(id || "");

  if (!id) {
    return <Typography color="error">IDが指定されていません</Typography>;
  }

  if (isLoading) return <LoadingSpinner />;
  if (isError || !company) {
    return <Typography color="error">顧客が見つかりません</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        顧客の編集
      </Typography>
      <CompanyForm company={company} isEdit />
    </Box>
  );
}

export default function EditCompanyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EditCompanyContent />
    </Suspense>
  );
}
