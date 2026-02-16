"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Office {
  id: string;
  name: string;
  zipCode: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  bankInfo: string | null;
  invoiceNo: string | null;
}

export default function OfficeSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    zipCode: "",
    address: "",
    phone: "",
    fax: "",
    email: "",
    bankInfo: "",
    invoiceNo: "",
  });

  useEffect(() => {
    if (user?.officeId) {
      fetch(`/api/offices/${user.officeId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOffice(data.data);
            setFormData({
              name: data.data.name || "",
              zipCode: data.data.zipCode || "",
              address: data.data.address || "",
              phone: data.data.phone || "",
              fax: data.data.fax || "",
              email: data.data.email || "",
              bankInfo: data.data.bankInfo || "",
              invoiceNo: data.data.invoiceNo || "",
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user?.officeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!office) return;

    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch(`/api/offices/${office.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "エラーが発生しました");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("サーバーとの通信に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        自社情報
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                保存しました
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

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  name="zipCode"
                  label="郵便番号"
                  value={formData.zipCode}
                  onChange={handleChange}
                  fullWidth
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
                  name="invoiceNo"
                  label="インボイス番号"
                  value={formData.invoiceNo}
                  onChange={handleChange}
                  fullWidth
                  placeholder="T1234567890123"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  name="bankInfo"
                  label="振込先情報"
                  value={formData.bankInfo}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="銀行名、支店名、口座種別、口座番号、口座名義"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={() => router.back()} disabled={saving}>
                キャンセル
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                保存
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
