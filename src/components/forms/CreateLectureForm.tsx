import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { Loader2, Upload, X, Plus, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  grade: z.coerce.number().min(1, "Grade is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lessonNumber: z.coerce.number().min(1, "Lesson number is required"),
  lectureNumber: z.coerce.number().min(1, "Lecture number is required"),
  provider: z.string().optional(),
  lectureLink: z.string().url().optional().or(z.literal("")),
  lectureVideoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface DocumentItem {
  name: string;
  file: File | null;
  url?: string;
  type: string;
}

interface CreateLectureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLectureForm({
  open,
  onOpenChange,
  onSuccess,
}: CreateLectureFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: "",
      grade: 10,
      title: "",
      description: "",
      lessonNumber: 1,
      lectureNumber: 1,
      provider: "",
      lectureLink: "",
      lectureVideoUrl: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      fetchSubjects();
    }
  }, [open]);

  const fetchSubjects = async () => {
    try {
      const response = await api.getSubjects(1, 100);
      if (Array.isArray(response)) {
        setSubjects(response);
      } else {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImageFile(file);
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
  };

  const addDocument = () => {
    setDocuments([...documents, { name: "", file: null, type: "PDF" }]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleDocumentChange = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    setDocuments(updated);
  };

  const handleDocumentFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDocumentChange(index, "file", file);
      if (!documents[index].name) {
        handleDocumentChange(index, "name", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      let coverImageUrl = "";

      // Upload cover image
      if (coverImageFile) {
        const coverResult = await uploadFile(coverImageFile, "structured-lecture-covers");
        coverImageUrl = coverResult.relativePath;
      }

      // Upload documents
      const uploadedDocuments: { name: string; url: string; type: string }[] = [];
      const documentUrls: string[] = [];

      for (const doc of documents) {
        if (doc.file) {
          const docResult = await uploadFile(doc.file, "structured-lecture-documents");
          uploadedDocuments.push({
            name: doc.name || doc.file.name,
            url: docResult.relativePath,
            type: doc.type,
          });
          documentUrls.push(docResult.relativePath);
        }
      }

      const payload = {
        ...data,
        coverImageUrl: coverImageUrl || undefined,
        documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
        documents: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
        lectureLink: data.lectureLink || undefined,
        lectureVideoUrl: data.lectureVideoUrl || undefined,
        provider: data.provider || undefined,
      };

      await api.createStructuredLecture(payload);

      toast({
        title: "Success",
        description: "Lecture created successfully",
      });

      form.reset();
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setDocuments([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to create lecture:", error);
      toast({
        title: "Error",
        description: "Failed to create lecture",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Structured Lecture</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Subject and Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={13} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lecture title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Lecture description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lesson and Lecture Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="lessonNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Number *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lectureNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecture Number *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lectureLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecture Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://zoom.us/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lectureVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://cdn.example.com/video.mp4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <FormLabel>Cover Image</FormLabel>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  {coverImagePreview ? (
                    <div className="relative">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-40 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeCoverImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-4">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground mt-2">
                        Click to upload cover image (JPEG, PNG, WebP - Max 10MB)
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Documents</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Document
                  </Button>
                </div>
                {documents.map((doc, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Document name"
                        value={doc.name}
                        onChange={(e) => handleDocumentChange(index, "name", e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Select
                          value={doc.type}
                          onValueChange={(value) => handleDocumentChange(index, "type", value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="IMAGE">Image</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex-1">
                          <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-2 hover:bg-muted/50">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">
                              {doc.file ? doc.file.name : "Choose file..."}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png"
                              className="hidden"
                              onChange={(e) => handleDocumentFileChange(index, e)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Is Active */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Make this lecture active and visible
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Lecture
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
