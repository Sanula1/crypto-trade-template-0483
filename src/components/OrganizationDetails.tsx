import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, BookOpen, Camera, Presentation, Link } from 'lucide-react';
import { Organization } from '@/api/organization.api';
import OrganizationGallery from './OrganizationGallery';
import OrganizationCourses from './OrganizationCourses';
import OrganizationCourseLectures from './OrganizationCourseLectures';
import OrganizationMembers from './OrganizationMembers';
import AssignInstituteDialog from './AssignInstituteDialog';

interface OrganizationDetailsProps {
  organization: Organization;
  userRole: string;
  onBack: () => void;
}

type NavigationTab = 'gallery' | 'courses' | 'lectures' | 'members';

const OrganizationDetails = ({ organization, userRole, onBack }: OrganizationDetailsProps) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('gallery');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Define navigation tabs based on user role
  const getNavigationTabs = () => {
    const commonTabs = [
      { id: 'gallery' as NavigationTab, label: 'Gallery', icon: Camera },
      { id: 'courses' as NavigationTab, label: 'Courses', icon: BookOpen },
    ];

    if (userRole === 'OrganizationManager') {
      return [
        ...commonTabs,
        { id: 'lectures' as NavigationTab, label: 'Lectures', icon: Presentation },
        { id: 'members' as NavigationTab, label: 'Members', icon: Users },
      ];
    }

    return commonTabs;
  };

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course);
    setActiveTab('lectures');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setActiveTab('courses');
  };

  const renderContent = () => {
    if (activeTab === 'lectures' && selectedCourse) {
      return (
        <OrganizationCourseLectures 
          course={selectedCourse} 
          onBack={handleBackToCourses}
        />
      );
    }

    switch (activeTab) {
      case 'gallery':
        return <OrganizationGallery organizationId={organization.organizationId} />;
      case 'courses':
        return (
          <OrganizationCourses 
            organizationId={organization.organizationId}
            onSelectCourse={handleCourseSelect}
          />
        );
      case 'lectures':
        return <OrganizationCourseLectures course={null} onBack={() => {}} />;
      case 'members':
        return <OrganizationMembers organizationId={organization.organizationId} />;
      default:
        return <OrganizationGallery organizationId={organization.organizationId} />;
    }
  };

  const navigationTabs = getNavigationTabs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              {organization.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userRole === 'OrganizationManager' 
                ? 'Manage organization details and content' 
                : 'View organization content'
              }
            </p>
          </div>
        </div>
        
        {/* Assign to Institute Button for OrganizationManager */}
        {userRole === 'OrganizationManager' && (
          <Button onClick={() => setShowAssignDialog(true)} className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Assign to Institute
          </Button>
        )}
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="text-lg">{organization.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Visibility</label>
              <p className="text-lg">{organization.isPublic ? 'Public' : 'Private'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Institute ID</label>
              <p className="text-lg">{organization.instituteId || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        {navigationTabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>

      {/* Assign Institute Dialog */}
      <AssignInstituteDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        organizationId={organization.organizationId}
      />
    </div>
  );
};

export default OrganizationDetails;
