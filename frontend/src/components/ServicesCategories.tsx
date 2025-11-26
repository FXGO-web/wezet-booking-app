import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Edit, Wind, Heart, MessageCircle, BookOpen, Mountain, Loader2, Download, Trash2 } from "lucide-react";
import { servicesAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { ServiceModal } from "./ServiceModal";
import { AdvancedFilters, FilterConfig, FilterValues } from "./AdvancedFilters";
import { SortableTable, Column } from "./SortableTable";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  currency: string;
  category: string;
  description?: string;
  status: "active" | "inactive";
}

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
}

const categories: Category[] = [
  { id: "breathwork", name: "Breathwork", icon: Wind, count: 8 },
  { id: "bodywork", name: "Bodywork", icon: Heart, count: 6 },
  { id: "coaching", name: "Coaching", icon: MessageCircle, count: 5 },
  { id: "education", name: "Education", icon: BookOpen, count: 4 },
  { id: "retreats", name: "Retreats", icon: Mountain, count: 3 },
];

const mockServices: Service[] = [
  {
    id: "1",
    name: "Transformational Breathwork",
    duration: 90,
    price: 150,
    currency: "USD",
    category: "breathwork",
    status: "active",
  },
  {
    id: "2",
    name: "Connected Breathing Session",
    duration: 60,
    price: 120,
    currency: "USD",
    category: "breathwork",
    status: "active",
  },
  {
    id: "3",
    name: "Group Breathwork Circle",
    duration: 120,
    price: 45,
    currency: "USD",
    category: "breathwork",
    status: "active",
  },
  {
    id: "4",
    name: "Somatic Bodywork",
    duration: 75,
    price: 180,
    currency: "USD",
    category: "bodywork",
    status: "active",
  },
  {
    id: "5",
    name: "Energy Healing Session",
    duration: 60,
    price: 160,
    currency: "USD",
    category: "bodywork",
    status: "active",
  },
  {
    id: "6",
    name: "Life Coaching Package",
    duration: 60,
    price: 200,
    currency: "USD",
    category: "coaching",
    status: "active",
  },
  {
    id: "7",
    name: "Weekend Retreat",
    duration: 1440,
    price: 899,
    currency: "USD",
    category: "retreats",
    status: "active",
  },
];

export function ServicesCategories() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const { getAccessToken } = useAuth();

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'breathwork', label: 'Breathwork' },
        { value: 'bodywork', label: 'Bodywork' },
        { value: 'coaching', label: 'Coaching' },
        { value: 'education', label: 'Education' },
        { value: 'retreats', label: 'Retreats' },
      ],
      placeholder: 'Filter by category',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      placeholder: 'Filter by status',
    },
    {
      key: 'minPrice',
      label: 'Min Price',
      type: 'number',
      placeholder: 'Minimum price',
    },
    {
      key: 'maxPrice',
      label: 'Max Price',
      type: 'number',
      placeholder: 'Maximum price',
    },
    {
      key: 'minDuration',
      label: 'Min Duration (min)',
      type: 'number',
      placeholder: 'Minimum duration',
    },
  ];

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Wind;
  };

  // Table columns configuration
  const columns: Column[] = [
    {
      key: 'name',
      label: 'Service',
      sortable: true,
      render: (value: string, row: Service) => {
        const Icon = getCategoryIcon(row.category);
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-xs text-muted-foreground capitalize">{row.category}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value: number) => (
        <span className="text-muted-foreground">
          {value >= 60 ? `${Math.floor(value / 60)}h ${value % 60 > 0 ? `${value % 60}m` : ''}`.trim() : `${value}m`}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: Service) => (
        <span className="font-medium">
          {row.currency} {value}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
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
            value === "active"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
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
      render: (_: any, row: Service) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (window.confirm("Are you sure you want to delete this service?")) {
                handleDelete(row.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      await servicesAPI.delete(id, accessToken);
      toast.success("Service deleted successfully");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  // Fetch services from API
  const fetchServices = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterValues.search) filters.search = filterValues.search;
      if (filterValues.category && filterValues.category !== 'all') filters.category = filterValues.category;
      if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status;

      const { services: data } = await servicesAPI.getAll(filters);
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to mock data
      setServices(mockServices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [filterValues]);

  const handleAddClick = () => {
    setSelectedService(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchServices();
  };

  const handleExport = () => {
    const headers = ['Service Name', 'Category', 'Duration (min)', 'Price', 'Currency', 'Status'];
    const rows = filteredServices.map(s => [
      s.name,
      s.category,
      s.duration.toString(),
      s.price.toString(),
      s.currency,
      s.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredServices.length} services`);
  };

  // Apply filters
  const filteredServices = services.filter(service => {
    // Price range filter
    if (filterValues.minPrice && service.price < Number(filterValues.minPrice)) {
      return false;
    }
    if (filterValues.maxPrice && service.price > Number(filterValues.maxPrice)) {
      return false;
    }

    // Duration filter
    if (filterValues.minDuration && service.duration < Number(filterValues.minDuration)) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1>Services & Categories</h1>
            <p className="text-muted-foreground">
              Manage services, pricing, duration & categories
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => toast.info("Category management coming soon")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = filteredServices.filter(s => s.category === category.id).length;

            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setFilterValues({ ...filterValues, category: category.id })}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs text-muted-foreground">{count} services</div>
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
          searchPlaceholder="Search services..."
          showExport={false}
        />

        {/* Services Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SortableTable
            columns={columns}
            data={filteredServices}
            keyExtractor={(service) => service.id}
            onRowClick={handleEditClick}
            emptyMessage="No services found matching your filters"
          />
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredServices.length} of {services.length} services
          </div>
        )}
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
