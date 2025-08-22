import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl, getApiHeaders } from '@/contexts/utils/auth.api';

interface UpdateHomeworkFormProps {
  homework: any;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateHomeworkForm = ({ homework, onClose, onSuccess }: UpdateHomeworkFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: homework.title || '',
    description: homework.description || '',
    instructions: homework.instructions || '',
    startDate: homework.startDate ? new Date(homework.startDate).toISOString().slice(0, 16) : '',
    dueDate: homework.endDate ? new Date(homework.endDate).toISOString().slice(0, 16) : '',
    maxMarks: homework.maxMarks?.toString() || '',
    attachmentUrl: homework.attachmentUrl || '',
    isActive: homework.isActive ?? true
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        maxMarks: formData.maxMarks ? parseInt(formData.maxMarks) : null,
        attachmentUrl: formData.attachmentUrl || null,
        isActive: formData.isActive
      };

      const baseUrl = getBaseUrl();
      const response = await fetch(
        `${baseUrl}/institute-class-subject-homeworks/${homework.id}`,
        {
          method: 'PATCH',
          headers: getApiHeaders(),
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Homework updated successfully"
        });
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update homework');
      }
    } catch (error) {
      console.error('Error updating homework:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update homework",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Update Homework</CardTitle>
              <CardDescription>Update homework assignment details</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter homework title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxMarks">Max Marks</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => handleInputChange('maxMarks', e.target.value)}
                  placeholder="Enter maximum marks"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter homework description"
                required
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Enter detailed instructions for students"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="attachmentUrl">Attachment URL</Label>
              <Input
                id="attachmentUrl"
                value={formData.attachmentUrl}
                onChange={(e) => handleInputChange('attachmentUrl', e.target.value)}
                placeholder="Enter attachment URL (optional)"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update Homework'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateHomeworkForm;
