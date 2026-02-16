"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useCompanies, deleteCompany } from "@/hooks/useCompanies";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CompaniesPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { companies, pagination, isLoading, isError, mutate } = useCompanies(
    page + 1,
    search
  );

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteCompany(deleteId);
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
        <Typography variant="h5">顧客管理</Typography>
        <Button
          component={Link}
          href="/companies/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          新規登録
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              placeholder="会社名・住所・担当者名で検索"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button variant="contained" onClick={handleSearch}>
              検索
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>会社名</TableCell>
                <TableCell>住所</TableCell>
                <TableCell>電話番号</TableCell>
                <TableCell>担当者</TableCell>
                <TableCell align="center" width={120}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    顧客が登録されていません
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.address}</TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>{company.contactName}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/companies/edit?id=${company.id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(company.id)}
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
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count}`
            }
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="顧客の削除"
        message="この顧客を削除してもよろしいですか？"
        confirmText="削除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
