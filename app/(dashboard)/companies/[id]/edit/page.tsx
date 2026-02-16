"use client";
import { use } from "react";
import { Box, Typography } from "@mui/material";
import { useCompany } from "@/hooks/useCompanies";
import CompanyForm from "@/components/companies/CompanyForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { company, isLoading, isError } = useCompany(id);

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
