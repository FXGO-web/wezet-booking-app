import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Edit, MapPin, Loader2, Download } from "lucide-react";
import { locationsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { LocationModal } from "./LocationModal";
import { AdvancedFilters, FilterConfig, FilterValues } from "./AdvancedFilters";
import { SortableTable, Column } from "./SortableTable";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: "studio" | "outdoor" | "online" | "retreat-center";
  capacity?: number;
  amenities?: string[];
  status: "active" | "inactive";
}

const mockLocations: Location[] = [
  {
    id: "1",
    name: "Downtown Wellness Studio",
    address: "123 Main Street",
    city: "San Francisco",
    country: "USA",
    type: "studio",
    capacity: 20,
    amenities: ["Mats", "Props", "Changing Room"],
    status: "active",
  },
  {
    id: "2",
    name: "Mountain Retreat Center",
    address: "456 Mountain Road",
    city: "Boulder",
    country: "USA",
    type: "retreat-center",
    capacity: 50,
    amenities: ["Accommodation", "Kitchen", "Meditation Hall"],
    status: "active",
  },
  {
    id: "3",
    name: "Online Platform",
    address: "Virtual",
    city: "Remote",
    country: "Worldwide",
    type: "online",
    status: "active",
  },
  {
    id: "4",
    name: "Beach Yoga Spot",
    address: "Ocean Drive",
    city: "Malibu",
    country: "USA",
    type: "outdoor",
    capacity: 30,
    status: "active",
  },
];

export function LocationsDirectory() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const { getAccessToken } = useAuth();

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'type',
      label: 'Location Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'studio', label: 'Studio' },
        { value: 'outdoor', label: 'Outdoor' },
        { value: 'online', label: 'Online' },
        { value: 'retreat-center', label: 'Retreat Center' },
      ],
      placeholder: 'Filter by type',
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
      key: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'Filter by city',
    },
    {
      key: 'minCapacity',
      label: 'Min Capacity',
      type: 'number',
      placeholder: 'Minimum capacity',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'studio':
        return 'bg-blue-100 text-blue-800';
      case 'outdoor':
        return 'bg-green-100 text-green-800';
      case 'online':
        return 'bg-purple-100 text-purple-800';
      case 'retreat-center':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Table columns configuration
  const columns: Column[] = [
    {
      key: 'name',
      label: 'Location',
      sortable: true,
      render: (value: string, row: Location) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.address}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
      render: (value: string, row: Location) => (
        <div>
          <div className="text-sm">{value}</div>
          <div className="text-xs text-muted-foreground">{row.country}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" className={getTypeColor(value)}>
          {getTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (value: number | undefined) => (
        <span className="text-muted-foreground">
          {value ? `${value} people` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'amenities',
      label: 'Amenities',
      sortable: false,
      render: (value: string[] | undefined) => (
        <div className="flex flex-wrap gap-1">
          {value && value.length > 0 ? (
            <>
              {value.slice(0, 2).map((amenity) => (
                <Badge
                  key={amenity}
                  variant="outline"
                  className="text-xs"
                >
                  {amenity}
                </Badge>
              ))}
              {value.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{value.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
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
      render: (_: any, row: Location) => (
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

  // Fetch locations from API
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterValues.search) filters.search = filterValues.search;
      if (filterValues.type && filterValues.type !== 'all') filters.type = filterValues.type;
      if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status;
      if (filterValues.city) filters.city = filterValues.city;

      const { locations: data } = await locationsAPI.getAll(filters);
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback to mock data
      setLocations(mockLocations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [filterValues]);

  const handleAddClick = () => {
    setSelectedLocation(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchLocations();
  };

  const handleExport = () => {
    const headers = ['Name', 'Address', 'City', 'Country', 'Type', 'Capacity', 'Amenities', 'Status'];
    const rows = filteredLocations.map(l => [
      l.name,
      l.address,
      l.city,
      l.country,
      getTypeLabel(l.type),
      l.capacity?.toString() || 'N/A',
      l.amenities?.join('; ') || 'None',
      l.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredLocations.length} locations`);
  };

  // Apply filters
  const filteredLocations = locations.filter(location => {
    // Capacity filter
    if (filterValues.minCapacity && location.capacity && location.capacity < Number(filterValues.minCapacity)) {
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
            <h1>Locations Directory</h1>
            <p className="text-muted-foreground">
              Manage studios, retreat centers, and session venues
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filterConfig}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
          onExport={handleExport}
          searchPlaceholder="Search locations..."
          showExport={false}
        />

        {/* Locations Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SortableTable
            columns={columns}
            data={filteredLocations}
            keyExtractor={(location) => location.id}
            onRowClick={handleEditClick}
            emptyMessage="No locations found matching your filters"
          />
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredLocations.length} of {locations.length} locations
          </div>
        )}
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={selectedLocation}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
