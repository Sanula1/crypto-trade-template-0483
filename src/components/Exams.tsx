
import React, { useState } from 'react';
import DataTable from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Filter, Plus, Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { AccessControl } from '@/utils/permissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import CreateExamForm from '@/components/forms/CreateExamForm';
import { DataCardView } from '@/components/ui/data-card-view';
import { cachedApiClient } from '@/api/cachedClient';

interface ExamsProps {
  apiLevel?: 'institute' | 'class' | 'subject';
}

const Exams = ({ apiLevel = 'institute' }: ExamsProps) => {
  const { user, selectedInstitute, selectedClass, selectedSubject, currentInstituteId, currentClassId, currentSubjectId } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [examsData, setExamsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const buildQueryParams = () => {
    const params: Record<string, any> = {
      page: 1,
      limit: 10
    };

    // Add context-aware filtering
    if (currentInstituteId) {
      params.instituteId = currentInstituteId;
    }

    if (currentClassId) {
      params.classId = currentClassId;
    }

    if (currentSubjectId) {
      params.subjectId = currentSubjectId;
    }

    // Add filter parameters
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (typeFilter !== 'all') {
      params.examType = typeFilter;
    }

    return params;
  };

  const handleLoadData = async (forceRefresh = false) => {
    const userRole = (user?.role || 'Student') as UserRole;
    
    // For students: require all context selections
    if (userRole === 'Student') {
      if (!currentInstituteId || !currentClassId || !currentSubjectId) {
        toast({
          title: "Missing Selection",
          description: "Please select institute, class, and subject to view exams.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // For InstituteAdmin: require at least institute selection
    if (userRole === 'InstituteAdmin') {
      if (!currentInstituteId) {
        toast({
          title: "Selection Required",
          description: "Please select an institute to view exams.",
          variant: "destructive"
        });
        return;
      }
    }

    const endpoint = '/institute-class-subject-exams';
    const params = buildQueryParams();
    
    setIsLoading(true);
    console.log(`Loading exams data for role: ${userRole}`, { forceRefresh, params });
    
    try {
      const result = await cachedApiClient.get(endpoint, params, { 
        forceRefresh,
        ttl: 30 // Cache exams for 30 minutes
      });

      console.log('Exams loaded successfully:', result);
      
      // Handle both array response and paginated response
      const exams = Array.isArray(result) ? result : (result as any)?.data || [];
      setExamsData(exams);
      setDataLoaded(true);
      setLastRefresh(new Date());
      
      toast({
        title: "Data Loaded",
        description: `Successfully loaded ${exams.length} exams.`
      });
    } catch (error) {
      console.error('Failed to load exams:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load exams data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    console.log('Force refreshing exams data...');
    await handleLoadData(true);
  };

  const handleCreateExam = async () => {
    setIsCreateDialogOpen(false);
    // Force refresh after creating new exam
    await handleLoadData(true);
  };

  const handleViewExam = (examData: any) => {
    console.log('View exam:', examData);
    toast({
      title: "Exam Viewed",
      description: `Viewing exam: ${examData.title}`
    });
  };

  const handleDeleteExam = async (examData: any) => {
    console.log('Deleting exam:', examData);
    
    try {
      setIsLoading(true);
      
      // Use cached client for delete (will clear related cache)
      await cachedApiClient.delete(`/institute-class-subject-exams/${examData.id}`);

      console.log('Exam deleted successfully');
      
      toast({
        title: "Exam Deleted",
        description: `Exam ${examData.title} has been deleted successfully.`,
        variant: "destructive"
      });
      
      // Force refresh after deletion
      await handleLoadData(true);
      
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const examsColumns = [
    { key: 'title', header: 'Title' },
    { key: 'description', header: 'Description' },
    { 
      key: 'examType', 
      header: 'Type',
      render: (value: string) => (
        <Badge variant={value === 'online' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    { 
      key: 'durationMinutes', 
      header: 'Duration (min)',
      render: (value: number) => `${value} minutes`
    },
    { key: 'totalMarks', header: 'Total Marks' },
    { key: 'passingMarks', header: 'Passing Marks' },
    { 
      key: 'scheduleDate', 
      header: 'Schedule Date', 
      render: (value: string) => value ? new Date(value).toLocaleDateString() : 'Not set'
    },
    { 
      key: 'startTime', 
      header: 'Start Time', 
      render: (value: string) => value ? new Date(value).toLocaleString() : 'Not set'
    },
    { 
      key: 'endTime', 
      header: 'End Time', 
      render: (value: string) => value ? new Date(value).toLocaleString() : 'Not set'
    },
    { key: 'venue', header: 'Venue' },
    { 
      key: 'examLink', 
      header: 'Exam Link', 
      render: (value: string) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Join Exam
        </a>
      ) : 'N/A'
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'scheduled' ? 'default' : 
          value === 'draft' ? 'secondary' : 
          value === 'completed' ? 'outline' : 'destructive'
        }>
          {value}
        </Badge>
      )
    }
  ];

  const userRole = (user?.role || 'Student') as UserRole;
  const canAdd = AccessControl.hasPermission(userRole, 'create-exam');
  const canEdit = AccessControl.hasPermission(userRole, 'edit-exam');
  const canDelete = AccessControl.hasPermission(userRole, 'delete-exam');
  const canView = true; // All users can view exams

  const getTitle = () => {
    const contexts = [];
    
    if (selectedInstitute) {
      contexts.push(selectedInstitute.name);
    }
    
    if (selectedClass) {
      contexts.push(selectedClass.name);
    }
    
    if (selectedSubject) {
      contexts.push(selectedSubject.name);
    }
    
    let title = 'Exams';
    if (contexts.length > 0) {
      title += ` (${contexts.join(' → ')})`;
    }
    
    return title;
  };

  // Filter the exams based on local filters for mobile view
  const filteredExams = examsData.filter(exam => {
    const matchesSearch = !searchTerm || 
      Object.values(exam).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || 
      exam.status === statusFilter;
    
    const matchesType = typeFilter === 'all' || 
      exam.examType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const shouldShowLoadButton = () => {
    if (userRole === 'Student') {
      return currentInstituteId && currentClassId && currentSubjectId;
    }
    if (userRole === 'InstituteAdmin') {
      return currentInstituteId;
    }
    return true;
  };

  const getLoadButtonMessage = () => {
    if (userRole === 'Student' && (!currentInstituteId || !currentClassId || !currentSubjectId)) {
      return 'Please select institute, class, and subject to view exams.';
    }
    if (userRole === 'InstituteAdmin' && !currentInstituteId) {
      return 'Please select institute to view exams.';
    }
    return 'Click the button below to load exams data';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {!dataLoaded ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {getTitle()}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getLoadButtonMessage()}
          </p>
          <Button 
            onClick={() => handleLoadData(false)} 
            disabled={isLoading || !shouldShowLoadButton()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading Data...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Data
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getTitle()}
              </h1>
              {lastRefresh && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Last refreshed: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button 
                onClick={handleRefreshData} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Search Exams
                </label>
                <Input
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

           {/* Add Create Button for InstituteAdmin and Teacher */}
           {(userRole === 'InstituteAdmin' || userRole === 'Teacher') && canAdd && (
             <div className="flex justify-end mb-4">
               <Button 
                 onClick={() => setIsCreateDialogOpen(true)}
                 className="flex items-center gap-2"
               >
                 <Plus className="h-4 w-4" />
                 Create Exam
               </Button>
             </div>
           )}

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              title=""
              data={examsData}
              columns={examsColumns}
              onAdd={canAdd && userRole !== 'InstituteAdmin' ? () => setIsCreateDialogOpen(true) : undefined}
              onDelete={canDelete ? handleDeleteExam : undefined}
              onView={handleViewExam}
              searchPlaceholder="Search exams..."
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <DataCardView
              data={filteredExams}
              columns={examsColumns}
              onView={handleViewExam}
              onDelete={canDelete ? handleDeleteExam : undefined}
              allowEdit={false}
              allowDelete={canDelete}
            />
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
          </DialogHeader>
          <CreateExamForm
            onClose={() => setIsCreateDialogOpen(false)}
            onSuccess={handleCreateExam}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exams;
