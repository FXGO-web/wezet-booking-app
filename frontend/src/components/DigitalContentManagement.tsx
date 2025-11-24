import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Edit, Video, Music, FileText, Folder, Clock, Loader2, Download } from "lucide-react";
import { digitalContentAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { DigitalContentModal } from "./DigitalContentModal";
import { AdvancedFilters, FilterConfig, FilterValues } from "./AdvancedFilters";
import { SortableTable, Column } from "./SortableTable";
import { toast } from "sonner";

interface DigitalContent {
  id: string;
  title: string;
  type: "video" | "audio" | "pdf" | "program";
  category: string;
  duration?: string;
  lastUpdated: string;
  status: "published" | "draft";
  thumbnailUrl?: string;
  description?: string;
}

const contentTypeIcons = {
  video: Video,
  audio: Music,
  pdf: FileText,
  program: Folder,
};

const contentTypeLabels = {
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  program: "Program",
};

const contentTypeColors = {
  video: "bg-purple-100 text-purple-800",
  audio: "bg-blue-100 text-blue-800",
  pdf: "bg-red-100 text-red-800",
  program: "bg-green-100 text-green-800",
};

export function DigitalContentManagement() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [content, setContent] = useState<DigitalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<DigitalContent | undefined>(undefined);
  const { getAccessToken } = useAuth();

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'type',
      label: 'Content Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'video', label: 'Video' },
        { value: 'audio', label: 'Audio' },
        { value: 'pdf', label: 'PDF' },
        { value: 'program', label: 'Program' },
      ],
      placeholder: 'Filter by type',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
      ],
      placeholder: 'Filter by status',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text',
      placeholder: 'Filter by category',
    },
    {
      key: 'dateFrom',
      label: 'Updated From',
      type: 'date',
      placeholder: 'Start date',
    },
  ];

  // Table columns configuration
  const columns: Column[] = [
    {
      key: 'title',
      label: 'Content',
      sortable: true,
      width: '35%',
      render: (value: string, row: DigitalContent) => {
        const Icon = contentTypeIcons[row.type];
        return (
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${contentTypeColors[row.type]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{value}</div>
              <div className="text-xs text-muted-foreground truncate">{row.category}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" className={contentTypeColors[value as keyof typeof contentTypeColors]}>
          {contentTypeLabels[value as keyof typeof contentTypeLabels]}
        </Badge>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value: string | undefined) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge
          variant="secondary"
          className={
            value === "published"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: DigitalContent) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch content from API
  const fetchContent = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterValues.search) filters.search = filterValues.search;
      if (filterValues.type && filterValues.type !== 'all') filters.type = filterValues.type;
      if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status;
      if (filterValues.category) filters.category = filterValues.category;

      const { content: data } = await digitalContentAPI.getAll(filters);
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [filterValues]);

  const handleAddClick = () => {
    setSelectedContent(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: DigitalContent) => {
    setSelectedContent(item);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchContent();
  };

  const handleExport = () => {
    const headers = ['Title', 'Type', 'Category', 'Duration', 'Last Updated', 'Status'];
    const rows = filteredContent.map(c => [
      c.title,
      contentTypeLabels[c.type],
      c.category,
      c.duration || 'N/A',
      new Date(c.lastUpdated).toLocaleDateString(),
      c.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-content-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredContent.length} content items`);
  };

  // Apply filters
  const filteredContent = content.filter(item => {
    // Date filter
    if (filterValues.dateFrom) {
      const itemDate = new Date(item.lastUpdated);
      const fromDate = new Date(filterValues.dateFrom);
      if (itemDate < fromDate) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1>Digital Content Library</h1>
            <p className="text-muted-foreground">
              Manage videos, audio sessions, PDFs & wellness programs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </div>
        </div>

        {/* Content Type Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(contentTypeIcons).map(([type, Icon]) => {
            const count = filteredContent.filter(c => c.type === type).length;
            const colorClass = contentTypeColors[type as keyof typeof contentTypeColors];
            
            return (
              <Card
                key={type}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setFilterValues({ ...filterValues, type })}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <div className={`h-12 w-12 mx-auto rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {contentTypeLabels[type as keyof typeof contentTypeLabels]}
                    </div>
                    <div className="text-xs text-muted-foreground">{count} items</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filterConfig}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
          onExport={handleExport}
          searchPlaceholder="Search content..."
          showExport={false}
        />

        {/* Content Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SortableTable
            columns={columns}
            data={filteredContent}
            keyExtractor={(item) => item.id}
            onRowClick={handleEditClick}
            emptyMessage="No content found matching your filters"
          />
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredContent.length} of {content.length} content items
          </div>
        )}
      </div>

      {/* Content Modal */}
      <DigitalContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={selectedContent}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
