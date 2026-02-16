"use client";
import { use } from "react";
import { Box, Typography } from "@mui/material";
import { useDocument } from "@/hooks/useDocuments";
import DocumentForm from "@/components/documents/DocumentForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { document, isLoading, isError } = useDocument(id);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !document) {
    return <Typography color="error">見積もりが見つかりません</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        見積もりの編集
      </Typography>
      <DocumentForm document={document} isEdit />
    </Box>
  );
}
