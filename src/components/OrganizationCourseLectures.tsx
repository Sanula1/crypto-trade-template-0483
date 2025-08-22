
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Monitor, Users, FileText, ExternalLink } from 'lucide-react';
import { organizationSpecificApi, OrganizationLecture, LectureDocument } from '@/api/organization.api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Course {
  causeId: string;
  title: string;
  description: string;
  isPublic: boolean;
  organizationId: string;
}

interface OrganizationCourseLecturesProps {
  course: Course | null;
  onBack: () => void;
}

const OrganizationCourseLectures = ({ course, onBack }: OrganizationCourseLecturesProps) => {
  const [lectures, setLectures] = useState<OrganizationLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchLectures = async () => {
    if (!course) return;
    
    try {
      setLoading(true);
      
      // Build query parameters for lectures API
      const params = new URLSearchParams({
        causeId: course.causeId,
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await organizationSpecificApi.get<{
        data: OrganizationLecture[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>(`/organization/api/v1/lectures?${params.toString()}`);
      
      setLectures(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast({
        title: "Error",
        description: "Failed to load lectures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [currentPage, searchTerm, course]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLectures();
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getDuration = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Duration unavailable';
      }
      const durationMs = endDate.getTime() - startDate.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return 'Duration unavailable';
    }
  };

  if (!course) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Course Selected</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Please select a course to view its lectures.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">Course Lectures</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search lectures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Lectures List */}
      <div className="space-y-4">
        {lectures.map((lecture) => (
          <Card key={lecture.lectureId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{lecture.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {lecture.description}
                  </CardDescription>
                </div>
                <Badge variant={lecture.isPublic ? "default" : "secondary"}>
                  {lecture.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(lecture.timeStart)}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {getDuration(lecture.timeStart, lecture.timeEnd)}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {lecture.mode === 'online' ? (
                    <><Monitor className="h-4 w-4" /> Online</>
                  ) : (
                    <><MapPin className="h-4 w-4" /> {lecture.venue}</>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {lecture.documentCount} documents
                </div>
              </div>

              {/* Documents */}
              {lecture.documents && lecture.documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Documents:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {lecture.documents.map((doc: LectureDocument) => (
                      <div key={doc.documentationId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-gray-600">{doc.description}</p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.docUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Link */}
              {lecture.liveLink && (
                <div className="mt-4 pt-4 border-t">
                  <Button asChild className="w-full">
                    <a href={lecture.liveLink} target="_blank" rel="noopener noreferrer">
                      Join Live Session ({lecture.liveMode})
                    </a>
                  </Button>
                </div>
              )}

              {/* Recording */}
              {lecture.recordingUrl && (
                <div className="mt-2">
                  <Button variant="outline" asChild className="w-full">
                    <a href={lecture.recordingUrl} target="_blank" rel="noopener noreferrer">
                      View Recording
                    </a>
                  </Button>
                </div>
              )}
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

      {lectures.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Lectures Found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {searchTerm
                ? 'No lectures match your search criteria.'
                : 'No lectures available for this course at the moment.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizationCourseLectures;
