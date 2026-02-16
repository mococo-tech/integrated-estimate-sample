"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useDocument } from "@/hooks/useDocuments";
import DocumentForm from "@/components/features/documents/DocumentForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function EditDocumentContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { document, isLoading, isError } = useDocument(id || "");

  if (!id) {
    return <Typography color="error">IDが指定されていません</Typography>;
  }

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

export default function EditDocumentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EditDocumentContent />
    </Suspense>
  );
}
