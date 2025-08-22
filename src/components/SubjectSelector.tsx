import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataCardView } from '@/components/ui/data-card-view';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { BookOpen, Clock, CheckCircle, RefreshCw, User, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl } from '@/contexts/utils/auth.api';
import { instituteApi } from '@/api/institute.api';
import { useApiRequest } from '@/hooks/useApiRequest';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
}

interface StudentSubjectData {
  instituteId: string;
  classId: string;
  subjectId: string;
  subject: Subject;
}

interface ClassSubjectData {
  instituteId: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  subject: Subject;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubjectCardData {
  id: string;
  name: string;
  code: string;
  description: string;
  className: string;
  classCode: string;
  teacherName?: string;
  isMandatory: boolean;
}

const SubjectSelector = () => {
  const { user, selectedInstitute, setSelectedSubject, currentInstituteId, currentClassId } = useAuth();
  const { toast } = useToast();
  const [subjectsData, setSubjectsData] = useState<SubjectCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Use API request hook for fetching class subjects (InstituteAdmin)
  const fetchClassSubjectsRequest = useApiRequest(
    async () => {
      if (!currentInstituteId || !currentClassId) {
        throw new Error('Institute and class must be selected');
      }
      const response = await instituteApi.getClassSubjects(currentInstituteId, currentClassId);
      return response;
    },
    { preventDuplicates: true }
  );

  const getAuthToken = () => {
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken');
    return token;
  };

  const getApiHeaders = () => {
    const token = getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const fetchSubjectsByRole = async () => {
    setIsLoading(true);
    console.log('Loading subjects data for user role:', user?.role);
    
    try {
      const baseUrl = getBaseUrl();
      const headers = getApiHeaders();
      let url = '';
      let classSubjects: any[] = [];
      
      const userRole = (user?.role || 'Student') as UserRole;
      
      if (userRole === 'Student' && currentInstituteId && currentClassId) {
        // Use the new student-specific endpoint
        url = `${baseUrl}/institute-class-subject-students/${currentInstituteId}/student-subjects/class/${currentClassId}/student/${user?.id}?page=1&limit=10`;
        
        console.log('Fetching from Student URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch subjects data: ${response.status}`);
        }

        const result = await response.json();
        console.log('Raw Student API response:', result);
        
        // Handle student response structure
        if (Array.isArray(result)) {
          classSubjects = result;
        } else if (result.data && Array.isArray(result.data)) {
          classSubjects = result.data;
        } else {
          console.warn('Unexpected response structure:', result);
          classSubjects = [];
        }

        // Transform student subject data
        const transformedSubjects = classSubjects.map((item: StudentSubjectData): SubjectCardData => ({
          id: item.subject.id,
          name: item.subject.name,
          code: item.subject.code,
          description: item.subject.description || `${item.subject.category || 'General'} Subject`,
          className: 'Current Class',
          classCode: '',
          teacherName: 'Not available',
          isMandatory: item.subject.category === 'Core'
        }));

        setSubjectsData(transformedSubjects);
        setDataLoaded(true);
        
        toast({
          title: "Subjects Loaded",
          description: `Successfully loaded ${transformedSubjects.length} subjects.`
        });

      } else if (userRole === 'InstituteAdmin' && currentClassId) {
        // For InstituteAdmin with class selected: use the existing API endpoint
        try {
          const response = await fetchClassSubjectsRequest.execute();
          console.log('Class subjects API response:', response);
          
          if (response.data && Array.isArray(response.data)) {
            classSubjects = response.data;
          } else if (Array.isArray(response)) {
            classSubjects = response;
          }

          // Transform the data to subject cards
          const transformedSubjects = await transformToSubjectCards(classSubjects, userRole);
          
          console.log('Transformed subjects:', transformedSubjects);
          setSubjectsData(transformedSubjects);
          setDataLoaded(true);
          
          toast({
            title: "Subjects Loaded",
            description: `Successfully loaded ${transformedSubjects.length} subjects.`
          });

        } catch (error) {
          console.error('Error with class subjects API:', error);
          throw error;
        }
      } else if (userRole === 'Teacher') {
        // For teachers: get subjects they teach
        url = `${baseUrl}/institute-class-subjects/teacher/${user?.id}`;
      } else if (userRole === 'InstituteAdmin' || userRole === 'AttendanceMarker') {
        // For institute admin without class: use the general API endpoint
        url = `${baseUrl}/institute-class-subjects/institute/${currentInstituteId}`;
      } else {
        throw new Error('Unsupported user role for subject selection or missing required selections');
      }

      // For non-Student users, use existing logic
      if (url && userRole !== 'Student') {
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch subjects data: ${response.status}`);
        }

        const result = await response.json();
        console.log('Raw API response:', result);
        
        // Handle different response structures
        if (Array.isArray(result)) {
          classSubjects = result;
        } else if (result.data && Array.isArray(result.data)) {
          classSubjects = result.data;
        } else {
          console.warn('Unexpected response structure:', result);
          classSubjects = [];
        }

        // Transform the data to subject cards
        const transformedSubjects = await transformToSubjectCards(classSubjects, userRole);
        
        console.log('Transformed subjects:', transformedSubjects);
        setSubjectsData(transformedSubjects);
        setDataLoaded(true);
        
        toast({
          title: "Subjects Loaded",
          description: `Successfully loaded ${transformedSubjects.length} subjects.`
        });
      }
      
    } catch (error) {
      console.error('Failed to load subjects:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load subjects data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const transformToSubjectCards = async (classSubjects: ClassSubjectData[], userRole: UserRole): Promise<SubjectCardData[]> => {
    const subjectCards: SubjectCardData[] = [];
    const baseUrl = getBaseUrl();
    const headers = getApiHeaders();

    for (const item of classSubjects) {
      let subjectInfo = item.subject;
      
      // If subject info is not in the response or incomplete, fetch it
      if (!subjectInfo && item.subjectId) {
        try {
          const subjectResponse = await fetch(`${baseUrl}/subjects/${item.subjectId}`, {
            method: 'GET',
            headers
          });
          
          if (subjectResponse.ok) {
            const subjectData = await subjectResponse.json();
            subjectInfo = subjectData.data || subjectData;
          }
        } catch (error) {
          console.error('Error fetching subject details:', error);
        }
      }

      if (subjectInfo) {
        // For InstituteAdmin with class, we have direct subject data
        let className = 'Unknown Class';
        let classCode = '';
        
        if (selectedInstitute && currentClassId) {
          // Try to get class name from selected class context
          try {
            const classResponse = await fetch(`${baseUrl}/classes/${currentClassId}`, {
              method: 'GET',
              headers
            });
            
            if (classResponse.ok) {
              const classData = await classResponse.json();
              const classInfo = classData.data || classData;
              className = classInfo.name || 'Unknown Class';
              classCode = classInfo.code || '';
            }
          } catch (error) {
            console.error('Error fetching class details:', error);
          }
        }

        const teacherName = item.teacherId ? `Teacher ID: ${item.teacherId}` : 'Not assigned';

        subjectCards.push({
          id: item.subjectId || subjectInfo.id,
          name: subjectInfo.name,
          code: subjectInfo.code,
          description: subjectInfo.description || `${className} - ${className.includes('Grade') ? '' : 'General'}`,
          className: className,
          classCode: classCode,
          teacherName: teacherName,
          isMandatory: true
        });
      }
    }

    // Remove duplicates based on subject ID
    const uniqueSubjects = subjectCards.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    );

    return uniqueSubjects;
  };

  const handleSelectSubject = (subject: SubjectCardData) => {
    console.log('Selecting subject:', subject);
    
    // Set the selected subject in auth context
    setSelectedSubject({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description
    });

    toast({
      title: "Subject Selected",
      description: `Selected ${subject.name} (${subject.code})`
    });
  };

  const tableColumns = [
    {
      key: 'name',
      header: 'Subject Name',
      render: (value: any, row: SubjectCardData) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.code}</div>
        </div>
      )
    },
    {
      key: 'className',
      header: 'Class',
      render: (value: any, row: SubjectCardData) => (
        <div className="text-sm">
          <div>{value}</div>
          <div className="text-gray-500">{row.classCode}</div>
        </div>
      )
    },
    {
      key: 'teacherName',
      header: 'Teacher',
      render: (value: any) => <span className="text-sm">{value || 'Not assigned'}</span>
    },
    {
      key: 'isMandatory',
      header: 'Type',
      render: (value: any) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Mandatory' : 'Elective'}
        </Badge>
      )
    }
  ];

  const customActions = [
    {
      label: 'Select',
      action: (subject: SubjectCardData) => handleSelectSubject(subject),
      icon: <BookOpen className="h-3 w-3" />,
      variant: 'default' as const
    }
  ];

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view subjects.</p>
      </div>
    );
  }

  if (!currentInstituteId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please select an institute first.</p>
      </div>
    );
  }

  if (user.role === 'Student' && !currentClassId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please select a class first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Select Subject
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a subject to manage lectures and attendance
          </p>
          {selectedInstitute && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              Institute: {selectedInstitute.name}
            </p>
          )}
        </div>
        <Button 
          onClick={fetchSubjectsByRole} 
          disabled={isLoading || fetchClassSubjectsRequest.loading}
          variant="outline"
          size="sm"
        >
          {(isLoading || fetchClassSubjectsRequest.loading) ? (
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
      </div>

      {!dataLoaded ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click the button below to load your subjects
          </p>
          <Button 
            onClick={fetchSubjectsByRole} 
            disabled={isLoading || fetchClassSubjectsRequest.loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {(isLoading || fetchClassSubjectsRequest.loading) ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading Subjects...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Load My Subjects
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile View Content - Always Card View */}
          <div className="md:hidden">
            <DataCardView
              data={subjectsData}
              columns={tableColumns}
              customActions={customActions}
              allowEdit={false}
              allowDelete={false}
            />
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectsData.map((subject) => (
                <Card 
                  key={subject.id} 
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-500"
                  onClick={() => handleSelectSubject(subject)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <Badge 
                        variant={subject.isMandatory ? "default" : "secondary"}
                        className={subject.isMandatory ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                      >
                        {subject.isMandatory ? "Mandatory" : "Elective"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                    <CardDescription>
                      Code: {subject.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {subject.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <School className="h-4 w-4 mr-2" />
                        <span>{subject.className} ({subject.classCode})</span>
                      </div>
                      {subject.teacherName && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <User className="h-4 w-4 mr-2" />
                          <span>Teacher: {subject.teacherName}</span>
                        </div>
                      )}
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Select Subject
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SubjectSelector;
