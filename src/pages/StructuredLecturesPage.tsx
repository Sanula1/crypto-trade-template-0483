import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, ActionButton } from "@/components/shared/PageComponents";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DataTable, Column, PaginationMeta } from "@/components/shared/DataTable";
import { ViewDetailsDialog } from "@/components/shared/ViewDetailsDialog";
import { CreateLectureForm } from "@/components/forms/CreateLectureForm";
import { DocumentsPopover } from "@/components/shared/DocumentsPopover";
interface LectureDocument {
  documentName: string;
  documentUrl: string;
}

interface Lecture {
  _id: string;
  title: string;
  description: string;
  subjectId: string;
  grade: number;
  lessonNumber: number;
  lectureNumber: number;
  lectureLink: string;
  coverImageUrl: string;
  documents: LectureDocument[];
  isActive: boolean;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function StructuredLecturesPage() {
  const { toast } = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    fetchLectures();
  }, [page, limit]);

  const fetchLectures = async () => {
    try {
      setIsLoading(true);
      const response = await api.getStructuredLectures(page, limit);
      setLectures(response.lectures || []);
      setPagination({
        page: response.currentPage || page,
        limit: response.limit || limit,
        total: response.total || 0,
        totalPages: response.totalPages || 1,
      });
    } catch (error) {
      console.error("Failed to fetch lectures:", error);
      toast({
        title: "Error",
        description: "Failed to load lectures",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLecture = () => {
    setCreateDialogOpen(true);
  };

  const handleView = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setViewDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const columns: Column[] = [
    { key: "coverImageUrl", label: "Cover", type: "image" },
    { key: "_id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "grade", label: "Grade", type: "badge" },
    { key: "lessonNumber", label: "Lesson #" },
    { key: "lectureNumber", label: "Lecture #" },
    { 
      key: "documents", 
      label: "Documents", 
      render: (value) => <DocumentsPopover documents={value || []} />
    },
    { key: "isActive", label: "Active", type: "badge" },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Structured Lectures"
        description="Manage all structured lectures and learning materials"
        icon={GraduationCap}
        actions={<ActionButton label="Create Lecture" onClick={handleCreateLecture} />}
      />
      
      <DataTable
        columns={columns}
        data={lectures}
        isLoading={isLoading}
        onView={handleView}
        pagination={pagination || undefined}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <ViewDetailsDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        data={selectedLecture}
        title={selectedLecture?.title || "Lecture Details"}
        imageKey="coverImageUrl"
      />

      <CreateLectureForm
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchLectures}
      />
    </DashboardLayout>
  );
}
