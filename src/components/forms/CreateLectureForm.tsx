import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';

interface CreateLectureFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLectureForm = ({ onClose, onSuccess }: CreateLectureFormProps) => {
  const { user, currentInstituteId, currentClassId, currentSubjectId } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lectureType: 'physical',
    startTime: '',
    endTime: '',
    venue: '',
    meetingLink: '',
    meetingId: '',
    meetingPassword: '',
    recordingUrl: '',
    maxParticipants: 50
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInstituteId || !currentClassId || !currentSubjectId) {
      toast({
        title: "Missing Selection",
        description: "Please select institute, class, and subject first.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const lectureData = {
        instituteId: currentInstituteId,
        classId: currentClassId,
        subjectId: currentSubjectId,
        instructorId: user.id,
        lectures: {
          title: formData.title,
          lectureType: formData.lectureType,
          startTime: formData.startTime,
          endTime: formData.endTime,
          description: formData.description,
          venue: formData.venue,
          meetingLink: formData.meetingLink,
          meetingId: formData.meetingId,
          recodingUrl: formData.recordingUrl, // Note: API uses "recodingUrl" 
          maxParticipants: formData.maxParticipants,
          meetingPassword: formData.meetingPassword
        }
      };

      console.log('Creating lecture with data:', lectureData);
      
      const response = await apiClient.post('/institute-class-subject-lectures', lectureData);
      
      console.log('Lecture created successfully:', response.data);
      
      toast({
        title: "Lecture Created",
        description: `Lecture "${formData.title}" has been created successfully.`
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating lecture:', error);
      toast({
        title: "Creation Failed",
        description: error?.response?.data?.message || "Failed to create lecture.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter lecture title"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter lecture description"
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="lectureType" className="text-sm font-medium">Lecture Type *</Label>
                <Select value={formData.lectureType} onValueChange={(value) => handleInputChange('lectureType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select lecture type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-sm font-medium">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-sm font-medium">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venue" className="text-sm font-medium">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="Enter venue (e.g., Room B-201, Zoom)"
                  className="mt-1"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Meeting Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meetingLink" className="text-sm font-medium">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  placeholder="https://example.com/meeting/thermo"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meetingId" className="text-sm font-medium">Meeting ID</Label>
                  <Input
                    id="meetingId"
                    value={formData.meetingId}
                    onChange={(e) => handleInputChange('meetingId', e.target.value)}
                    placeholder="555001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="meetingPassword" className="text-sm font-medium">Meeting Password</Label>
                  <Input
                    id="meetingPassword"
                    value={formData.meetingPassword}
                    onChange={(e) => handleInputChange('meetingPassword', e.target.value)}
                    placeholder="heat2025"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recordingUrl" className="text-sm font-medium">Recording URL</Label>
                <Input
                  id="recordingUrl"
                  type="url"
                  value={formData.recordingUrl}
                  onChange={(e) => handleInputChange('recordingUrl', e.target.value)}
                  placeholder="https://meet.google.com/tjp-pxtj-hda"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="maxParticipants" className="text-sm font-medium">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Creating...' : 'Create Lecture'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateLectureForm;