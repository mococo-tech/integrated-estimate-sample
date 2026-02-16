"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import { useDocument } from "@/hooks/useDocuments";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import dayjs from "dayjs";

const statusConfig: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  draft: { label: "下書き", color: "default" },
  issued: { label: "発行済", color: "warning" },
  accepted: { label: "承認", color: "success" },
  rejected: { label: "却下", color: "error" },
};

function DocumentDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { document: doc, isLoading, isError } = useDocument(id || "");

  if (!id) {
    return <Typography color="error">IDが指定されていません</Typography>;
  }

  if (isLoading) return <LoadingSpinner />;
  if (isError || !doc) {
    return <Typography color="error">見積もりが見つかりません</Typography>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }} className="no-print">
        <Typography variant="h5">見積もり詳細</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            印刷
          </Button>
          <Button
            component={Link}
            href={`/documents/edit?id=${id}`}
            variant="contained"
            startIcon={<EditIcon />}
          >
            編集
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                御 見 積 書
              </Typography>
              <Typography variant="h6">
                {doc.company?.name} 御中
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2">見積番号: {doc.documentNo}</Typography>
              <Typography variant="body2">
                発行日: {dayjs(doc.issueDate).format("YYYY年MM月DD日")}
              </Typography>
              {doc.validUntil && (
                <Typography variant="body2">
                  有効期限: {dayjs(doc.validUntil).format("YYYY年MM月DD日")}
                </Typography>
              )}
              <Box sx={{ mt: 1 }} className="no-print">
                <Chip
                  label={statusConfig[doc.status]?.label || doc.status}
                  color={statusConfig[doc.status]?.color || "default"}
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ bgcolor: "grey.100", p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="body1">
              下記の通り、お見積もり申し上げます。
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              合計金額: ¥{doc.totalAmount.toLocaleString()}
              <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                (税込)
              </Typography>
            </Typography>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            件名: {doc.title}
          </Typography>

          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell width={40}>#</TableCell>
                  <TableCell>品名</TableCell>
                  <TableCell>仕様・説明</TableCell>
                  <TableCell align="right">数量</TableCell>
                  <TableCell>単位</TableCell>
                  <TableCell align="right">単価</TableCell>
                  <TableCell align="right">金額</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doc.items?.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell align="right">{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Box sx={{ minWidth: 250 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography>小計:</Typography>
                <Typography>¥{doc.subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography>消費税 ({doc.taxRate}%):</Typography>
                <Typography>¥{doc.taxAmount.toLocaleString()}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                <Typography variant="h6">合計:</Typography>
                <Typography variant="h6">¥{doc.totalAmount.toLocaleString()}</Typography>
              </Box>
            </Box>
          </Box>

          {(doc.paymentTerms || doc.deliveryDate || doc.deliveryPlace || doc.note) && (
            <>
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={2}>
                {doc.paymentTerms && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">支払条件</Typography>
                    <Typography>{doc.paymentTerms}</Typography>
                  </Grid>
                )}
                {doc.deliveryDate && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">納期</Typography>
                    <Typography>{doc.deliveryDate}</Typography>
                  </Grid>
                )}
                {doc.deliveryPlace && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">納入場所</Typography>
                    <Typography>{doc.deliveryPlace}</Typography>
                  </Grid>
                )}
                {doc.note && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">備考</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{doc.note}</Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" color="text.secondary">発行元</Typography>
            <Typography variant="h6">{doc.office?.name}</Typography>
            <Typography variant="body2">担当: {doc.person?.name}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function DocumentDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DocumentDetailContent />
    </Suspense>
  );
}
