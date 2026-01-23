import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { systemAdminUserApi } from '@/api/systemAdminUser.api';
import { CreateFamilyUnitRequest, Gender } from '@/types/user.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, UserPlus, Loader2 } from 'lucide-react';

// All fields are optional
const minimalUserSchema = z.object({
  firstName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  nameWithInitials: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  nic: z.string().optional().or(z.literal('')),
  birthCertificateNo: z.string().optional().or(z.literal('')),
  addressLine1: z.string().optional().or(z.literal('')),
  addressLine2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  bloodGroup: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
});

const formSchema = z.object({
  student: minimalUserSchema.extend({
    studentId: z.string().optional().or(z.literal('')),
  }),
  father: minimalUserSchema.optional(),
  mother: minimalUserSchema.optional(),
  guardian: minimalUserSchema.extend({
    relationshipToStudent: z.string().optional().or(z.literal('')),
  }).optional(),
  sendWelcomeNotifications: z.boolean().default(true),
  instituteCode: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

const provinces = [
  'Central', 'Eastern', 'North Central', 'Northern', 'North Western',
  'Sabaragamuwa', 'Southern', 'Uva', 'Western'
];

const districts = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle',
  'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
  'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface CreateFamilyUnitFormProps {
  onSuccess?: () => void;
}

export function CreateFamilyUnitForm({ onSuccess }: CreateFamilyUnitFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showFather, setShowFather] = useState(false);
  const [showMother, setShowMother] = useState(false);
  const [showGuardian, setShowGuardian] = useState(false);

  const defaultUserValues = {
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    nameWithInitials: '',
    gender: undefined,
    dateOfBirth: '',
    nic: '',
    birthCertificateNo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    district: '',
    occupation: '',
    bloodGroup: '',
    allergies: '',
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student: { ...defaultUserValues, studentId: '' },
      father: { ...defaultUserValues },
      mother: { ...defaultUserValues },
      guardian: { ...defaultUserValues, relationshipToStudent: '' },
      sendWelcomeNotifications: true,
      instituteCode: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    // Validate: Student must have email OR phone
    if (!data.student.email && !data.student.phoneNumber) {
      toast({
        title: 'Validation Error',
        description: 'Student must have either email or phone number',
        variant: 'destructive',
      });
      return;
    }

    // Build request
    const request: CreateFamilyUnitRequest = {
      student: cleanUserData(data.student),
      sendWelcomeNotifications: data.sendWelcomeNotifications,
      instituteCode: data.instituteCode || undefined,
    };

    // Add optional parents if toggled and have contact info
    if (showFather && data.father && (data.father.email || data.father.phoneNumber)) {
      request.father = cleanUserData(data.father);
    }
    if (showMother && data.mother && (data.mother.email || data.mother.phoneNumber)) {
      request.mother = cleanUserData(data.mother);
    }
    if (showGuardian && data.guardian && (data.guardian.email || data.guardian.phoneNumber)) {
      request.guardian = cleanUserData(data.guardian);
    }

    setLoading(true);
    try {
      const result = await systemAdminUserApi.createFamilyUnit(request);
      toast({
        title: 'Success',
        description: `Family created! Student ID: ${result.student.studentId}`,
      });

      if (result.notificationsSent.student) {
        toast({
          title: 'Notification Sent',
          description: 'Welcome notification sent to student',
        });
      }

      form.reset();
      setShowFather(false);
      setShowMother(false);
      setShowGuardian(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create family unit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanUserData = (data: any) => {
    const cleaned: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  // Reusable field components for each person
  const PersonFields = ({ prefix, showStudentId = false, showRelationship = false }: {
    prefix: 'student' | 'father' | 'mother' | 'guardian';
    showStudentId?: boolean;
    showRelationship?: boolean;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Contact Information */}
      <FormField
        control={form.control}
        name={`${prefix}.email` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="email@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.phoneNumber` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="+94771234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Personal Information */}
      <FormField
        control={form.control}
        name={`${prefix}.firstName` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input placeholder="First name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.lastName` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input placeholder="Last name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.nameWithInitials` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name with Initials</FormLabel>
            <FormControl>
              <Input placeholder="e.g., K. Silva" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.gender` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gender</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={Gender.MALE}>Male</SelectItem>
                <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                <SelectItem value={Gender.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.dateOfBirth` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Birth</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.nic` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>NIC</FormLabel>
            <FormControl>
              <Input placeholder="National ID Card number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.birthCertificateNo` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Birth Certificate No</FormLabel>
            <FormControl>
              <Input placeholder="Birth certificate number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Student ID - Only for student */}
      {showStudentId && (
        <FormField
          control={form.control}
          name="student.studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID</FormLabel>
              <FormControl>
                <Input placeholder="Auto-generated if empty" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Relationship - Only for guardian */}
      {showRelationship && (
        <FormField
          control={form.control}
          name="guardian.relationshipToStudent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship to Student</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Uncle, Aunt, Grandparent" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Address Information */}
      <FormField
        control={form.control}
        name={`${prefix}.addressLine1` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 1</FormLabel>
            <FormControl>
              <Input placeholder="Street address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.addressLine2` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2</FormLabel>
            <FormControl>
              <Input placeholder="Apartment, suite, etc." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.city` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl>
              <Input placeholder="City" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.district` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>District</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.province` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Province</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Occupation */}
      <FormField
        control={form.control}
        name={`${prefix}.occupation` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Occupation</FormLabel>
            <FormControl>
              <Input placeholder="Occupation" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Medical Information */}
      <FormField
        control={form.control}
        name={`${prefix}.bloodGroup` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Blood Group</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {bloodGroups.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.allergies` as any}
        render={({ field }) => (
          <FormItem className="md:col-span-2 lg:col-span-1">
            <FormLabel>Allergies</FormLabel>
            <FormControl>
              <Textarea placeholder="List any allergies..." className="min-h-[80px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const ToggleSection = ({
    title,
    icon,
    isOpen,
    onToggle,
    children,
  }: {
    title: string;
    icon: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader className="py-3 cursor-pointer" onClick={onToggle}>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>{icon}</span> {title}
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          {/* Info Banner */}
          <div className="bg-accent/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> All fields are optional. Only Email OR Phone is needed for each person to send welcome notifications.
            </p>
          </div>

          {/* Student Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>👨‍🎓</span> Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PersonFields prefix="student" showStudentId />
            </CardContent>
          </Card>

          {/* Father Section */}
          <ToggleSection
            title="Add Father"
            icon="👨"
            isOpen={showFather}
            onToggle={() => setShowFather(!showFather)}
          >
            <PersonFields prefix="father" />
          </ToggleSection>

          {/* Mother Section */}
          <ToggleSection
            title="Add Mother"
            icon="👩"
            isOpen={showMother}
            onToggle={() => setShowMother(!showMother)}
          >
            <PersonFields prefix="mother" />
          </ToggleSection>

          {/* Guardian Section */}
          <ToggleSection
            title="Add Guardian"
            icon="👤"
            isOpen={showGuardian}
            onToggle={() => setShowGuardian(!showGuardian)}
          >
            <PersonFields prefix="guardian" showRelationship />
          </ToggleSection>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>⚙️</span> Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="sendWelcomeNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Send welcome notifications</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Email/SMS with first-login link
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instituteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., INST001 (auto-enroll)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 sticky bottom-0 bg-background py-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Family Unit
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={loading}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </Form>
    </ScrollArea>
  );
}
