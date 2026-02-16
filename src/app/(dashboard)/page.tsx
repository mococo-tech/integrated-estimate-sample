"use client";
import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import PendingIcon from "@mui/icons-material/Pending";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: companiesData } = useSWR("/api/companies?limit=0", fetcher);
  const { data: documentsData } = useSWR("/api/documents?limit=0", fetcher);
  const { data: recentDocsData } = useSWR("/api/documents?limit=5", fetcher);

  const companyCount = companiesData?.pagination?.total || 0;
  const documentCount = documentsData?.pagination?.total || 0;
  const draftCount =
    documentsData?.data?.filter((d: { status: string }) => d.status === "draft").length || 0;

  const statusLabels: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
    draft: { label: "下書き", color: "default" },
    issued: { label: "発行済", color: "warning" },
    accepted: { label: "承認", color: "success" },
    rejected: { label: "却下", color: "error" },
  };

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="顧客数"
            value={companyCount}
            icon={<BusinessIcon sx={{ color: "white" }} />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="見積もり総数"
            value={documentCount}
            icon={<DescriptionIcon sx={{ color: "white" }} />}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="下書き"
            value={draftCount}
            icon={<PendingIcon sx={{ color: "white" }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            最近の見積もり
          </Typography>
          {recentDocsData?.data?.length > 0 ? (
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
              <Box component="thead">
                <Box component="tr" sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Box component="th" sx={{ p: 1, textAlign: "left" }}>見積番号</Box>
                  <Box component="th" sx={{ p: 1, textAlign: "left" }}>件名</Box>
                  <Box component="th" sx={{ p: 1, textAlign: "left" }}>顧客</Box>
                  <Box component="th" sx={{ p: 1, textAlign: "right" }}>金額</Box>
                  <Box component="th" sx={{ p: 1, textAlign: "center" }}>状態</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {recentDocsData.data.map((doc: {
                  id: string;
                  documentNo: string;
                  title: string;
                  company: { name: string };
                  totalAmount: number;
                  status: string;
                }) => (
                  <Box
                    component="tr"
                    key={doc.id}
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                  >
                    <Box component="td" sx={{ p: 1 }}>{doc.documentNo}</Box>
                    <Box component="td" sx={{ p: 1 }}>{doc.title}</Box>
                    <Box component="td" sx={{ p: 1 }}>{doc.company?.name}</Box>
                    <Box component="td" sx={{ p: 1, textAlign: "right" }}>
                      {doc.totalAmount.toLocaleString()}
                    </Box>
                    <Box component="td" sx={{ p: 1, textAlign: "center" }}>
                      <Chip
                        label={statusLabels[doc.status]?.label || doc.status}
                        color={statusLabels[doc.status]?.color || "default"}
                        size="small"
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              まだ見積もりがありません
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
