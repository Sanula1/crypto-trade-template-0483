import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentData {
  id: string;
  userId: string;
  paymentAmount: string;
  paymentMethod: 'BANK_TRANSFER' | 'ONLINE_PAYMENT' | 'CASH_DEPOSIT';
  paymentReference: string | null;
  paymentSlipUrl: string | null;
  paymentSlipFilename: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  paymentDate: string;
  paymentMonth: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentResponse {
  payments: PaymentData[];
  total: number;
  page: number;
  limit: number;
}

const Payment = () => {
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('PENDING');

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/payment/my-payments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load payments');
      }

      const data: PaymentResponse = await response.json();
      setPaymentData(data.payments || []);
      toast.success('Payments loaded successfully');
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter payments by status
  const filterPaymentsByStatus = (status: string) => {
    return paymentData.filter(payment => payment.status === status);
  };

  // Get counts for each tab
  const pendingCount = filterPaymentsByStatus('PENDING').length;
  const verifiedCount = filterPaymentsByStatus('VERIFIED').length;
  const rejectedCount = filterPaymentsByStatus('REJECTED').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const PaymentTable = ({ payments }: { payments: PaymentData[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No payments found for this status
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                <TableCell>{payment.paymentMonth}</TableCell>
                <TableCell>{formatAmount(payment.paymentAmount)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {payment.paymentMethod.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{payment.paymentReference || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {payment.notes || 'No notes'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {payment.paymentSlipUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(payment.paymentSlipUrl!, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Payments</h1>
          <p className="text-muted-foreground">View and manage your payment history</p>
        </div>
        <Button onClick={loadPayments} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Load Payments'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your payments organized by status. Click "Load Payments" to fetch the latest data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="PENDING" className="flex items-center gap-2">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="VERIFIED" className="flex items-center gap-2">
                Verified
                {verifiedCount > 0 && (
                  <Badge variant="default" className="ml-1">
                    {verifiedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="REJECTED" className="flex items-center gap-2">
                Rejected
                {rejectedCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {rejectedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="PENDING" className="mt-6">
              <PaymentTable payments={filterPaymentsByStatus('PENDING')} />
            </TabsContent>

            <TabsContent value="VERIFIED" className="mt-6">
              <PaymentTable payments={filterPaymentsByStatus('VERIFIED')} />
            </TabsContent>

            <TabsContent value="REJECTED" className="mt-6">
              <PaymentTable payments={filterPaymentsByStatus('REJECTED')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;