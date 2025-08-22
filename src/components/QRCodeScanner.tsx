import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, QrCode, UserCheck, CheckCircle, MapPin, Monitor, Users, X, RefreshCw } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface MarkAttendanceRequest {
  instituteId: string;
  classId?: string;
  subjectId?: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EARLY_DEPARTURE";
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface StudentData {
  id: string;
  name: string;
  package: string;
  town: string;
  imageUrl: string;
}

interface MarkAttendanceResponse {
  success: boolean;
  message?: string;
  data?: {
    student: StudentData;
  };
  markedBy?: string;
  userType?: string;
}

interface AttendanceNotification {
  student: StudentData;
  status: string;
  timestamp: Date;
}

const QRCodeScanner = () => {
  const { selectedInstitute, selectedClass, selectedSubject, currentInstituteId, currentClassId, currentSubjectId, user } = useAuth();
  const { toast } = useToast();
  
  const [studentId, setStudentId] = useState('');
  const [markedCount, setMarkedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [status, setStatus] = useState<"PRESENT" | "ABSENT" | "LATE" | "EARLY_DEPARTURE">('PRESENT');
  const [attendanceNotification, setAttendanceNotification] = useState<AttendanceNotification | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Check if user has permission - now includes Teacher role
  const hasPermission = user?.role === 'InstituteAdmin' || user?.role === 'AttendanceMarker' || user?.role === 'Teacher';

  useEffect(() => {
    if (attendanceNotification) {
      const timer = setTimeout(() => {
        setAttendanceNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [attendanceNotification]);

  useEffect(() => {
    fetchLocation();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [selectedInstitute, selectedClass, selectedSubject]);

  const fetchLocation = async () => {
    setLocationLoading(true);
    console.log('Fetching location...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('GPS coordinates:', { latitude, longitude });
          
          try {
            const address = await reverseGeocode(latitude, longitude);
            setLocation({ latitude, longitude, address });
            console.log('Location set:', { latitude, longitude, address });
          } catch (error) {
            console.log('Reverse geocoding failed, using generated address');
            const address = generateAddress();
            setLocation({ latitude, longitude, address });
          }
          setLocationLoading(false);
        },
        (error) => {
          console.log('Location access error:', error);
          toast({
            title: "Location Access",
            description: "Using default location. For better accuracy, please allow location access.",
            variant: "default"
          });
          const address = generateAddress();
          setLocation({ latitude: 0, longitude: 0, address });
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.log('Geolocation not supported');
      const address = generateAddress();
      setLocation({ latitude: 0, longitude: 0, address });
      setLocationLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      throw new Error('No address found');
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
      return generateAddress();
    }
  };

  const generateAddress = (): string => {
    let address = selectedInstitute?.name || 'Unknown Institute';
    
    if (selectedClass?.name) {
      address += ` - ${selectedClass.name}`;
    }
    
    if (selectedSubject?.name) {
      address += ` - ${selectedSubject.name}`;
    }
    
    return address;
  };

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const getAttendanceUrl = () => {
    const attendanceUrl = localStorage.getItem('attendanceUrl') || 
                          localStorage.getItem('baseUrl2') || 
                          localStorage.getItem('baseUrl') || '';
    console.log('Retrieved attendance URL from localStorage:', attendanceUrl);
    return attendanceUrl;
  };

  const getApiHeaders = () => {
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      setCameraError(null);
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      if (qrScannerRef.current) {
        console.log('Stopping existing scanner...');
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      const hasCamera = await QrScanner.hasCamera();
      console.log('Camera available:', hasCamera);
      
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }

      console.log('Initializing QR Scanner...');

      videoRef.current.style.display = 'block';
      videoRef.current.style.width = '100%';
      videoRef.current.style.height = '100%';
      videoRef.current.style.objectFit = 'cover';

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          setStudentId(result.data);
          
          setTimeout(() => {
            handleMarkAttendance(result.data);
          }, 500);
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          calculateScanRegion: (video) => {
            const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
            const scanRegionSize = Math.round(0.6 * smallerDimension);
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize,
            };
          },
        }
      );

      console.log('Starting QR scanner...');
      await qrScannerRef.current.start();
      
      await new Promise<void>((resolve, reject) => {
        const checkVideo = () => {
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.readyState >= 2) {
            console.log('Video ready and playing:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
              readyState: videoRef.current.readyState
            });
            resolve();
          } else {
            setTimeout(checkVideo, 100);
          }
        };
        
        setTimeout(() => reject(new Error('Video failed to load')), 10000);
        checkVideo();
      });

      setIsScanning(true);
      setCameraError(null);

      console.log('QR Scanner started successfully');

      toast({
        title: "Camera Started",
        description: "Point camera at QR code to scan automatically"
      });

    } catch (error) {
      console.error('Camera start error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
      setCameraError(errorMessage);
      setIsScanning(false);
      
      let userMessage = errorMessage;
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        userMessage = 'Camera access denied. Please allow camera permissions and refresh the page.';
      } else if (errorMessage.includes('No camera found')) {
        userMessage = 'No camera found on this device.';
      } else if (errorMessage.includes('NotReadableError')) {
        userMessage = 'Camera is being used by another application. Please close other apps using the camera.';
      } else if (errorMessage.includes('Video failed to load')) {
        userMessage = 'Camera failed to initialize. Please try again or refresh the page.';
      }
      
      toast({
        title: "Camera Access Error",
        description: userMessage,
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    try {
      console.log('Stopping camera...');
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.style.display = 'none';
      }
      
      setIsScanning(false);
      setCameraError(null);
      console.log('Camera stopped successfully');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const handleMarkAttendance = async (studentIdValue: string) => {
    if (!studentIdValue.trim() || !currentInstituteId) {
      toast({
        title: "Missing Information",
        description: "Please ensure student ID and institute are selected",
        variant: "destructive"
      });
      return;
    }

    if (!location) {
      toast({
        title: "Location Required",
        description: "Please allow location access to mark attendance",
        variant: "destructive"
      });
      return;
    }

    try {
      const attendanceBaseUrl = getAttendanceUrl();
      if (!attendanceBaseUrl) {
        throw new Error('Attendance URL not configured. Please set the attendance URL in settings.');
      }

      const headers = getApiHeaders();
      
      const requestBody: MarkAttendanceRequest = {
        instituteId: currentInstituteId,
        studentId: studentIdValue.trim(),
        status: status,
        location: {
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude
        }
      };

      if (currentClassId) {
        requestBody.classId = currentClassId;
      }

      if (currentSubjectId) {
        requestBody.subjectId = currentSubjectId;
      }

      const baseUrl = attendanceBaseUrl.endsWith('/') ? attendanceBaseUrl.slice(0, -1) : attendanceBaseUrl;
      const fullApiUrl = `${baseUrl}/api/attendance/mark`;
      
      console.log('Marking attendance with request:', requestBody);
      console.log('Calling attendance API at:', fullApiUrl);
      console.log('Using headers:', headers);

      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Attendance API error response:', errorText);
        throw new Error(`Failed to mark attendance: ${response.status} - ${errorText}`);
      }

      const result: MarkAttendanceResponse = await response.json();
      console.log('Attendance marked successfully:', result);

      if (result.success && result.data?.student) {
        setMarkedCount(prev => prev + 1);
        setStudentId('');
        
        setAttendanceNotification({
          student: result.data.student,
          status: status,
          timestamp: new Date()
        });

        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        throw new Error(result.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast({
        title: "Mark Failed",
        description: error instanceof Error ? error.message : "Failed to mark attendance. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStudentIdChange = (value: string) => {
    setStudentId(value);
  };

  const handleManualSubmit = () => {
    if (studentId.trim()) {
      handleMarkAttendance(studentId);
    }
  };

  const handleBack = () => {
    stopCamera();
    window.history.back();
  };

  const simulateQRScan = () => {
    const randomId = `STU${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setStudentId(randomId);
    handleMarkAttendance(randomId);
  };

  const handleRefreshLocation = () => {
    fetchLocation();
  };

  if (!hasPermission) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              You don't have permission to mark attendance. This feature is only available for Institute Admins, Teachers, and Attendance Markers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedInstitute) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Institute Selection Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Please select an institute first to mark attendance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Attendance Success Notification */}
      {attendanceNotification && (
        <div className="fixed top-4 left-2 right-2 sm:left-4 sm:right-auto z-50 animate-in slide-in-from-left-5">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 shadow-lg max-w-sm sm:min-w-[320px]">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                {attendanceNotification.student.imageUrl ? (
                  <img 
                    src={attendanceNotification.student.imageUrl} 
                    alt={attendanceNotification.student.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxMkMyNi4yMDkxIDEyIDI4IDEzLjc5MDkgMjggMTZDMjggMTguMjA5MSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMTguMjA5MSAyMCAxNkMyMCAxMy43OTA5IDIxLjc5MDkgMTIgMjQgMTJaIiBmaWxsPSIjOUM5Q0EzIi8+CjxwYXRoIGQ9Ik0xNiAzNkMxNiAzMC40NzcyIDE5LjU4MTcgMjYgMjQgMjZDMjguNDE4MyAyNiAzMiAzMC40NzcyIDMyIDM2SDE2WiIgZmlsbD0iIzlDOUNBMyIvPgo8L3N2Zz4K';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-200">
                    Attendance Marked Successfully
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-green-600 hover:text-green-800"
                    onClick={() => setAttendanceNotification(null)}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <AlertDescription className="text-green-700 dark:text-green-300 mt-1">
                  <div className="font-medium text-sm sm:text-base truncate">{attendanceNotification.student.name}</div>
                  <div className="text-xs mt-1 flex items-center gap-1 sm:gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs px-1 py-0 border-green-300 text-green-700">
                      {attendanceNotification.status}
                    </Badge>
                    <span className="text-green-600">
                      {attendanceNotification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {attendanceNotification.student.town && (
                    <div className="text-xs text-green-600 mt-1 truncate">
                      📍 {attendanceNotification.student.town}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      )}

      <div className="container mx-auto p-4 sm:p-6 space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              QR Code Attendance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Scan QR codes to mark student attendance
            </p>
          </div>
        </div>

        {/* Current Selection Card - Updated to match image */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100 text-lg">
              <QrCode className="h-5 w-5" />
              Current Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Institute: </span>
                <span className="text-blue-900 dark:text-blue-100">{selectedInstitute.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Class: </span>
                <span className="text-blue-900 dark:text-blue-100">{selectedClass?.name || 'Not selected'}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Marker: </span>
                <span className="text-blue-900 dark:text-blue-100">{user?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Location: </span>
                <span className="text-xs text-blue-900 dark:text-blue-100">{location?.address || 'Getting location...'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid - Updated layout to match image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Scanner - Left Side */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription className="text-sm">
                Point camera at QR code to automatically scan and mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Preview Area */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    display: isScanning ? 'block' : 'none'
                  }}
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <Camera className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Camera Off
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click start to begin scanning
                    </p>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-blue-400 rounded-lg opacity-75">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button 
                    onClick={startCamera} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!!cameraError}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                )}
                <Button onClick={simulateQRScan} variant="outline">
                  Demo Scan
                </Button>
              </div>

              {cameraError && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                    {cameraError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry - Right Side - Updated to match image */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5" />
                Manual Entry
              </CardTitle>
              <CardDescription className="text-sm">
                Manually enter student ID and select status to mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Attendance Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Attendance Status</label>
                <Select value={status} onValueChange={(value: "PRESENT" | "ABSENT" | "LATE" | "EARLY_DEPARTURE") => setStatus(value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="EARLY_DEPARTURE">Early Departure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student ID Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Student ID</label>
                <Input
                  ref={inputRef}
                  value={studentId}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  placeholder="Enter student ID or scan QR code"
                  className="h-10"
                />
              </div>

              {/* Mark Button */}
              <Button 
                onClick={handleManualSubmit} 
                disabled={!studentId.trim()}
                className="w-full bg-green-600 hover:bg-green-700 h-10"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark {status}
              </Button>

              {/* Statistics - Centered layout like in image */}
              <div className="text-center space-y-2 py-4">
                <div className="text-4xl font-bold text-green-600">{markedCount}</div>
                <div className="text-sm text-green-600 font-medium">Students Marked</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Status: {status}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
