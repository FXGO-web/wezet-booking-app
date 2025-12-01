import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Eye, Loader2, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { bookingsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { BookingModal } from "./BookingModal";
import { AdvancedFilters, FilterConfig, FilterValues } from "./AdvancedFilters";
import { SortableTable, Column } from "./SortableTable";
import { toast } from "sonner";
import { useCurrency } from "../context/CurrencyContext";

interface Booking {
  id: string;
  clientName: string;
  teamMemberName: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
  price: number;
  currency: string;
  status: "confirmed" | "pending" | "canceled" | "completed";
  clientEmail?: string;
}

const statusColors = {
  confirmed: "bg-green-100 text-green-800 hover:bg-green-100",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  canceled: "bg-red-100 text-red-800 hover:bg-red-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
};

export function BookingsDirectory() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>(undefined);
  const { getAccessToken } = useAuth();
  const { convertAndFormat } = useCurrency();

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'canceled', label: 'Canceled' },
      ],
      placeholder: 'Filter by status',
    },
    {
      key: 'dateFrom',
      label: 'Date From',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      key: 'dateTo',
      label: 'Date To',
      type: 'date',
      placeholder: 'End date',
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
  ];

  // Table columns configuration
  const columns: Column[] = [
    {
      key: 'clientName',
      label: 'Client',
      sortable: true,
      render: (value: string, row: Booking) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {value.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{value}</div>
            {row.clientEmail && (
              <div className="text-xs text-muted-foreground">{row.clientEmail}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'teamMemberName',
      label: 'Team Member',
      sortable: true,
    },
    {
      key: 'serviceName',
      label: 'Service',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date & Time',
      sortable: true,
      render: (value: string, row: Booking) => (
        <div className="space-y-0.5">
          <div className="text-sm">
            {new Date(value).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="text-xs text-muted-foreground">{row.time}</div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: string) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: Booking) => (
        <span className="font-medium">
          {convertAndFormat(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" className={statusColors[value as keyof typeof statusColors]}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Booking) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewClick(row);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch bookings from API
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterValues.search) filters.search = filterValues.search;
      if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status;

      const { bookings: data } = await bookingsAPI.getAll(filters);
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterValues]);

  const handleViewClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchBookings();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Client', 'Email', 'Team Member', 'Service', 'Date', 'Time', 'Location', 'Price', 'Status'];
    const rows = filteredBookings.map(b => [
      b.clientName,
      b.clientEmail || '',
      b.teamMemberName,
      b.serviceName,
      new Date(b.date).toLocaleDateString(),
      b.time,
      b.location,
      `${b.currency} ${b.price}`,
      b.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredBookings.length} bookings`);
  };

  // Apply filters
  const filteredBookings = bookings.filter(booking => {
    // Date range filter
    if (filterValues.dateFrom) {
      const bookingDate = new Date(booking.date);
      const fromDate = new Date(filterValues.dateFrom);
      if (bookingDate < fromDate) return false;
    }
    if (filterValues.dateTo) {
      const bookingDate = new Date(booking.date);
      const toDate = new Date(filterValues.dateTo);
      if (bookingDate > toDate) return false;
    }

    // Price range filter
    if (filterValues.minPrice && booking.price < Number(filterValues.minPrice)) {
      return false;
    }
    if (filterValues.maxPrice && booking.price > Number(filterValues.maxPrice)) {
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
            <h1>All Bookings</h1>
            <p className="text-muted-foreground">
              View and manage all session bookings across the platform
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filterConfig}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
          onExport={handleExport}
          searchPlaceholder="Search by client, service, or team member..."
          showExport={true}
        />

        {/* Bookings Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SortableTable
            columns={columns}
            data={filteredBookings}
            keyExtractor={(booking) => booking.id}
            onRowClick={handleViewClick}
            emptyMessage="No bookings found matching your filters"
          />
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        booking={selectedBooking}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}