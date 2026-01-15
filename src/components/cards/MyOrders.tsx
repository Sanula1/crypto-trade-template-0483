/**
 * MyOrders - View and manage my card orders
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  CreditCard,
  Eye,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { 
  userCardApi, 
  UserIdCardOrder, 
  OrderStatus, 
  CardType as CardTypeEnum,
  PaginatedOrdersResponse 
} from '@/api/userCard.api';
import { 
  orderStatusColors, 
  orderStatusLabels, 
  cardStatusLabels,
  formatDate,
  formatDateTime,
  formatPrice 
} from '@/utils/cardHelpers';
import { toast } from '@/hooks/use-toast';
import SubmitPaymentDialog from './SubmitPaymentDialog';
import OrderDetailsDialog from './OrderDetailsDialog';

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<UserIdCardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<UserIdCardOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const fetchOrders = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const params: any = {};
      if (statusFilter !== 'all') params.orderStatus = statusFilter;

      const response = await userCardApi.getMyOrders(params, forceRefresh);
      setOrders(response.data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleViewDetails = (order: UserIdCardOrder) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleSubmitPayment = (order: UserIdCardOrder) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED:
      case OrderStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      case OrderStatus.DELIVERING:
      case OrderStatus.ON_THE_WAY:
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Orders</h2>
          <p className="text-muted-foreground">Track your ID card orders</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value={OrderStatus.PENDING_PAYMENT}>Pending Payment</SelectItem>
            <SelectItem value={OrderStatus.PAYMENT_RECEIVED}>Payment Received</SelectItem>
            <SelectItem value={OrderStatus.VERIFYING}>Verifying</SelectItem>
            <SelectItem value={OrderStatus.VERIFIED}>Verified</SelectItem>
            <SelectItem value={OrderStatus.PREPARING}>Preparing</SelectItem>
            <SelectItem value={OrderStatus.PRINTING}>Printing</SelectItem>
            <SelectItem value={OrderStatus.DELIVERING}>Delivering</SelectItem>
            <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Orders Yet</h3>
              <p className="text-muted-foreground">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{order.card?.cardName || 'Unknown Card'}</p>
                          <Badge variant="outline" className="text-xs">
                            {order.cardType}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>
                      <Badge className={`${orderStatusColors[order.orderStatus]} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(order.orderStatus)}
                        {orderStatusLabels[order.orderStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.card ? formatPrice(order.card.price) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.orderStatus === OrderStatus.PENDING_PAYMENT && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmitPayment(order)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <SubmitPaymentDialog
        order={selectedOrder}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={() => {
          setPaymentDialogOpen(false);
          fetchOrders(true);
        }}
      />
    </div>
  );
};

export default MyOrders;
