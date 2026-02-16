"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Company, createCompany, updateCompany } from "@/hooks/useCompanies";

interface CompanyFormProps {
  company?: Company;
  isEdit?: boolean;
}

export default function CompanyForm({ company, isEdit = false }: CompanyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: company?.name || "",
    zipCode: company?.zipCode || "",
    address: company?.address || "",
    phone: company?.phone || "",
    fax: company?.fax || "",
    email: company?.email || "",
    contactName: company?.contactName || "",
    note: company?.note || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = isEdit && company
        ? await updateCompany(company.id, formData)
        : await createCompany(formData);

      if (!result.success) {
        setError(result.error?.message || "エラーが発生しました");
        return;
      }

      router.push("/companies");
      router.refresh();
    } catch {
      setError("サーバーとの通信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="name"
                label="会社名"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="zipCode"
                label="郵便番号"
                value={formData.zipCode}
                onChange={handleChange}
                fullWidth
                placeholder="123-4567"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                name="address"
                label="住所"
                value={formData.address}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="phone"
                label="電話番号"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="fax"
                label="FAX番号"
                value={formData.fax}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="email"
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="contactName"
                label="担当者名"
                value={formData.contactName}
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

          <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {isEdit ? "更新" : "登録"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
