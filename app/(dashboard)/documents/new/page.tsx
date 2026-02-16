import { Box, Typography } from "@mui/material";
import DocumentForm from "@/components/documents/DocumentForm";

export default function NewDocumentPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        見積もりの新規作成
      </Typography>
      <DocumentForm />
    </Box>
  );
}
