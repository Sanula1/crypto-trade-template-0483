
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Shield } from 'lucide-react';
import { organizationSpecificApi } from '@/api/organization.api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AssignRoleDialog from './AssignRoleDialog';

interface OrganizationMembersProps {
  organizationId: string;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  joinedAt: any;
}

interface MembersResponse {
  members: Member[];
  totalMembers: number;
  roleBreakdown: Record<string, number>;
}

const OrganizationMembers = ({ organizationId }: OrganizationMembersProps) => {
  const [membersData, setMembersData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await organizationSpecificApi.get<MembersResponse>(
        `/organization/api/v1/organizations/${organizationId}/management/members`
      );
      setMembersData(response);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load organization members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  const handleAssignRole = (member: Member) => {
    setSelectedMember(member);
    setShowAssignRoleDialog(true);
  };

  const handleAssignRoleSuccess = () => {
    setShowAssignRoleDialog(false);
    setSelectedMember(null);
    fetchMembers(); // Refresh the members list
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'PRESIDENT':
        return 'default';
      case 'ADMIN':
        return 'destructive';
      case 'MODERATOR':
        return 'secondary';
      case 'MEMBER':
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!membersData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Members Data</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Unable to load organization members at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Members</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage members and their roles in the organization
          </p>
        </div>
      </div>

      {/* Role Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(membersData.roleBreakdown).map(([role, count]) => (
          <Card key={role}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{role}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({membersData.totalMembers})
          </CardTitle>
          <CardDescription>
            All organization members and their current roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {user?.role === 'OrganizationManager' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersData.members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">ID: {member.userId}</div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isVerified ? "default" : "secondary"}>
                      {member.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  {user?.role === 'OrganizationManager' && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignRole(member)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign Role
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      {selectedMember && (
        <AssignRoleDialog
          open={showAssignRoleDialog}
          onOpenChange={setShowAssignRoleDialog}
          member={selectedMember}
          organizationId={organizationId}
          onSuccess={handleAssignRoleSuccess}
        />
      )}
    </div>
  );
};

export default OrganizationMembers;
