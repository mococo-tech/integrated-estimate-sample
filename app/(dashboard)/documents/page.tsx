"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useDocuments, deleteDocument } from "@/hooks/useDocuments";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import dayjs from "dayjs";

const statusConfig: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  draft: { label: "下書き", color: "default" },
  issued: { label: "発行済", color: "warning" },
  accepted: { label: "承認", color: "success" },
  rejected: { label: "却下", color: "error" },
};

export default function DocumentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { documents, pagination, isLoading, isError, mutate } = useDocuments(page + 1);

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteDocument(deleteId);
    if (result.success) {
      mutate();
    } else {
      alert(result.error?.message || "削除に失敗しました");
    }
    setDeleteId(null);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <Typography color="error">データの取得に失敗しました</Typography>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">見積もり管理</Typography>
        <Button
          component={Link}
          href="/documents/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          新規作成
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>見積番号</TableCell>
                <TableCell>件名</TableCell>
                <TableCell>顧客</TableCell>
                <TableCell>発行日</TableCell>
                <TableCell align="right">合計金額</TableCell>
                <TableCell align="center">状態</TableCell>
                <TableCell align="center" width={150}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    見積もりがありません
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>{doc.documentNo}</TableCell>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{doc.company?.name}</TableCell>
                    <TableCell>{dayjs(doc.issueDate).format("YYYY/MM/DD")}</TableCell>
                    <TableCell align="right">
                      {doc.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={statusConfig[doc.status]?.label || doc.status}
                        color={statusConfig[doc.status]?.color || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/documents/${doc.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/documents/${doc.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(doc.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination && pagination.totalPages > 1 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pagination.limit}
            rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="見積もりの削除"
        message="この見積もりを削除してもよろしいですか？"
        confirmText="削除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
