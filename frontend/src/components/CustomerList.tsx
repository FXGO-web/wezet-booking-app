import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Plus, Edit, Eye, Loader2, Download } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { teamMembersAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { TeamMemberModal } from "./TeamMemberModal";
import { AdvancedFilters, FilterConfig, FilterValues } from "./AdvancedFilters";
import { SortableTable, Column } from "./SortableTable";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "active" | "inactive";
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  createdAt?: string;
}

export function CustomerList() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const { getAccessToken } = useAuth();

  // Filter configuration
  const filterConfig: FilterConfig[] = [
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
  ];

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const filters: any = { role: 'Client' }; // Force filter for Clients
      if (filterValues.search) filters.search = filterValues.search;
      if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status;

      const { members: data } = await teamMembersAPI.getAll(filters);
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filterValues]);

  const handleEditClick = (customer: Customer) => {
    // Map customer to team member format for the modal
    const memberData = {
      ...customer,
      services: [], // Customers don't have services yet
      specialties: [], // Customers don't have specialties yet
    };
    setSelectedCustomer(memberData as any);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchCustomers();
  };

  const handleExport = () => {
    const headers = ['Name', 'Role', 'Email', 'Status'];
    const rows = customers.map(m => [
      m.name,
      m.role,
      m.email,
      m.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${customers.length} customers`);
  };

  // Table columns configuration
  const columns: Column[] = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      render: (value: string, row: Customer) => (
        <div className="flex items-center gap-3">
          <Avatar>
            {row.avatarUrl && (
              <AvatarImage src={row.avatarUrl} alt={value} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary">
              {value.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline">
          {value === 'Client' ? 'Subscriber' : value}
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
      render: (_: any, row: Customer) => (
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2>Customers & Subscribers</h2>
          <p className="text-muted-foreground">
            Manage your client base
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
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
        searchPlaceholder="Search by name or email..."
        showExport={false}
      />

      {/* Customers Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <SortableTable
          columns={columns}
          data={customers}
          keyExtractor={(c) => c.id}
          onRowClick={handleEditClick}
          emptyMessage="No customers found"
        />
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {customers.length} customers
        </div>
      )}

      {/* Edit Modal - Reusing TeamMemberModal for promotion */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedCustomer}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
