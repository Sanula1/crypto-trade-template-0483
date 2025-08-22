
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, RefreshCw, Users, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DataCardView } from '@/components/ui/data-card-view';
import DataTable from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateStudentForm from '@/components/forms/CreateStudentForm';
import { cachedApiClient } from '@/api/cachedClient';
import { useApiRequest } from '@/hooks/useApiRequest';
import { getBaseUrl } from '@/contexts/utils/auth.api';

// Interface for new institute student data
interface InstituteStudent {
  id: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  phoneNumber?: string;
  imageUrl?: string;
  dateOfBirth?: string;
  userIdByInstitute?: string | null;
  fatherId?: string;
  motherId?: string;
  guardianId?: string;
}

interface InstituteStudentsResponse {
  data: InstituteStudent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Student {
  userId: string;
  fatherId: string | null;
  motherId: string | null;
  guardianId: string | null;
  studentId: string;
  emergencyContact: string;
  medicalConditions?: string;
  allergies?: string;
  bloodGroup?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    userType: string;
    dateOfBirth: string;
    gender: string;
    imageUrl?: string;
    isActive: boolean;
    subscriptionPlan: string;
    createdAt: string;
  };
}

interface StudentsResponse {
  data: Student[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    previousPage: number | null;
    nextPage: number | null;
  };
}

const Students = () => {
  const { toast } = useToast();
  const { user, selectedInstitute, selectedClass, selectedSubject } = useAuth();
  
  // State for both types of student data
  const [students, setStudents] = useState<Student[]>([]);
  const [instituteStudents, setInstituteStudents] = useState<InstituteStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const limit = 10;
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if user should use new institute-based API
  const shouldUseInstituteApi = () => {
    return user && (user.role === 'InstituteAdmin' || user.role === 'Teacher') && selectedInstitute;
  };

  const getApiHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    };
  };

  // Use API request hook for creating students with duplicate prevention
  const createStudentRequest = useApiRequest(
    async (studentData: any) => {
      console.log('Creating student with data:', studentData);
      const response = await cachedApiClient.post('/students', studentData);
      return response;
    },
    { preventDuplicates: true, showLoading: false }
  );

  // Use API request hook for fetching students (original API)
  const fetchStudentsRequest = useApiRequest(
    async (page: number) => {
      console.log(`Fetching students with params: page=${page}&limit=${limit}`);
      const response = await cachedApiClient.get<StudentsResponse>(
        '/students',
        { page: page.toString(), limit: limit.toString() },
        { ttl: 15, useStaleWhileRevalidate: true }
      );
      return response;
    },
    { preventDuplicates: true }
  );

  // Original fetch function for Student users
  const fetchStudents = async (page = 1) => {
    try {
      const data = await fetchStudentsRequest.execute(page);
      console.log('Students data received:', data);
      
      setStudents(data.data);
      setCurrentPage(data.meta.page);
      setTotalPages(data.meta.totalPages);
      setTotalStudents(data.meta.total);
      setDataLoaded(true);
      
      toast({
        title: "Students Loaded",
        description: `Successfully loaded ${data.data.length} students.`
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    }
  };

  // New fetch function for institute-based students (class only)
  const fetchInstituteClassStudents = async () => {
    if (!selectedInstitute?.id || !selectedClass?.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/institute-users/institute/${selectedInstitute.id}/users/STUDENT/class/${selectedClass.id}`,
        { headers: getApiHeaders() }
      );
      
      if (response.ok) {
        const data: InstituteStudentsResponse = await response.json();
        setInstituteStudents(data.data);
        setTotalStudents(data.meta.total);
        setCurrentPage(data.meta.page);
        setTotalPages(data.meta.totalPages);
        setDataLoaded(true);
        
        toast({
          title: "Class Students Loaded",
          description: `Successfully loaded ${data.data.length} students.`
        });
      } else {
        throw new Error('Failed to fetch class students');
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
      toast({
        title: "Error",
        description: "Failed to load class students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // New fetch function for institute-based students (class + subject)
  const fetchInstituteSubjectStudents = async () => {
    if (!selectedInstitute?.id || !selectedClass?.id || !selectedSubject?.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/institute-users/institute/${selectedInstitute.id}/users/STUDENT/class/${selectedClass.id}/subject/${selectedSubject.id}`,
        { headers: getApiHeaders() }
      );
      
      if (response.ok) {
        const data: InstituteStudentsResponse = await response.json();
        setInstituteStudents(data.data);
        setTotalStudents(data.meta.total);
        setCurrentPage(data.meta.page);
        setTotalPages(data.meta.totalPages);
        setDataLoaded(true);
        
        toast({
          title: "Subject Students Loaded",
          description: `Successfully loaded ${data.data.length} students.`
        });
      } else {
        throw new Error('Failed to fetch subject students');
      }
    } catch (error) {
      console.error('Error fetching subject students:', error);
      toast({
        title: "Error",
        description: "Failed to load subject students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine which fetch function to use
  const getLoadFunction = () => {
    if (!shouldUseInstituteApi()) {
      return () => fetchStudents(currentPage);
    }
    
    if (selectedSubject) {
      return fetchInstituteSubjectStudents;
    } else if (selectedClass) {
      return fetchInstituteClassStudents;
    }
    
    return () => fetchStudents(currentPage);
  };

  const getLoadButtonText = () => {
    if (!shouldUseInstituteApi()) {
      return fetchStudentsRequest.loading || loading ? 'Loading Students...' : 'Load Students';
    }
    
    if (selectedSubject) {
      return loading ? 'Loading Subject Students...' : 'Load Subject Students';
    } else if (selectedClass) {
      return loading ? 'Loading Class Students...' : 'Load Class Students';
    }
    
    return fetchStudentsRequest.loading || loading ? 'Loading Students...' : 'Load Students';
  };

  const getCurrentSelection = () => {
    if (!shouldUseInstituteApi()) return '';
    
    const parts = [];
    if (selectedInstitute) parts.push(`Institute: ${selectedInstitute.name}`);
    if (selectedClass) parts.push(`Class: ${selectedClass.name}`);
    if (selectedSubject) parts.push(`Subject: ${selectedSubject.name}`);
    return parts.join(' → ');
  };

  const handleCreateStudent = async (studentData: any) => {
    try {
      console.log('Submitting student data:', studentData);
      
      await createStudentRequest.execute(studentData);
      
      toast({
        title: "Success",
        description: "Student created successfully!",
      });
      
      setShowCreateForm(false);
      
      // Refresh students list after successful creation
      const loadFn = getLoadFunction();
      await loadFn();
      
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error", 
        description: "Failed to create student",
        variant: "destructive"
      });
    }
  };

  // Columns for both student types
  const studentColumns = [
    {
      key: 'name',
      header: 'Student',
      render: (value: any, row: Student | InstituteStudent) => {
        // Handle different data structures
        const name = 'user' in row ? `${row.user.firstName} ${row.user.lastName}` : row.name;
        const email = 'user' in row ? row.user.email : 'N/A';
        const imageUrl = 'user' in row ? row.user.imageUrl : row.imageUrl;
        
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <AvatarImage src={imageUrl || ''} alt={name} />
              <AvatarFallback className="text-xs">
                {name.split(' ').map(n => n.charAt(0)).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{name}</p>
              <p className="text-sm text-gray-500 truncate">{email}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'studentId',
      header: 'Student ID',
      render: (value: any, row: Student | InstituteStudent) => {
        const id = 'user' in row ? row.studentId : row.id;
        return <Badge variant="outline">{id}</Badge>;
      }
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (value: any, row: Student | InstituteStudent) => {
        const phone = 'user' in row ? row.user.phoneNumber : row.phoneNumber;
        return phone || 'N/A';
      }
    },
    {
      key: 'emergencyContact',
      header: 'Emergency Contact',
      render: (value: any, row: Student | InstituteStudent) => {
        const emergency = 'user' in row ? row.emergencyContact : 'N/A';
        return emergency || 'N/A';
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: any, row: Student | InstituteStudent) => {
        const isActive = 'user' in row ? row.isActive : true;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      }
    }
  ];

  // Get the current dataset to filter and display
  const getCurrentStudentData = () => {
    return shouldUseInstituteApi() ? instituteStudents : students;
  };

  const filteredStudents = getCurrentStudentData().filter((student: Student | InstituteStudent) => {
    // Handle different data structures for search
    let name, email, studentId;
    
    if ('user' in student) {
      // Original Student structure
      name = `${student.user.firstName} ${student.user.lastName}`;
      email = student.user.email;
      studentId = student.studentId;
    } else {
      // InstituteStudent structure
      name = student.name;
      email = '';
      studentId = student.id;
    }
    
    const matchesSearch = !searchTerm || 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter only applies to original Student structure
    const matchesStatus = statusFilter === 'all' || 
      ('user' in student && statusFilter === 'active' && student.isActive) || 
      ('user' in student && statusFilter === 'inactive' && !student.isActive) ||
      !('user' in student); // Institute students don't have status filter
    
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view students.</p>
      </div>
    );
  }

  // Special handling for InstituteAdmin and Teacher users requiring selections
  if (shouldUseInstituteApi() && (!selectedClass || !dataLoaded)) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getCurrentSelection() || 'Select institute and class to view students'}
            </p>
          </div>
        </div>

        {!selectedClass ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select Class Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please select an institute and class to view students.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Load Students
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Current Selection: {getCurrentSelection()}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click the button below to load students for your selection.
              </p>
              <Button 
                onClick={getLoadFunction()} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {getLoadButtonText()}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    {getLoadButtonText()}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {shouldUseInstituteApi() && getCurrentSelection() 
              ? getCurrentSelection() 
              : 'Manage student records and information'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {totalStudents} Students
          </Badge>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button 
            onClick={getLoadFunction()} 
            disabled={fetchStudentsRequest.loading || loading}
            variant="outline"
            size="sm"
          >
            {fetchStudentsRequest.loading || loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
          {!shouldUseInstituteApi() && (
            <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filter Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!shouldUseInstituteApi() && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table/Cards */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Students Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'No students match your current filters.' 
                : 'No students have been created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              title=""
              data={filteredStudents}
              columns={studentColumns}
              searchPlaceholder="Search students..."
              allowAdd={false}
              allowEdit={false}
              allowDelete={false}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <DataCardView
              data={filteredStudents}
              columns={studentColumns}
              allowEdit={false}
              allowDelete={false}
            />
          </div>
        </>
      )}

      {/* Pagination - Only show for original API */}
      {!shouldUseInstituteApi() && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalStudents)} of {totalStudents} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStudents(currentPage - 1)}
              disabled={currentPage === 1 || fetchStudentsRequest.loading}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStudents(currentPage + 1)}
              disabled={currentPage === totalPages || fetchStudentsRequest.loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Student Form Dialog - Only for non-institute users */}
      {!shouldUseInstituteApi() && showCreateForm && (
        <CreateStudentForm
          onSubmit={handleCreateStudent}
          onCancel={() => setShowCreateForm(false)}
          loading={createStudentRequest.loading}
        />
      )}
    </div>
  );
};

export default Students;
