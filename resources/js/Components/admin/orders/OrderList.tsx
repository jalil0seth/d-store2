import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import OrderCard from './OrderCard';

interface OrderListProps {
  orders: any[];
  onViewDetails: (order: any) => void;
  emptyMessage?: string;
}

export default function OrderList({ orders, onViewDetails, emptyMessage = 'No orders found' }: OrderListProps) {
  if (!orders.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="textSecondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {orders.map((order) => (
        <Grid item xs={12} sm={6} md={4} key={order.id}>
          <OrderCard
            order={order}
            onViewDetails={onViewDetails}
          />
        </Grid>
      ))}
    </Grid>
  );
}
