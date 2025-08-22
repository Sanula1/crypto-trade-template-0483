
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Users, CheckCircle, RefreshCw, MapPin, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstituteApiResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  imageUrl: string;
}

const InstituteSelector = () => {
  const { user, setSelectedInstitute } = useAuth();
  const { toast } = useToast();
  const [institutes, setInstitutes] = useState<InstituteApiResponse[]>([]);

  const handleLoadInstitutes = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "No user ID available",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Loading user institutes...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/users/${user.id}/institutes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error('Server returned non-JSON response');
      }

      const result: InstituteApiResponse[] = await response.json();
      console.log('Institutes API Response:', result);
      
      // Filter out any invalid institute data
      const validInstitutes = result.filter(institute => 
        institute && 
        institute.id && 
        institute.name
      );
      
      setInstitutes(validInstitutes);
      
      toast({
        title: "Data Loaded",
        description: `Successfully loaded ${validInstitutes.length} institutes.`
      });
    } catch (error) {
      console.error('Error loading institutes:', error);
      toast({
        title: "Error",
        description: "Failed to load institutes",
        variant: "destructive",
      });
    }
  };

  const handleSelectInstitute = (institute: InstituteApiResponse) => {
    if (!institute || !institute.id) {
      toast({
        title: "Error",
        description: "Invalid institute data",
        variant: "destructive",
      });
      return;
    }

    const selectedInstitute = {
      id: institute.id,
      name: institute.name,
      code: institute.id, // Using id as code since it's not in the API response
      description: `${institute.address || ''}, ${institute.city || ''}`.trim(),
      isActive: institute.isActive
    };
    setSelectedInstitute(selectedInstitute);
    
    toast({
      title: "Institute Selected",
      description: `Selected institute: ${selectedInstitute.name}`
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Select Institute
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose an institute to continue to your dashboard
        </p>
      </div>

      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Click the button below to load your institutes.
        </p>
        <Button 
          onClick={handleLoadInstitutes}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Load Institutes
        </Button>
      </div>

      {institutes.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Institutes ({institutes.length})
            </h2>
            <Button 
              onClick={handleLoadInstitutes}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {institutes.map((institute) => {
              return (
                <Card 
                  key={institute.id} 
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-blue-500"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Institute Image */}
                    <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
                      <img
                        src={institute.imageUrl || '/placeholder.svg'}
                        alt={institute.name || 'Institute'}
                        className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Institute Details */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-6 w-6 text-blue-600" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {institute.name}
                            </h3>
                            {institute.isActive && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-1">
                            ID: {institute.id}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Type: {institute.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {institute.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>{institute.email}</span>
                          </div>
                        )}
                        {institute.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{institute.phone}</span>
                          </div>
                        )}
                        {(institute.address || institute.city || institute.state || institute.country) && (
                          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                            <span>
                              {[
                                institute.address,
                                institute.city,
                                institute.state,
                                institute.country
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                        onClick={() => handleSelectInstitute(institute)}
                      >
                        Select Institute
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default InstituteSelector;
