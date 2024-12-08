import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Typography,
  Chip,
} from '@mui/material';

interface OrdersFiltersProps {
  paymentStatus: string;
  deliveryStatus: string;
  onPaymentStatusChange: (status: string) => void;
  onDeliveryStatusChange: (status: string) => void;
  orderCounts: {
    total: number;
    pending: number;
    completed: number;
    abandoned: number;
    delivered: number;
    undelivered: number;
  };
}

export default function OrdersFilters({
  paymentStatus,
  deliveryStatus,
  onPaymentStatusChange,
  onDeliveryStatusChange,
  orderCounts,
}: OrdersFiltersProps) {
  const handlePaymentStatusChange = (event: SelectChangeEvent) => {
    onPaymentStatusChange(event.target.value);
  };

  const handleDeliveryStatusChange = (event: SelectChangeEvent) => {
    onDeliveryStatusChange(event.target.value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Total Orders: <Chip label={orderCounts.total} size="small" />
        </Typography>
        <Typography variant="body2">
          Pending: <Chip label={orderCounts.pending} size="small" color="warning" />
        </Typography>
        <Typography variant="body2">
          Completed: <Chip label={orderCounts.completed} size="small" color="success" />
        </Typography>
        <Typography variant="body2">
          Abandoned: <Chip label={orderCounts.abandoned} size="small" color="error" />
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Payment Status</InputLabel>
          <Select
            value={paymentStatus}
            label="Payment Status"
            onChange={handlePaymentStatusChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="abandoned">Abandoned</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Delivery Status</InputLabel>
          <Select
            value={deliveryStatus}
            label="Delivery Status"
            onChange={handleDeliveryStatusChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
