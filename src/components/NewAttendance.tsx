
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Filter, Calendar, User, Clock, CheckCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  instituteId: string;
  classId: string | null;
  subjectId: string | null;
  studentId: string;
  date: string;
  timestamp: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  studentName: string;
  location: string;
  remarks: string;
  markedBy: string;
  PK: string;
  SK: string;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  totalRecords: number;
  scannedRecords: number;
  uniqueStudents: number;
  pagination: {
    hasMore: boolean;
    limit: number;
  };
  queryPattern: string;
  queryType: string;
  filters: {
    instituteId: string;
    classId?: string;
    subjectId?: string;
    studentId?: string;
  };
}

const NewAttendance = () => {
  const { selectedInstitute, selectedClass, selectedSubject, currentInstituteId, currentClassId, currentSubjectId, user } = useAuth();
  const { toast } = useToast();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('2025-08-12');
  const [endDate, setEndDate] = useState('2025-08-13');
  const [sortOrder, setSortOrder] = useState<string>('descending');

  const getAttendanceUrl = () => {
    return localStorage.getItem('attendanceUrl') || 'http://localhost:3001';
  };

  // Check permissions based on role and context
  const getPermissionAndEndpoint = () => {
    const userRole = user?.role;
    const attendanceBaseUrl = getAttendanceUrl();
    
    // 1. SystemAdmin/InstituteAdmin - Institute attendance
    if ((userRole === 'SystemAdmin' || userRole === 'InstituteAdmin') && currentInstituteId) {
      return {
        hasPermission: true,
        endpoint: `${attendanceBaseUrl}/api/attendance/institute/${currentInstituteId}`,
        title: 'Institute Attendance Records'
      };
    }
    
    // 2. SystemAdmin/InstituteAdmin/Teacher - Class attendance
    if ((userRole === 'SystemAdmin' || userRole === 'InstituteAdmin' || userRole === 'Teacher') && 
        currentInstituteId && currentClassId) {
      return {
        hasPermission: true,
        endpoint: `${attendanceBaseUrl}/api/attendance/class/${currentInstituteId}/${currentClassId}`,
        title: 'Class Attendance Records'
      };
    }
    
    // 3. SystemAdmin/InstituteAdmin/Teacher - Subject attendance
    if ((userRole === 'SystemAdmin' || userRole === 'InstituteAdmin' || userRole === 'Teacher') && 
        currentInstituteId && currentClassId && currentSubjectId) {
      return {
        hasPermission: true,
        endpoint: `${attendanceBaseUrl}/api/attendance/subject/${currentInstituteId}/${currentClassId}/${currentSubjectId}`,
        title: 'Subject Attendance Records'
      };
    }
    
    // 4. Student - Their own attendance
    if (userRole === 'Student' && currentInstituteId && user?.id) {
      return {
        hasPermission: true,
        endpoint: `${attendanceBaseUrl}/api/attendance/student/${currentInstituteId}/${user.id}`,
        title: 'My Attendance Records'
      };
    }
    
    return {
      hasPermission: false,
      endpoint: '',
      title: 'Attendance Records'
    };
  };

  const { hasPermission, endpoint, title } = getPermissionAndEndpoint();

  const getApiHeaders = () => {
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const loadAttendanceData = async () => {
    if (!hasPermission) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view attendance records.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Loading attendance data from API:', endpoint);
    
    try {
      const headers = getApiHeaders();
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: '20',
        startDate,
        endDate
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const fullUrl = `${endpoint}?${params.toString()}`;
      console.log('Full API URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.status}`);
      }

      const result: AttendanceResponse = await response.json();
      console.log('Attendance data loaded successfully:', result);
      
      setAttendanceRecords(result.records);
      setFilteredRecords(result.records);
      setDataLoaded(true);
      
      toast({
        title: "Data Loaded",
        description: `Successfully loaded ${result.records.length} attendance records.`
      });
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load attendance data from server.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = attendanceRecords;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'ascending' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });

    setFilteredRecords(filtered);
  }, [attendanceRecords, searchTerm, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentSelection = () => {
    const selections = [];
    if (selectedInstitute) selections.push(`Institute: ${selectedInstitute.name}`);
    if (selectedClass) selections.push(`Class: ${selectedClass.name}`);
    if (selectedSubject) selections.push(`Subject: ${selectedSubject.name}`);
    return selections.join(', ');
  };

  const parseLocation = (location: string) => {
    try {
      const parsed = JSON.parse(location);
      return parsed.address || location;
    } catch {
      return location;
    }
  };

  const getLocationCoordinates = (location: string) => {
    try {
      const parsed = JSON.parse(location);
      if (parsed.latitude && parsed.longitude) {
        return { lat: parsed.latitude, lng: parsed.longitude };
      }
    } catch {
      // Return null if parsing fails
    }
    return null;
  };

  const handleViewLocation = (location: string) => {
    const coords = getLocationCoordinates(location);
    if (coords) {
      const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Location Not Available",
        description: "No coordinates available for this location.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Mobile Card Component
  const AttendanceCard = ({ record }: { record: AttendanceRecord }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {record.studentName || `Student ID: ${record.studentId}`}
          </CardTitle>
          <Badge className={getStatusColor(record.status)}>
            {record.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span>ID: {record.studentId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Time: {formatTime(record.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>Location: {parseLocation(record.location) || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Marked By: {record.markedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-gray-500">
              {new Date(record.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Remarks: {record.remarks || 'No remarks'}</span>
          </div>
        </div>
        {getLocationCoordinates(record.location) && (
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewLocation(record.location)}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              View Location
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!hasPermission) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to view attendance records or haven't selected the required context.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Current Selection: {getCurrentSelection() || 'None'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Current Selection: {getCurrentSelection()}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            View and manage attendance records
          </p>
          <Button 
            onClick={loadAttendanceData} 
            disabled={isLoading}
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
                Load Attendance Data
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Current Selection: {getCurrentSelection()}
          </p>
        </div>
        <Button 
          onClick={loadAttendanceData} 
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
              Refresh
            </>
          )}
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            {/* End Date */}
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descending">Newest First</SelectItem>
                <SelectItem value="ascending">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredRecords.length} of {attendanceRecords.length} records
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Marked By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No attendance records found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No attendance records are available for the current selection.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{formatTime(record.date)}</TableCell>
                      <TableCell className="font-medium">{record.studentId}</TableCell>
                      <TableCell>{record.studentName || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{parseLocation(record.location) || 'Not specified'}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                      <TableCell>{record.markedBy}</TableCell>
                      <TableCell>
                        {getLocationCoordinates(record.location) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewLocation(record.location)}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No attendance records found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No attendance records are available for the current selection.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record, index) => (
              <AttendanceCard key={index} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAttendance;
