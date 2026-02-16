import { Box, Typography } from "@mui/material";
import CompanyForm from "@/components/companies/CompanyForm";

export default function NewCompanyPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        顧客の新規登録
      </Typography>
      <CompanyForm />
    </Box>
  );
}
