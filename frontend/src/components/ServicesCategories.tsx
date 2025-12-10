import React, { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Edit, Trash2, Plus, Download, Loader2, Activity, Heart, Zap, Coffee } from "lucide-react";
import { toast } from "sonner";
import { ServiceModal } from "./ServiceModal";
import { AdvancedFilters, FilterConfig } from "./AdvancedFilters";
import { SortableTable } from "./SortableTable";
import { sessionsAPI, categoriesAPI } from "../utils/api";
import { Database } from "../types/database.types";

type Service = Database['public']['Tables']['session_templates']['Row'];

const CATEGORIES = [
  { id: 'Breathwork', name: 'Breathwork', icon: Activity },
  { id: 'Bodywork', name: 'Bodywork', icon: Heart },
  { id: 'Coaching', name: 'Coaching', icon: Zap },
  { id: 'Education', name: 'Education', icon: Coffee },
  { id: 'Retreats', name: 'Retreats', icon: Activity },
];

export function ServicesCategories() {
  const { convertAndFormat } = useCurrency();
  const [services, setServices] = useState<Service[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]); // New state
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);

  // const categories = CATEGORIES; // Removed, now using dynamicCategories

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (window.confirm("Are you sure you want to delete this service?")) {
        await sessionsAPI.delete(id);
        toast.success("Session deleted successfully");
        fetchServices();
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: Service) => (
        <span className="font-medium">
          {convertAndFormat(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: any) => (
        <Badge variant="outline" className="capitalize">
          {typeof value === 'object' && value !== null ? value.name : value || 'Uncategorized'}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => {
        const status = value ? 'active' : 'inactive';
        return (
          <Badge
            variant="secondary"
            className={
              status === "active"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }
          >
            {status}
          </Badge>
        );
      },
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
              handleDelete(row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch services from API
  const fetchServices = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterValues.search) filters.search = filterValues.search;
      if (filterValues.category && filterValues.category !== 'all') filters.category = filterValues.category;

      const [{ services: data }, { categories: cats }] = await Promise.all([
        sessionsAPI.getAll(filters),
        categoriesAPI.getAll({ appliesTo: 'session' })
      ]);

      setServices(data || []);
      // Map API categories to our UI format, preserving icons if name matches, or default
      const mappedCategories = (cats || []).map((c: any) => {
        const defaultCat = CATEGORIES.find(dc => dc.name === c.name);
        return {
          id: c.id,
          name: c.name,
          icon: defaultCat ? defaultCat.icon : Activity
        };
      });
      setDynamicCategories(mappedCategories);

    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
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

  const handleModalSuccess = () => {
    fetchServices();
  };

  const handleExport = () => {
    const headers = ['Session Name', 'Category', 'Duration (min)', 'Price', 'Currency', 'Status'];
    const rows = filteredServices.map(s => [
      s.name,
      s.category?.name || 'Uncategorized',
      s.duration_minutes.toString(),
      s.price.toString(),
      s.currency,
      s.is_active ? 'active' : 'inactive',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredServices.length} sessions`);
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
    if (filterValues.minDuration && service.duration_minutes < Number(filterValues.minDuration)) {
      return false;
    }

    return true;
  });

  // Filter config for AdvancedFilters
  const filterConfig: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'All Categories', value: 'all' },
        ...dynamicCategories.map(c => ({ label: c.name, value: c.id }))
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ]
    },
    {
      key: 'minPrice',
      label: 'Min Price',
      type: 'number',
      placeholder: '0'
    },
    {
      key: 'maxPrice',
      label: 'Max Price',
      type: 'number',
      placeholder: '1000'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1>Sessions & Categories</h1>
            <p className="text-muted-foreground">
              Manage sessions, pricing, duration & categories
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
              Create Session
            </Button>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dynamicCategories.map((category) => {
            const Icon = category.icon;
            // s.category is an object { id, name } or null
            const count = services.filter(s => s.category && s.category.id === category.id).length;

            return (
              <Card
                key={category.id}
                className={`cursor-pointer transition-colors ${filterValues.category === category.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                onClick={() => setFilterValues({ ...filterValues, category: category.id === filterValues.category ? 'all' : category.id })}
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

        {/* AdvancedFilters */}
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
            Showing {filteredServices.length} of {services.length} sessions
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
