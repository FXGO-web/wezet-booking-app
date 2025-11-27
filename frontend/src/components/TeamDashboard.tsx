import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Calendar,
  Settings,
  CalendarPlus,
  Upload,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Link2,
} from "lucide-react";
import { CreateSessionModal } from "./CreateSessionModal";
import { useAuth } from "../hooks/useAuth";
import { useCurrency } from "../context/CurrencyContext";
import { supabase } from "../utils/supabase/client";
import { servicesAPI, teamMembersAPI } from "../utils/api";
import { toast } from "sonner";

const QuickAction = ({
  label,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: any;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <div className="font-medium">{label}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Calendar className="h-4 w-4 text-muted-foreground" />
  </button>
);

const emptyServiceState = {
  title: "Sin servicios asignados aún",
  description: "Crea o vincula un servicio para que los clientes puedan reservar contigo.",
};

interface TeamDashboardProps {
  onNavigate?: (route: string) => void;
}

export function TeamDashboard({ onNavigate }: TeamDashboardProps) {
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const { convertAndFormat } = useCurrency();
  const { user, getAccessToken } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ""
  );
  const [headline, setHeadline] = useState(
    user?.user_metadata?.headline || ""
  );
  const [bio, setBio] = useState(user?.user_metadata?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Team Member";
  const userRole = user?.user_metadata?.role || "Specialist";

  useEffect(() => {
    setAvatarUrl(user?.user_metadata?.avatar_url || "");
    setHeadline(user?.user_metadata?.headline || "");
    setBio(user?.user_metadata?.bio || "");
  }, [user?.user_metadata]);

  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const { services: serviceList } = await servicesAPI.getAll();
        setServices(serviceList || []);
      } catch (error) {
        console.error("Error loading services:", error);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  const ownedServices = useMemo(() => {
    if (!user?.id) return [];
    return services.filter((service) => {
      const ownerId =
        service?.owner_id ||
        service?.ownerId ||
        service?.created_by ||
        service?.createdBy ||
        service?.teamMemberId ||
        service?.team_member_id;
      return ownerId === user.id;
    });
  }, [services, user?.id]);

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }
    const origin = window.location.origin;
    window.location.href = `${origin}/?view=${route}`;
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          headline,
          bio,
        },
      });

      const accessToken = getAccessToken();
      if (accessToken && user?.id) {
        await teamMembersAPI.update(
          user.id,
          {
            avatarUrl,
            bio,
            description: bio,
            role: userRole,
          },
          accessToken
        );
      }

      toast.success("Perfil actualizado");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("No se pudo guardar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
              <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-serif text-foreground tracking-tight">
                {userName}
              </h1>
              <p className="text-muted-foreground">{userRole}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleNavigate("settings-page")}
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleNavigate("availability-management")}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Manage Availability
            </Button>
            <Button size="lg" onClick={() => setIsCreateSessionOpen(true)}>
              <CalendarPlus className="mr-2 h-5 w-5" />
              Create Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle>Perfil público</CardTitle>
                <CardDescription>
                  Mantén tu ficha actualizada: imagen, headline y bio corta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                      {avatarUrl && (
                        <AvatarImage src={avatarUrl} alt={userName} />
                      )}
                      <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
                        {userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{userName}</div>
                      <p className="text-sm text-muted-foreground">
                        {headline || userRole}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="avatarUrl">Imagen de perfil (URL)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="avatarUrl"
                        placeholder="https://..."
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAvatarUrl("")}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      placeholder="Breathwork & Education specialist"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio corta</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      placeholder="Cuenta en 2-3 frases qué ofreces y qué te diferencia."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={savingProfile}>
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sesiones y disponibilidad</CardTitle>
                <CardDescription>
                  Gestiona todo desde tu espacio: crea sesiones, abre huecos y configura tu agenda.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickAction
                  label="Crear nueva sesión"
                  description="Define precio, duración y formato"
                  icon={CalendarPlus}
                  onClick={() => setIsCreateSessionOpen(true)}
                />
                <QuickAction
                  label="Gestionar disponibilidad"
                  description="Bloqueos, excepciones y horarios"
                  icon={CalendarClock}
                  onClick={() => handleNavigate("availability-management")}
                />
                <QuickAction
                  label="Ir al calendario"
                  description="Revisa tu agenda en vista semanal"
                  icon={Calendar}
                  onClick={() => handleNavigate("calendar")}
                />
                <QuickAction
                  label="Ajustes de la cuenta"
                  description="Moneda, notificaciones y más"
                  icon={Settings}
                  onClick={() => handleNavigate("settings-page")}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis servicios</CardTitle>
                <CardDescription>
                  Solo mostramos datos reales — sin eventos demo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando servicios...
                  </div>
                ) : ownedServices.length > 0 ? (
                  <div className="space-y-3">
                    {ownedServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between rounded-xl border p-3"
                      >
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <p className="text-xs text-muted-foreground">
                            {service.category || "Servicio activo"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {convertAndFormat(service.price || 0, service.currency || "EUR")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">{emptyServiceState.title}</div>
                    <p className="mt-1">{emptyServiceState.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigate("services-categories")}
                      >
                        Crear servicio
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigate("availability-management")}
                      >
                        Conectar disponibilidad
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos del equipo</CardTitle>
                <CardDescription>
                  Todo lo necesario para lanzar tu ficha en producción.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  className="w-full rounded-xl border px-4 py-3 text-left hover:border-primary/40"
                  onClick={() => handleNavigate("settings-page")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Configura tu perfil</div>
                      <p className="text-xs text-muted-foreground">
                        Ajusta nombre público, rol y contacto
                      </p>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                <button
                  className="w-full rounded-xl border px-4 py-3 text-left hover:border-primary/40"
                  onClick={() => handleNavigate("availability-management")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sincroniza disponibilidad</div>
                      <p className="text-xs text-muted-foreground">
                        Alinea horarios y bloqueos con tu equipo
                      </p>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        open={isCreateSessionOpen}
        onOpenChange={setIsCreateSessionOpen}
      />
    </div>
  );
}
