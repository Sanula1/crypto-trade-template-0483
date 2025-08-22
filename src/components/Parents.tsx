import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertTriangle,
  UserPlus,
  Search,
  Baby
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AccessControl } from '@/utils/permissions';
import { type UserRole } from '@/contexts/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { cachedApiClient } from '@/api/cachedClient';
import CreateParentForm from '@/components/forms/CreateParentForm';
import AssignParentForm from '@/components/forms/AssignParentForm';

interface Parent {
  id: string;
  userId: string;
  emergencyContact: string;
  occupation: string;
  workAddress: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    imageUrl: string;
    isActive: boolean;
  };
  children?: Child[];
}

interface Child {
  id: string;
  userId: string;
  studentId: string;
  emergencyContact: string;
  medicalConditions: string;
  allergies: string;
  bloodGroup: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl: string;
    dateOfBirth: string;
    gender: string;
    userType: string;
  };
}

const Parents = () => {
  const { user, currentInstituteId } = useAuth();
  const { toast } = useToast();
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const userRole = (user?.role || 'Student') as UserRole;
  const canEdit = AccessControl.hasPermission(userRole, 'edit-parent');
  const canDelete = AccessControl.hasPermission(userRole, 'delete-parent');
  const canCreate = userRole === 'InstituteAdmin' || userRole === 'OrganizationManager';

  const getApiHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    };
  };

  const loadParents = async () => {
    if (!currentInstituteId) {
      setError('Please select an institute first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading parents for institute:', currentInstituteId);
      
      const data = await cachedApiClient.get<Parent[]>(
        `/institutes/${currentInstituteId}/parents`,
        {
          headers: getApiHeaders()
        },
        {
          ttl: 30,
          forceRefresh: false
        }
      );

      console.log('Parents loaded successfully:', data);
      setParents(data || []);
      setFilteredParents(data || []);
    } catch (err) {
      console.error('Error loading parents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load parents';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to load parents: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, [currentInstituteId]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      const filtered = parents.filter(parent =>
        parent.user.firstName.toLowerCase().includes(term.toLowerCase()) ||
        parent.user.lastName.toLowerCase().includes(term.toLowerCase()) ||
        parent.user.email.toLowerCase().includes(term.toLowerCase()) ||
        parent.user.phone.includes(term)
      );
      setFilteredParents(filtered);
    } else {
      setFilteredParents(parents);
    }
  };

  const handleDelete = async (parentId: string) => {
    if (!currentInstituteId) {
      setError('Please select an institute first');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this parent?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await cachedApiClient.delete(`/institutes/${currentInstituteId}/parents/${parentId}`);

      setParents(prev => prev.filter(parent => parent.id !== parentId));
      setFilteredParents(prev => prev.filter(parent => parent.id !== parentId));
      toast({
        title: "Success",
        description: "Parent deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting parent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete parent';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to delete parent: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParentSubmit = (data: any) => {
    // Add the parent to the local state
    const newParent = {
      id: Date.now().toString(), // Temporary ID
      userId: data.user?.id || Date.now().toString(),
      emergencyContact: data.emergencyContact || '',
      occupation: data.occupation || '',
      workAddress: data.workAddress || '',
      user: {
        id: data.user?.id || Date.now().toString(),
        firstName: data.user?.firstName || '',
        lastName: data.user?.lastName || '',
        email: data.user?.email || '',
        phone: data.user?.phone || '',
        dateOfBirth: data.user?.dateOfBirth || '',
        gender: data.user?.gender || '',
        addressLine1: data.user?.addressLine1 || '',
        addressLine2: data.user?.addressLine2 || '',
        city: data.user?.city || '',
        district: data.user?.district || '',
        province: data.user?.province || '',
        postalCode: data.user?.postalCode || '',
        country: data.user?.country || '',
        imageUrl: data.user?.imageUrl || '',
        isActive: data.user?.isActive ?? true,
      }
    };

    setParents(prev => [...prev, newParent]);
    setFilteredParents(prev => [...prev, newParent]);
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: "Parent created successfully",
    });
  };

  const handleAssignParentSubmit = (data: any) => {
    loadParents();
    setShowAssignDialog(false);
    toast({
      title: "Success",
      description: "Parent assigned successfully",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-8 h-8" />
              Parents Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage parent information and their children
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={loadParents}
              disabled={loading || !currentInstituteId}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {canCreate && (
              <>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Parent</DialogTitle>
                      <DialogDescription>
                        Add a new parent to the system
                      </DialogDescription>
                    </DialogHeader>
                    <CreateParentForm 
                      onSubmit={handleCreateParentSubmit}
                      onCancel={() => setShowCreateDialog(false)}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Assign Parent to Child</DialogTitle>
                      <DialogDescription>
                        Link an existing parent to a student
                      </DialogDescription>
                    </DialogHeader>
                    <AssignParentForm 
                      onSubmit={handleAssignParentSubmit}
                      onCancel={() => setShowAssignDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search parents..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        </div>

        {/* Error Handling */}
        {error && (
          <div className="rounded-md border border-red-500 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mr-2 h-5 w-5 inline-block align-middle" />
            <strong className="font-bold">Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center">
            Loading parents...
          </div>
        )}

        {/* Content Display */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParents.map(parent => (
              <Card key={parent.id} className="bg-white dark:bg-gray-800 shadow-md rounded-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{parent.user.firstName} {parent.user.lastName}</CardTitle>
                  <div className="flex gap-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedParent(parent);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(parent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {parent.user.email}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {parent.user.phone}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {parent.user.addressLine1}, {parent.user.city}, {parent.user.country}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(parent.user.dateOfBirth).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      {parent.emergencyContact}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Parents;
