"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { QuoteItem } from "@/hooks/useDocuments";

interface QuoteItemTableProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
}

export default function QuoteItemTable({ items, onChange }: QuoteItemTableProps) {
  const handleItemChange = (
    index: number,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      amount:
        field === "quantity" || field === "unitPrice"
          ? (field === "quantity" ? Number(value) : newItems[index].quantity) *
            (field === "unitPrice" ? Number(value) : newItems[index].unitPrice)
          : newItems[index].amount,
    };
    onChange(newItems);
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        sortOrder: items.length + 1,
        itemName: "",
        description: null,
        quantity: 1,
        unit: "式",
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>品名</TableCell>
              <TableCell>仕様・説明</TableCell>
              <TableCell width={80} align="right">数量</TableCell>
              <TableCell width={60}>単位</TableCell>
              <TableCell width={120} align="right">単価</TableCell>
              <TableCell width={120} align="right">金額</TableCell>
              <TableCell width={50}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <TextField
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                    fullWidth
                    size="small"
                    required
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.description || ""}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    fullWidth
                    size="small"
                    slotProps={{ htmlInput: { min: 1, style: { textAlign: "right" } } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.unit || ""}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                    fullWidth
                    size="small"
                    slotProps={{ htmlInput: { min: 0, style: { textAlign: "right" } } }}
                  />
                </TableCell>
                <TableCell align="right">
                  {(item.quantity * item.unitPrice).toLocaleString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 1 }}>
        <Button startIcon={<AddIcon />} onClick={addItem} size="small">
          行を追加
        </Button>
      </Box>
    </Box>
  );
}
