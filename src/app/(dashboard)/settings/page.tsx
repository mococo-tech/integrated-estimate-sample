"use client";
import Link from "next/link";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        設定
      </Typography>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/settings/office">
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary="自社情報"
                  secondary="会社名、住所、連絡先などの設定"
                />
                <ChevronRightIcon />
              </ListItemButton>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
