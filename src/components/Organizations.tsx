
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Search, Plus, LayoutGrid, List, Filter, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { organizationApi, Organization, OrganizationQueryParams } from '@/api/organization.api';
import { useToast } from '@/hooks/use-toast';
import CreateOrganizationForm from '@/components/forms/CreateOrganizationForm';
import EnrollOrganizationDialog from './EnrollOrganizationDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const Organizations = () => {
  const { setSelectedOrganization, user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [publicFilter, setPublicFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const params: OrganizationQueryParams = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter as 'INSTITUTE' | 'GLOBAL';
      }

      if (publicFilter !== 'all') {
        params.isPublic = publicFilter === 'public';
      }

      const response = await organizationApi.getOrganizations(params);
      setOrganizations(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalOrganizations(response.pagination.total);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organizations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Removed automatic API call - users must click Refresh to load data

  const canCreateOrganizations = () => {
    return user?.role === 'OrganizationManager';
  };

  const canEnrollInOrganizations = () => {
    return ['Student', 'Teacher', 'InstituteAdmin'].includes(user?.role || '');
  };

  const handleSelectOrganization = (org: Organization) => {
    console.log('Select organization:', org.organizationId);
    setSelectedOrganization({
      id: org.organizationId,
      name: org.name,
      code: org.type,
      description: `${org.type} Organization`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCreateSuccess = (newOrganization: Organization) => {
    setIsCreateDialogOpen(false);
    fetchOrganizations(); // Refresh the list
    toast({
      title: 'Success',
      description: 'Organization created successfully',
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setPublicFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const OrganizationCard = ({ org }: { org: Organization }) => (
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
            onClick={() => handleSelectOrganization(org)}
            className="w-full"
          >
            Select Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            {canEnrollInOrganizations() 
              ? "View organizations in your institute" 
              : "Manage your organizations and their details"
            }
          </p>
        </div>
        <div className="flex gap-2">
          {canEnrollInOrganizations() && (
            <Button onClick={() => setShowEnrollDialog(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Enroll Organization
            </Button>
          )}
          {canCreateOrganizations() && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <CreateOrganizationForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
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

        {/* Filter Row */}
        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INSTITUTE">Institute</SelectItem>
              <SelectItem value="GLOBAL">Global</SelectItem>
            </SelectContent>
          </Select>

          <Select value={publicFilter} onValueChange={setPublicFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-');
            setSortBy(field);
            setSortOrder(order as 'asc' | 'desc');
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="type-asc">Type (A-Z)</SelectItem>
              <SelectItem value="type-desc">Type (Z-A)</SelectItem>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={resetFilters}>
            <Filter className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {viewMode === 'card' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <OrganizationCard key={org.organizationId} org={org} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Organizations List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Institute ID</TableHead>
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
                            onClick={() => handleSelectOrganization(org)}
                            size="sm"
                          >
                            Select Organization
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {organizations.length} of {totalOrganizations} organizations
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {organizations.length === 0 && !isLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No organizations found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' || publicFilter !== 'all'
                      ? 'Try adjusting your search terms or filters'
                      : 'Get started by adding your first organization'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Enroll Organization Dialog */}
      <EnrollOrganizationDialog
        open={showEnrollDialog}
        onOpenChange={setShowEnrollDialog}
      />
    </div>
  );
};

export default Organizations;
