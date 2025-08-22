
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Users, Search, LayoutGrid, List } from 'lucide-react';
import { organizationSpecificApi } from '@/api/organization.api';
import { useToast } from '@/hooks/use-toast';

interface EnrollableOrganization {
  organizationId: string;
  name: string;
  type: 'INSTITUTE' | 'GLOBAL';
  isPublic: boolean;
  instituteId: string | null;
}

interface EnrollOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnrollOrganizationDialog = ({ open, onOpenChange }: EnrollOrganizationDialogProps) => {
  const [organizations, setOrganizations] = useState<EnrollableOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [enrollmentKey, setEnrollmentKey] = useState('');
  const [enrollingOrg, setEnrollingOrg] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrganizations = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search })
      };
      
      const response = await organizationSpecificApi.get<{
        data: EnrollableOrganization[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
        meta: {
          sortBy: string;
          sortOrder: string;
        };
      }>('/organization/api/v1/organizations', params);
      
      setOrganizations(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrganizations(currentPage, searchTerm);
    }
  }, [open, currentPage, searchTerm]);

  const handleEnroll = async (organizationId: string) => {
    setEnrollingOrg(organizationId);
    
    try {
      const response = await organizationSpecificApi.post('/organization/api/v1/organizations/enroll', {
        organizationId,
        ...(enrollmentKey && { enrollmentKey })
      });
      
      toast({
        title: "Success",
        description: `Successfully enrolled in ${response.organization.name}`,
      });
      
      setEnrollmentKey('');
      // Don't close dialog to allow enrolling in multiple organizations
    } catch (error) {
      console.error('Error enrolling in organization:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in organization",
        variant: "destructive",
      });
    } finally {
      setEnrollingOrg(null);
    }
  };

  const OrganizationCard = ({ org }: { org: EnrollableOrganization }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {org.type}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant={org.isPublic ? 'default' : 'secondary'}>
              {org.isPublic ? 'Public' : 'Private'}
            </Badge>
            {org.instituteId && (
              <Badge variant="outline" className="text-xs">
                {org.instituteId}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Type:</span>
            <span className="text-muted-foreground">{org.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Visibility:</span>
            <span className="text-muted-foreground">
              {org.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          {org.instituteId && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Institute:</span>
              <span className="text-muted-foreground">{org.instituteId}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            onClick={() => handleEnroll(org.organizationId)}
            className="w-full"
            disabled={enrollingOrg === org.organizationId}
          >
            {enrollingOrg === org.organizationId ? "Enrolling..." : "Enroll"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Enroll in Organizations
          </DialogTitle>
          <DialogDescription>
            Browse and enroll in available organizations
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Search and View Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-1" />
                Table
              </Button>
            </div>
          </div>

          {/* Enrollment Key Input */}
          <div className="space-y-2">
            <Label htmlFor="enrollmentKey">Enrollment Key (Optional)</Label>
            <Input
              id="enrollmentKey"
              placeholder="Enter enrollment key if required"
              value={enrollmentKey}
              onChange={(e) => setEnrollmentKey(e.target.value)}
            />
          </div>

          {/* Organizations Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {viewMode === 'card' ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {organizations.map((org) => (
                      <OrganizationCard key={org.organizationId} org={org} />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Institute</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow key={org.organizationId}>
                          <TableCell>
                            <div className="font-medium">{org.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{org.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.isPublic ? 'default' : 'secondary'}>
                              {org.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {org.instituteId ? (
                              <Badge variant="outline" className="text-xs">
                                {org.instituteId}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleEnroll(org.organizationId)}
                              size="sm"
                              disabled={enrollingOrg === org.organizationId}
                            >
                              {enrollingOrg === org.organizationId ? "Enrolling..." : "Enroll"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {organizations.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Organizations Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? 'No organizations match your search criteria'
                        : 'No organizations available for enrollment'
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollOrganizationDialog;
