import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl } from '@/contexts/utils/auth.api';

interface CreateClassFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CreateClassForm = ({ onSubmit, onCancel }: CreateClassFormProps) => {
  const { user, selectedInstitute } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    academicYear: '',
    level: 10,
    grade: 10,
    specialty: '',
    classType: 'REGULAR',
    capacity: 30,
    classTeacherId: '',
    description: '',
    isActive: true,
    startDate: '',
    endDate: '',
    enrollmentCode: '',
    enrollmentEnabled: true,
    requireTeacherVerification: true,
    imageUrl: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getApiHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInstitute?.id) {
      toast({
        title: "Missing Selection",
        description: "Please select an institute first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const classData = {
        instituteId: selectedInstitute.id,
        name: formData.name,
        code: formData.code,
        academicYear: formData.academicYear,
        level: formData.level,
        grade: formData.grade,
        specialty: formData.specialty,
        classType: formData.classType,
        capacity: formData.capacity,
        classTeacherId: formData.classTeacherId || undefined,
        description: formData.description,
        isActive: formData.isActive,
        startDate: formData.startDate,
        endDate: formData.endDate,
        enrollmentCode: formData.enrollmentCode,
        enrollmentEnabled: formData.enrollmentEnabled,
        requireTeacherVerification: formData.requireTeacherVerification,
        imageUrl: formData.imageUrl
      };

      const response = await fetch(`${getBaseUrl()}/institute-classes`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(classData)
      });

      if (response.ok) {
        const responseData = await response.json();
        toast({
          title: "Class Created",
          description: `Class "${formData.name}" has been created successfully.`
        });
        onSubmit(responseData);
      } else {
        throw new Error('Failed to create class');
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error?.response?.data?.message || "Failed to create class.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                placeholder="Grade 10 Science - A"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Class Code</Label>
              <Input
                id="code"
                placeholder="G10SA"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                placeholder="2025/2026"
                value={formData.academicYear}
                onChange={(e) => handleInputChange('academicYear', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                placeholder="Science Stream"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="13"
                value={formData.level}
                onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                type="number"
                min="1"
                max="13"
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="classType">Class Type</Label>
              <Select value={formData.classType} onValueChange={(value) => handleInputChange('classType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="REMEDIAL">Remedial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="enrollmentCode">Enrollment Code</Label>
              <Input
                id="enrollmentCode"
                placeholder="2025"
                value={formData.enrollmentCode}
                onChange={(e) => handleInputChange('enrollmentCode', e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enrollmentEnabled"
                checked={formData.enrollmentEnabled}
                onCheckedChange={(checked) => handleInputChange('enrollmentEnabled', checked)}
              />
              <Label htmlFor="enrollmentEnabled">Enable Enrollment</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireTeacherVerification"
                checked={formData.requireTeacherVerification}
                onCheckedChange={(checked) => handleInputChange('requireTeacherVerification', checked)}
              />
              <Label htmlFor="requireTeacherVerification">Require Teacher Verification</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Grade 10 science class focused on preparing students for O/L exams."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Active Class</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Class'}
        </Button>
      </div>
    </form>
  );
};

export default CreateClassForm;