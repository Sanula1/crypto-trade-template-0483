import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/Dashboard';
import Users from '@/components/Users';
import Students from '@/components/Students';
import Teachers from '@/components/Teachers';
import Parents from '@/components/Parents';
import Grades from '@/components/Grades';
import Classes from '@/components/Classes';
import Subjects from '@/components/Subjects';
import Institutes from '@/components/Institutes';
import Grading from '@/components/Grading';
import Attendance from '@/components/Attendance';
import AttendanceMarking from '@/components/AttendanceMarking';
import AttendanceMarkers from '@/components/AttendanceMarkers';
import QRAttendance from '@/components/QRAttendance';
import Lectures from '@/components/Lectures';
import LiveLectures from '@/components/LiveLectures';
import Homework from '@/components/Homework';
import Exams from '@/components/Exams';
import Results from '@/components/Results';
import Profile from '@/components/Profile';
import InstituteDetails from '@/components/InstituteDetails';
import Login from '@/components/Login';
import InstituteSelector from '@/components/InstituteSelector';
import ClassSelector from '@/components/ClassSelector';
import SubjectSelector from '@/components/SubjectSelector';
import ParentChildrenSelector from '@/components/ParentChildrenSelector';
import Organizations from '@/components/Organizations';
import Gallery from '@/components/Gallery';
import Settings from '@/components/Settings';
import Appearance from '@/components/Appearance';
import OrganizationHeader from '@/components/OrganizationHeader';
import OrganizationLogin from '@/components/OrganizationLogin';
import OrganizationSelector from '@/components/OrganizationSelector';
import CreateOrganizationForm from '@/components/forms/CreateOrganizationForm';
import OrganizationManagement from '@/components/OrganizationManagement';
import OrganizationCourses from '@/components/OrganizationCourses';
import OrganizationLectures from '@/components/OrganizationLectures';
import TeacherStudents from '@/components/TeacherStudents';
import TeacherHomework from '@/components/TeacherHomework';
import TeacherExams from '@/components/TeacherExams';
import TeacherLectures from '@/components/TeacherLectures';
import AttendanceMarkerSubjectSelector from '@/components/AttendanceMarkerSubjectSelector';
import InstituteUsers from '@/components/InstituteUsers';
import Payment from '@/components/Payment';

const AppContent = () => {
  const { user, login, selectedInstitute, selectedClass, selectedSubject, selectedChild, selectedOrganization, setSelectedOrganization, currentInstituteId } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [organizationLoginData, setOrganizationLoginData] = useState<any>(null);
  const [showCreateOrgForm, setShowCreateOrgForm] = useState(false);
  const [organizationCurrentPage, setOrganizationCurrentPage] = useState('organizations');

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleOrganizationLogin = (loginResponse: any) => {
    console.log('Organization login successful:', loginResponse);
    setOrganizationLoginData(loginResponse);
    setOrganizationCurrentPage('organizations');
  };

  const handleOrganizationSelect = (organization: any) => {
    console.log('Organization selected:', organization);
    setSelectedOrganization(organization);
    
    // Switch to using baseUrl2 for organization-specific API calls
    import('@/api/client').then(({ apiClient }) => {
      apiClient.setUseBaseUrl2(true);
    });
    
    setCurrentPage('dashboard');
  };

  const handleBackToOrganizationSelector = () => {
    setCurrentPage('organization-selector');
  };

  const handleBackToMain = () => {
    setOrganizationLoginData(null);
    setOrganizationCurrentPage('organizations');
    
    // Switch back to using baseUrl for main API calls
    import('@/api/client').then(({ apiClient }) => {
      apiClient.setUseBaseUrl2(false);
    });
    
    setCurrentPage('dashboard');
  };

  const handleCreateOrganization = () => {
    setShowCreateOrgForm(true);
  };

  const handleCreateOrganizationSuccess = (organization: any) => {
    console.log('Organization created successfully:', organization);
    setShowCreateOrgForm(false);
    setCurrentPage('organization-selector');
  };

  const handleCreateOrganizationCancel = () => {
    setShowCreateOrgForm(false);
  };

  // Organization-specific navigation component
  const OrganizationNavigation = () => {
    if (!organizationLoginData) return null;

    const userRole = user?.role;
    const isOrganizationManager = userRole === 'OrganizationManager';
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex w-full h-screen">
          {/* Organization Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Organization Portal</h2>
              <Button variant="ghost" size="sm" onClick={handleBackToMain}>
                Back
              </Button>
            </div>
            
            <div className="flex-1 p-4">
              <div className="space-y-2">
                <Button
                  variant={organizationCurrentPage === 'organizations' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setOrganizationCurrentPage('organizations')}
                >
                  Select Organizations
                </Button>
                
                {isOrganizationManager && (
                  <>
                    <Button
                      variant={organizationCurrentPage === 'courses' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setOrganizationCurrentPage('courses')}
                    >
                      Courses
                    </Button>
                    <Button
                      variant={organizationCurrentPage === 'lectures' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setOrganizationCurrentPage('lectures')}
                    >
                      Lectures
                    </Button>
                  </>
                )}
                
                <Button
                  variant={organizationCurrentPage === 'profile' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setOrganizationCurrentPage('profile')}
                >
                  Profile
                </Button>
                <Button
                  variant={organizationCurrentPage === 'appearance' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setOrganizationCurrentPage('appearance')}
                >
                  Appearance
                </Button>
              </div>
            </div>
          </div>
          
          {/* Organization Content */}
          <div className="flex-1 overflow-auto p-6">
            {organizationCurrentPage === 'organizations' && (
              <OrganizationManagement
                userRole={userRole || 'Student'}
                userPermissions={organizationLoginData?.permissions}
                currentInstituteId={currentInstituteId || undefined}
              />
            )}
            {organizationCurrentPage === 'courses' && isOrganizationManager && (
              <OrganizationCourses />
            )}
            {organizationCurrentPage === 'lectures' && isOrganizationManager && (
              <OrganizationLectures />
            )}
            {organizationCurrentPage === 'profile' && <Profile />}
            {organizationCurrentPage === 'appearance' && <Appearance />}
          </div>
        </div>
      </div>
    );
  };

  const renderComponent = () => {
    // Handle organization-related pages
    if (currentPage === 'organizations') {
      if (showCreateOrgForm) {
        return (
          <CreateOrganizationForm
            onSuccess={handleCreateOrganizationSuccess}
            onCancel={handleCreateOrganizationCancel}
          />
        );
      }
      
      // Show organization login for all specified user roles
      if (!organizationLoginData && ['InstituteAdmin', 'Student', 'Teacher', 'OrganizationManager'].includes(user?.role || '')) {
        return (
          <OrganizationLogin
            onLogin={handleOrganizationLogin}
            onBack={handleBackToMain}
          />
        );
      }
      
      // Show organization navigation after login
      if (organizationLoginData) {
        return <OrganizationNavigation />;
      }
      
      if (!selectedOrganization) {
        return (
          <OrganizationSelector
            onOrganizationSelect={handleOrganizationSelect}
            onBack={handleBackToMain}
            onCreateOrganization={handleCreateOrganization}
            userPermissions={organizationLoginData?.permissions}
          />
        );
      }
    }

    if (currentPage === 'organization-selector') {
      return (
        <OrganizationSelector
          onOrganizationSelect={handleOrganizationSelect}
          onBack={handleBackToMain}
          onCreateOrganization={handleCreateOrganization}
          userPermissions={organizationLoginData?.permissions}
        />
      );
    }

    // For Organization Manager - show organizations list or organization-specific dashboard
    if (user?.role === 'OrganizationManager') {
      if (!selectedOrganization && currentPage !== 'organizations') {
        return <Organizations />;
      }

      // Add Organization Header for specific sections
      const shouldShowOrgHeader = ['dashboard', 'students', 'lectures', 'gallery'].includes(currentPage);
      
      const getPageTitle = () => {
        switch (currentPage) {
          case 'dashboard': return 'Dashboard';
          case 'students': return 'Students';
          case 'lectures': return 'Lectures';
          case 'gallery': return 'Gallery';
          default: return 'Management';
        }
      };

      const renderWithHeader = (component: React.ReactNode) => (
        <>
          {shouldShowOrgHeader && <OrganizationHeader title={getPageTitle()} />}
          {component}
        </>
      );

      switch (currentPage) {
        case 'organizations':
          return <Organizations />;
        case 'dashboard':
          return renderWithHeader(<Dashboard />);
        case 'students':
          return renderWithHeader(<Students />);
        case 'lectures':
          return renderWithHeader(<Lectures />);
        case 'gallery':
          return renderWithHeader(<Gallery />);
        case 'appearance':
          return <Appearance />;
        case 'profile':
          return <Profile />;
        case 'settings':
          return <Settings />;
        default:
          return <Dashboard />;
      }
    }

    // For Student role - simplified interface
    if (user?.role === 'Student') {
      if (!selectedInstitute && user.institutes.length === 1) {
        // Auto-select the only institute available
        // This should be handled by the auth context
      }
      
      if (!selectedInstitute && currentPage !== 'institutes' && currentPage !== 'select-institute') {
        return <InstituteSelector />;
      }

      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'attendance':
          return <Attendance />;
        case 'lectures':
          return <Lectures />;
        case 'homework':
          return <Homework />;
        case 'exams':
          return <Exams />;
        case 'results':
          return <Results />;
        case 'profile':
          return <Profile />;
        case 'select-institute':
          return <InstituteSelector />;
        case 'appearance':
          return <Appearance />;
        case 'payments':
          return <Payment />;
        default:
          return <Dashboard />;
      }
    }

    // For Parent role
    if (user?.role === 'Parent') {
      if (currentPage === 'parent-children') {
        return <ParentChildrenSelector />;
      }

      if (!selectedChild && currentPage !== 'parent-children' && currentPage !== 'profile') {
        return <ParentChildrenSelector />;
      }

      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'attendance':
          return <Attendance />;
        case 'homework':
          return <Homework />;
        case 'results':
          return <Results />;
        case 'exams':
          return <Exams />;
        case 'profile':
          return <Profile />;
        case 'parent-children':
          return <ParentChildrenSelector />;
        case 'appearance':
          return <Appearance />;
        default:
          return <ParentChildrenSelector />;
      }
    }

    // For Teacher role
    if (user?.role === 'Teacher') {
      if (!selectedInstitute && currentPage !== 'institutes' && currentPage !== 'select-institute') {
        return <InstituteSelector />;
      }

      if (currentPage === 'select-class') {
        return <ClassSelector />;
      }

      if (currentPage === 'select-subject') {
        return <SubjectSelector />;
      }

      const classRequiredPages = ['attendance-marking', 'grading'];
      if (selectedInstitute && !selectedClass && classRequiredPages.includes(currentPage)) {
        return <ClassSelector />;
      }

      const subjectRequiredPages = ['lectures'];
      if (selectedClass && !selectedSubject && subjectRequiredPages.includes(currentPage)) {
        return <SubjectSelector />;
      }

      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'students':
          return <Students />;
        case 'parents':
          return <Parents />;
        case 'classes':
          return <Classes />;
        case 'subjects':
          return <Subjects />;
        case 'select-institute':
          return <InstituteSelector />;
        case 'grading':
        case 'grades-table':
        case 'create-grade':
        case 'assign-grade-classes':
        case 'view-grade-classes':
          return <Grading />;
        case 'attendance':
          return <Attendance />;
        case 'attendance-marking':
          return <AttendanceMarking onNavigate={setCurrentPage} />;
        case 'qr-attendance':
          return <QRAttendance />;
        case 'lectures':
          return user?.role === 'Teacher' ? <TeacherLectures /> : <Lectures />;
        case 'homework':
          return user?.role === 'Teacher' ? <TeacherHomework /> : <Homework />;
        case 'exams':
          return user?.role === 'Teacher' ? <TeacherExams /> : <Exams />;
        case 'results':
          return <Results />;
        case 'profile':
          return <Profile />;
        case 'appearance':
          return <Appearance />;
        case 'payments':
          return <Payment />;
        default:
          return <Dashboard />;
      }
    }

    // For AttendanceMarker role
    if (user?.role === 'AttendanceMarker') {
      if (!selectedInstitute && currentPage !== 'select-institute') {
        return <InstituteSelector />;
      }

      if (currentPage === 'select-class') {
        return <ClassSelector />;
      }

      if (currentPage === 'select-subject') {
        return <AttendanceMarkerSubjectSelector />;
      }

      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'qr-attendance':
          return <QRAttendance />;
        case 'attendance-marking':
          return <AttendanceMarking onNavigate={setCurrentPage} />;
        case 'profile':
          return <Profile />;
        case 'select-institute':
          return <InstituteSelector />;
        case 'select-class':
          return <ClassSelector />;
        case 'appearance':
          return <Appearance />;
        case 'settings':
          return <Settings />;
        default:
          return <QRAttendance />;
      }
    }

    // For InstituteAdmin and other roles - full access within their institute
    // Allow specific pages for InstituteAdmin, Teacher, Student when no institute is selected
    const allowedPagesWithoutInstitute = ['payments', 'profile', 'appearance', 'organizations', 'select-institute', 'institutes'];
    const restrictedUserTypes = ['InstituteAdmin', 'Teacher', 'Student'];
    
    if (!selectedInstitute && 
        !allowedPagesWithoutInstitute.includes(currentPage) && 
        restrictedUserTypes.includes(user?.role || '')) {
      return <InstituteSelector />;
    }
    
    // For other roles, redirect to institute selector if no institute selected
    if (!selectedInstitute && 
        currentPage !== 'institutes' && 
        currentPage !== 'select-institute' && 
        !restrictedUserTypes.includes(user?.role || '')) {
      return <InstituteSelector />;
    }

    if (currentPage === 'select-class') {
      return <ClassSelector />;
    }

    if (currentPage === 'select-subject') {
      return <SubjectSelector />;
    }

    const classRequiredPages = ['attendance-marking', 'grading'];
    if (selectedInstitute && !selectedClass && classRequiredPages.includes(currentPage)) {
      return <ClassSelector />;
    }

    const subjectRequiredPages = ['lectures'];
    if (selectedClass && !selectedSubject && subjectRequiredPages.includes(currentPage)) {
      return <SubjectSelector />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'institute-users':
        return <InstituteUsers />;
      case 'users':
        // Show InstituteUsers for InstituteAdmin
        if (user?.role === 'InstituteAdmin') {
          return <InstituteUsers />;
        }
        return <Users />;
      case 'students':
        return <Students />;
      case 'teachers':
        return <Teachers />;
      case 'parents':
        return <Parents />;
      case 'grades':
        return <Grades />;
      case 'classes':
        return <Classes />;
      case 'subjects':
        return <Subjects />;
      case 'institutes':
        return <Institutes />;
      case 'select-institute':
        return <InstituteSelector />;
      case 'grading':
      case 'grades-table':
      case 'create-grade':
      case 'assign-grade-classes':
      case 'view-grade-classes':
        return <Grading />;
      case 'attendance':
        return <Attendance />;
      case 'attendance-marking':
        return <AttendanceMarking onNavigate={setCurrentPage} />;
      case 'attendance-markers':
        return <AttendanceMarkers />;
      case 'qr-attendance':
        return <QRAttendance />;
      case 'lectures':
        return <Lectures />;
      case 'homework':
        return <Homework />;
      case 'exams':
        return <Exams />;
      case 'results':
        return <Results />;
      case 'teacher-students':
        return <TeacherStudents />;
      case 'teacher-homework':
        return <TeacherHomework />;
      case 'teacher-exams':
        return <TeacherExams />;
      case 'teacher-lectures':
        return <TeacherLectures />;
      case 'profile':
        return <Profile />;
      case 'institute-details':
        return <InstituteDetails />;
      case 'appearance':
        return <Appearance />;
      case 'payments':
        return <Payment />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLogin={() => {}} loginFunction={login} />;
  }

  // If organizations page is active with login data, render organization navigation
  if (currentPage === 'organizations' && organizationLoginData) {
    return renderComponent();
  }

  // If organizations page is active without login data, render full screen
  if (currentPage === 'organizations' && !selectedOrganization && !organizationLoginData) {
    return renderComponent();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex w-full h-screen">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header onMenuClick={handleMenuClick} />
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            <div className="max-w-full">
              {renderComponent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppContent;
