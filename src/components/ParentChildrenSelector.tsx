
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, User, Calendar, Phone, Heart, AlertTriangle } from 'lucide-react';
import { getBaseUrl } from '@/contexts/utils/auth.api';

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

interface ParentData {
  parent: {
    userId: string;
    occupation: string;
    workplace: string;
    workPhone: string;
    educationLevel: string;
    user: any;
  };
  children: {
    asFather: Child[];
    asMother: Child[];
    asGuardian: Child[];
  };
}

const ParentChildrenSelector = () => {
  const { user, setSelectedChild } = useAuth();
  const { toast } = useToast();
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');


  const getApiHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return {};
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    };
  };

  const fetchParentChildren = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/parents/${user.id}/children`, {
        headers: getApiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Parent children data:', data);
        setParentData(data);
      } else {
        throw new Error(`Failed to fetch children: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching parent children:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch children');
      toast({
        title: "Error",
        description: "Failed to load children information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParentChildren();
  }, [user?.id]);

  const handleChildSelect = (child: Child) => {
    console.log('Selected child:', child);
    setSelectedChild(child);
    toast({
      title: "Child Selected",
      description: `Now viewing ${child.user.firstName} ${child.user.lastName}'s information`,
    });
  };

  const getAllChildren = () => {
    if (!parentData) return [];
    return [
      ...parentData.children.asFather,
      ...parentData.children.asMother,
      ...parentData.children.asGuardian
    ];
  };

  const getRelationshipLabel = (child: Child) => {
    if (parentData?.children.asFather.some(c => c.id === child.id)) return 'Father';
    if (parentData?.children.asMother.some(c => c.id === child.id)) return 'Mother';
    if (parentData?.children.asGuardian.some(c => c.id === child.id)) return 'Guardian';
    return 'Parent';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading children...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !parentData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Unable to Load Children
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Failed to load children information'}
              </p>
              <Button onClick={fetchParentChildren}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allChildren = getAllChildren();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Select Your Child
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a child to view their academic information, attendance, and results.
        </p>
      </div>

      {/* Parent Info */}
      {parentData.parent && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Parent Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Occupation</p>
                <p className="font-medium">{parentData.parent.occupation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Workplace</p>
                <p className="font-medium">{parentData.parent.workplace}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Education Level</p>
                <p className="font-medium">{parentData.parent.educationLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {allChildren.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Children Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No children are currently associated with your account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allChildren.map((child) => (
            <Card 
              key={child.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-800"
              onClick={() => handleChildSelect(child)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={child.user.imageUrl || `https://images.unsplash.com/photo-1535268647677-300dbf3d78d1`} 
                      alt={`${child.user.firstName} ${child.user.lastName}`}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(child.user.firstName, child.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {child.user.firstName} {child.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Student ID: {child.studentId}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {getRelationshipLabel(child)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Born: {formatDate(child.user.dateOfBirth)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Emergency: {child.emergencyContact}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-red-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Blood: {child.bloodGroup}
                  </span>
                </div>

                {child.medicalConditions && child.medicalConditions !== 'None' && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Medical:</strong> {child.medicalConditions}
                      </p>
                    </div>
                  </div>
                )}

                {child.allergies && child.allergies !== 'None' && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Allergies:</strong> {child.allergies}
                      </p>
                    </div>
                  </div>
                )}
                
                <Button className="w-full mt-4">
                  View {child.user.firstName}'s Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentChildrenSelector;
