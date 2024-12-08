import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useOrderStore } from '../../../store/orderStore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

export default function UserOrdersPage() {
  const { orders, fetchUserOrders, isLoading, error } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        await fetchUserOrders();
      } catch (error) {
        console.error('Error fetching user orders:', error);
      }
    };
    loadOrders();
  }, [fetchUserOrders]);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const renderOrderItems = (items: any) => {
    try {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      return parsedItems.map((item: any, index: number) => (
        <ListItem key={index}>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  {item.quantity}x {item.title}
                </Typography>
                <Typography variant="subtitle1">
                  ${item.price * item.quantity}
                </Typography>
              </Box>
            }
            secondary={
              item.delivery_content && (
                <Box display="flex" alignItems="center" mt={1}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {item.delivery_type}: {item.delivery_content}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyToClipboard(item.delivery_content)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              )
            }
          />
        </ListItem>
      ));
    } catch (error) {
      console.error('Error parsing items:', error);
      return <Typography color="error">Error displaying items</Typography>;
    }
  };

  const renderDeliveryMessages = (messages: string) => {
    try {
      const parsedMessages = JSON.parse(messages);
      return parsedMessages.map((msg: any, index: number) => (
        <ListItem key={index}>
          <ListItemText
            primary={msg.message}
            secondary={new Date(msg.timestamp).toLocaleString()}
          />
        </ListItem>
      ));
    } catch (error) {
      return null;
    }
  };

  if (isLoading) {
    return <Typography>Loading your orders...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      {successMessage && (
        <Typography color="success" sx={{ mb: 2 }}>
          {successMessage}
        </Typography>
      )}

      <Grid container spacing={2}>
        {orders.map((order: any) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 6 }
              }}
              onClick={() => handleOrderClick(order)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order #{order.order_number}
                </Typography>

                <Typography color="textSecondary" gutterBottom>
                  {new Date(order.created).toLocaleDateString()}
                </Typography>

                <Box sx={{ my: 1 }}>
                  {renderOrderItems(order.items)}
                </Box>

                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  Total: ${order.total}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={order.payment_status}
                    color={order.payment_status === 'completed' ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {order.delivery_status === 'delivered' && (
                    <Chip
                      label="Content Available"
                      color="success"
                      size="small"
                      icon={<DownloadIcon />}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={!!selectedOrder}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Order Details #{selectedOrder.order_number}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle2" gutterBottom>
                Order Date: {new Date(selectedOrder.created).toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Order Items:
              </Typography>
              <List>
                {renderOrderItems(selectedOrder.items)}
              </List>

              <Divider sx={{ my: 2 }} />

              {selectedOrder.delivery_messages && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Delivery Messages:
                  </Typography>
                  <List>
                    {renderDeliveryMessages(selectedOrder.delivery_messages)}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">
                  Total: ${selectedOrder.total}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
