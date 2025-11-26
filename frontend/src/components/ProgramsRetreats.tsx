import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, MapPin, Calendar, Loader2 } from "lucide-react";
import { programsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { ProgramModal } from "./ProgramModal";

interface ProgramsRetreatsProps {
  onBack?: () => void;
}

export function ProgramsRetreats({ onBack }: ProgramsRetreatsProps) {
  const { getAccessToken } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await programsAPI.getAll();
      if (data && data.programs) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreate = () => {
    setSelectedProgram(null);
    setIsModalOpen(true);
  };

  const handleEdit = (program: any) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchPrograms();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  ← Back
                </Button>
              )}
              <h1 className="text-3xl font-bold">Programs & Retreats</h1>
            </div>
            <p className="text-muted-foreground ml-20">
              Manage your multi-day retreats and educational sequences
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : programs.length > 0 ? (
            programs.map((program) => (
              <Card
                key={program.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEdit(program)}
              >
                <CardHeader className="pb-4">
                  <div className="h-48 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <MapPin className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardTitle className="flex items-start justify-between">
                    <span>{program.title}</span>
                    <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {program.status || 'Draft'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {program.startDate ? new Date(program.startDate).toLocaleDateString() : 'TBD'}
                        {program.endDate ? ` - ${new Date(program.endDate).toLocaleDateString()}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{program.location || 'Location TBD'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : null}

          {/* Empty State / Create New Card */}
          <Card
            className="border-dashed flex flex-col items-center justify-center p-12 text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={handleCreate}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">Create New Program</h3>
              <p className="text-sm text-muted-foreground">
                Add a new retreat or educational sequence
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ProgramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        program={selectedProgram}
      />
    </div>
  );
}
