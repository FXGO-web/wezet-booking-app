import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Plus, Edit, Eye, Loader2, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { teamMembersAPI } from "../utils/api";
import { supabase } from "../utils/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { TeamMemberModal } from "./TeamMemberModal";
import { AdvancedFilters, FilterConfig, FilterValues } from "./AdvancedFilters";
import { SortableTable, Column } from "./SortableTable";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  services: string[];
  specialties: string[];
  status: "active" | "inactive";
  avatarUrl?: string;
  phone?: string;
  bio?: string;
}

export function TeamManagement() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>(undefined);
  const { getAccessToken } = useAuth();

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'Teacher', label: 'Teacher' },
        { value: 'Facilitator', label: 'Facilitator' },
        { value: 'Admin', label: 'Admin' },
      ],
      placeholder: 'Filter by role',
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
  ];

  // Table columns configuration
  const columns: Column[] = [
    {
      key: 'name',
      label: 'Member',
      sortable: true,
      render: (value: string, row: TeamMember) => (
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
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: 'specialties',
      label: 'Specialties',
      sortable: false,
      render: (value: string[], row: TeamMember) => {
        const specialties = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 2).map((specialty) => (
              <Badge
                key={specialty}
                variant="secondary"
                className="text-xs bg-primary/10 text-primary"
              >
                {specialty}
              </Badge>
            ))}
            {specialties.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{specialties.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'services',
      label: 'Services',
      sortable: false,
      render: (value: string[]) => {
        const services = Array.isArray(value) ? value : [];
        return (
          <span className="text-sm text-muted-foreground">
            {services.length} {services.length === 1 ? 'service' : 'services'}
          </span>
        );
      },
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
      render: (_: any, row: TeamMember) => (
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch team members from API
  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterValues.search) filters.search = filterValues.search;
      // if (filterValues.role && filterValues.role !== 'all') filters.role = filterValues.role;
      // if (filterValues.status && filterValues.status !== 'all') filters.status = filterValues.status;

      // Fetch from API (Reverted to use API as it works for Public Calendar)
      const { teamMembers: data } = await teamMembersAPI.getAll(filters);

      console.log('Fetched members from API:', data);

      // Filter for Team Roles only
      const teamRoles = ['Admin', 'Team Member', 'Teacher', 'Facilitator'];
      const filteredData = (data || []).filter((m: any) => teamRoles.includes(m.role));

      setTeamMembers(filteredData);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [filterValues]);

  const handleAddClick = () => {
    setSelectedMember(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (member: TeamMember) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("You must be signed in to delete a team member.");
      return;
    }
    const confirmDelete = window.confirm(`Delete ${member.name}?`);
    if (!confirmDelete) return;

    try {
      await teamMembersAPI.delete(member.id, accessToken);
      toast.success("Team member deleted");
      fetchTeamMembers();
    } catch (error) {
      console.error("Failed to delete team member:", error);
      toast.error("Failed to delete team member");
    }
  };

  const handleModalSuccess = () => {
    fetchTeamMembers();
  };

  const handleExport = () => {
    const headers = ['Name', 'Role', 'Email', 'Specialties', 'Services', 'Status'];
    const rows = filteredMembers.map(m => [
      m.name,
      m.role,
      m.email,
      m.specialties.join('; '),
      m.services.join('; '),
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
    a.download = `team-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredMembers.length} team members`);
  };

  // Apply filters
  const filteredMembers = teamMembers;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1>Team Management</h1>
            <p className="text-muted-foreground">
              Manage team members, roles, services & availability
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
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

        {/* Team Members Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SortableTable
            columns={columns}
            data={filteredMembers}
            keyExtractor={(member) => member.id}
            onRowClick={handleEditClick}
            emptyMessage="No team members found matching your filters"
          />
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredMembers.length} of {teamMembers.length} team members
          </div>
        )}
      </div>

      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedMember}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
