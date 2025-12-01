import { useCurrency } from "../context/CurrencyContext";

// ... (imports)

export function ServicesCategories() {
  const { convertAndFormat } = useCurrency();
  // ... (state)

  // ... (columns)
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

      await sessionsAPI.delete(id, accessToken);
      toast.success("Session deleted successfully");
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

      const { services: data } = await sessionsAPI.getAll(filters);
      setServices(data || []);
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

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchServices();
  };

  const handleExport = () => {
    const headers = ['Session Name', 'Category', 'Duration (min)', 'Price', 'Currency', 'Status'];
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
              Add Session
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
