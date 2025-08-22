
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Filter, Eye, EyeOff, Plus } from 'lucide-react';
import { organizationApi, Course, OrganizationQueryParams } from '@/api/organization.api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import CreateCourseForm from './forms/CreateCourseForm';

interface OrganizationCoursesProps {
  organizationId?: string;
  onSelectCourse?: (course: Course) => void;
}

const OrganizationCourses = ({ organizationId, onSelectCourse }: OrganizationCoursesProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [publicFilter, setPublicFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const params: OrganizationQueryParams = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(publicFilter !== 'all' && { isPublic: publicFilter === 'public' })
      };

      let response;
      if (organizationId) {
        // Fetch courses for specific organization
        response = await organizationApi.getOrganizationCourses(organizationId, params);
      } else {
        // Fetch all courses globally
        response = await organizationApi.getCourses(params);
      }
      
      setCourses(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (course: any) => {
    console.log('Course created successfully:', course);
    setShowCreateForm(false);
    fetchCourses(); // Refresh the list
    toast({
      title: "Success",
      description: "Course created successfully",
    });
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchTerm, publicFilter, organizationId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPublicFilter('all');
    setCurrentPage(1);
  };

  if (showCreateForm) {
    return (
      <CreateCourseForm
        onSuccess={handleCreateSuccess}
        onCancel={handleCreateCancel}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getHeaderInfo = () => {
    if (organizationId) {
      return {
        title: 'Organization Courses',
        description: 'Browse courses for this organization'
      };
    }
    return {
      title: 'All Organization Courses',
      description: 'Browse all courses across organizations'
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{headerInfo.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {headerInfo.description}
          </p>
        </div>
        {user?.role === 'OrganizationManager' && (
          <Button onClick={handleCreateCourse} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <Select value={publicFilter} onValueChange={setPublicFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex items-end">
                <div className="flex gap-2 w-full">
                  <Button type="submit" className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button type="button" variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.causeId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={course.isPublic ? "default" : "secondary"}>
                    {course.isPublic ? (
                      <><Eye className="h-3 w-3 mr-1" /> Public</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" /> Private</>
                    )}
                  </Badge>
                  
                  {!organizationId && (
                    <Badge variant="outline" className="text-xs">
                      Org: {course.organizationId}
                    </Badge>
                  )}
                </div>
                
                {onSelectCourse && (
                  <Button 
                    onClick={() => onSelectCourse(course)}
                    className="w-full"
                  >
                    Select Course
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {courses.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Courses Found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {searchTerm || publicFilter !== 'all'
                ? 'No courses match your current filters.'
                : 'No courses available at the moment.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizationCourses;
