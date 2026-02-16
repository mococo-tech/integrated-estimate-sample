"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import {
  Document,
  QuoteItem,
  createDocument,
  updateDocument,
  generateDocumentNumber,
} from "@/hooks/useDocuments";
import { useCompanies } from "@/hooks/useCompanies";
import QuoteItemTable from "./QuoteItemTable";

interface DocumentFormProps {
  document?: Document;
  isEdit?: boolean;
}

const statusOptions = [
  { value: "draft", label: "下書き" },
  { value: "issued", label: "発行済" },
  { value: "accepted", label: "承認" },
  { value: "rejected", label: "却下" },
];

export default function DocumentForm({ document, isEdit = false }: DocumentFormProps) {
  const router = useRouter();
  const { companies } = useCompanies(1, "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    documentNo: document?.documentNo || "",
    title: document?.title || "",
    companyId: document?.companyId || "",
    status: document?.status || "draft",
    taxRate: document?.taxRate || 10,
    note: document?.note || "",
    paymentTerms: document?.paymentTerms || "請求書発行後30日以内",
    deliveryDate: document?.deliveryDate || "",
    deliveryPlace: document?.deliveryPlace || "",
  });

  const [issueDate, setIssueDate] = useState<Dayjs | null>(
    document?.issueDate ? dayjs(document.issueDate) : dayjs()
  );
  const [validUntil, setValidUntil] = useState<Dayjs | null>(
    document?.validUntil ? dayjs(document.validUntil) : dayjs().add(30, "day")
  );

  const [items, setItems] = useState<QuoteItem[]>(
    document?.items || [
      { sortOrder: 1, itemName: "", description: null, quantity: 1, unit: "式", unitPrice: 0, amount: 0 },
    ]
  );

  // 新規作成時に見積番号を自動生成
  useEffect(() => {
    if (!isEdit && !formData.documentNo) {
      generateDocumentNumber().then((no) => {
        if (no) setFormData((prev) => ({ ...prev, documentNo: no }));
      });
    }
  }, [isEdit, formData.documentNo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 金額計算
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = Math.floor(subtotal * formData.taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        issueDate: issueDate?.toISOString(),
        validUntil: validUntil?.toISOString(),
        items: items.map((item, index) => ({
          ...item,
          sortOrder: index + 1,
          amount: item.quantity * item.unitPrice,
        })),
      };

      const result = isEdit && document
        ? await updateDocument(document.id, payload)
        : await createDocument(payload);

      if (!result.success) {
        setError(result.error?.message || "エラーが発生しました");
        return;
      }

      router.push("/documents");
      router.refresh();
    } catch {
      setError("サーバーとの通信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  name="documentNo"
                  label="見積番号"
                  value={formData.documentNo}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={isEdit}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="発行日"
                  value={issueDate}
                  onChange={setIssueDate}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="有効期限"
                  value={validUntil}
                  onChange={setValidUntil}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  name="status"
                  label="状態"
                  value={formData.status}
                  onChange={handleChange}
                  select
                  fullWidth
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="companyId"
                  label="顧客"
                  value={formData.companyId}
                  onChange={handleChange}
                  select
                  fullWidth
                  required
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="title"
                  label="件名"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              明細
            </Typography>
            <QuoteItemTable items={items} onChange={setItems} />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ minWidth: 250 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography>小計:</Typography>
                  <Typography>{subtotal.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography>消費税:</Typography>
                    <TextField
                      name="taxRate"
                      type="number"
                      value={formData.taxRate}
                      onChange={handleChange}
                      size="small"
                      sx={{ width: 60 }}
                      slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    />
                    <Typography>%</Typography>
                  </Box>
                  <Typography>{taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  <Typography variant="h6">合計:</Typography>
                  <Typography variant="h6">{totalAmount.toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              備考・条件
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="paymentTerms"
                  label="支払条件"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="deliveryDate"
                  label="納期"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="deliveryPlace"
                  label="納入場所"
                  value={formData.deliveryPlace}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="note"
                  label="備考"
                  value={formData.note}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => router.back()} disabled={loading}>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {isEdit ? "更新" : "作成"}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
