import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
  Mountain,
  Play,
} from "lucide-react";
import { ServiceModal } from "./ServiceModal";
import { useAuth } from "../hooks/useAuth";
import { useCurrency } from "../context/CurrencyContext";
import { supabase } from "../utils/supabase/client";
import { sessionsAPI, teamMembersAPI } from "../utils/api";
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
  title: "No services linked yet",
  description: "Create or link a service so clients can book with you.",
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
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const profileCardRef = useRef<HTMLDivElement | null>(null);
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Team Member";
  const userRole = user?.user_metadata?.role || "Specialist";

  useEffect(() => {
    setAvatarUrl(user?.user_metadata?.avatar_url || "");
    setHeadline(user?.user_metadata?.headline || "");
    setBio(user?.user_metadata?.bio || "");
  }, [user?.user_metadata]);

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const { services: serviceList } = await sessionsAPI.getAll();
      setServices(serviceList || []);
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const ownedServices = useMemo(() => {
    if (!user?.id && !user?.email) return [];

    const matchesUser = (service: any) => {
      const ownerId =
        service?.owner_id ||
        service?.ownerId ||
        service?.created_by ||
        service?.createdBy ||
        service?.teamMemberId ||
        service?.team_member_id ||
        service?.team_member?.id ||
        service?.user_id ||
        service?.userId;

      const ownerEmail =
        service?.owner_email ||
        service?.ownerEmail ||
        service?.team_member?.email ||
        service?.email;

      const userMatchesId = ownerId && user?.id && ownerId === user.id;
      const userMatchesEmail =
        ownerEmail &&
        user?.email &&
        ownerEmail.toLowerCase() === user.email.toLowerCase();

      return userMatchesId || userMatchesEmail;
    };

    return services.filter((service) => matchesUser(service));
  }, [services, user?.id, user?.email]);

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }
    const origin = window.location.origin;
    window.location.href = `${origin}/?view=${route}`;
  };

  const scrollToProfileCard = () => {
    if (profileCardRef.current) {
      profileCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Usa PNG, JPG o WEBP.");
      input.value = "";
      return;
    }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const toastId = toast.loading("Uploading image...");

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Image uploaded successfully", { id: toastId });

      // Auto-save the new URL to profile
      await saveProfileWithUrl(publicUrl);

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
      input.value = "";
    }
  };

  const saveProfileWithUrl = async (url: string) => {
    if (!user?.id) return;

    try {
      // Update Auth Metadata (Lightweight URL only)
      await supabase.auth.updateUser({
        data: { avatar_url: url }
      });

      // Update Profiles Table
      const accessToken = getAccessToken();
      if (accessToken) {
        await teamMembersAPI.update(
          user.id,
          { avatarUrl: url },
          accessToken
        );
      }
    } catch (error) {
      console.error("Error syncing avatar URL:", error);
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      // Update Auth Metadata
      await supabase.auth.updateUser({
        data: {
          headline,
          bio,
          // Ensure we keep the avatar_url if it exists
          avatar_url: avatarUrl
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

      toast.success("Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Unable to save profile");
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
            <div ref={profileCardRef}>
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle>Public profile</CardTitle>
                  <CardDescription>
                    Keep your profile fresh: image, headline, and short bio.
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
                      <Label htmlFor="avatarUrl">Profile image (URL o upload)</Label>
                      <div className="flex flex-col gap-2">
                        <Input
                          id="avatarUrl"
                          placeholder="https://..."
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <input
                            ref={avatarFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => avatarFileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload / replace
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAvatarUrl("")}
                          >
                            Reset
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Usa PNG, JPG o WEBP. Ratio 1:1 (cuadrado) y recomendado 600x600px para que se vea nítido.
                        </p>
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
                      <Label htmlFor="bio">Short bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        placeholder="In 2-3 sentences, share what you offer and what sets you apart."
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
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Save changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sessions & availability</CardTitle>
                <CardDescription>
                  Manage everything from your space: create sessions, open slots, and tune your schedule.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickAction
                  label="Create new session"
                  description="Set price, duration, and format"
                  icon={CalendarPlus}
                  onClick={() => setIsCreateSessionOpen(true)}
                />
                <QuickAction
                  label="Create retreat / education project"
                  description="Plan a retreat, residency, or learning track"
                  icon={Mountain}
                  onClick={() => handleNavigate("programs-retreats")}
                />
                <QuickAction
                  label="Create on-demand product"
                  description="Video / media content for clients to stream"
                  icon={Play}
                  onClick={() => handleNavigate("products-on-demand")}
                />
                <QuickAction
                  label="Manage availability"
                  description="Blocks, exceptions, and weekly hours"
                  icon={CalendarClock}
                  onClick={() => handleNavigate("availability-management")}
                />
                <QuickAction
                  label="Go to calendar"
                  description="Review your schedule in weekly view"
                  icon={Calendar}
                  onClick={() => handleNavigate("calendar")}
                />
                <QuickAction
                  label="Account settings"
                  description="Currency, notifications, and more"
                  icon={Settings}
                  onClick={() => handleNavigate("settings-page")}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My sessions</CardTitle>
                <CardDescription>
                  Only real data — no demo events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading services...
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
                    <div className="font-medium text-foreground">No sessions linked yet</div>
                    <p className="mt-1">{emptyServiceState.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateSessionOpen(true)}
                      >
                        Create session
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigate("availability-management")}
                      >
                        Link availability
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team resources</CardTitle>
                <CardDescription>
                  Everything you need to ship your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  className="w-full rounded-xl border px-4 py-3 text-left hover:border-primary/40"
                  onClick={scrollToProfileCard}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Configure your profile</div>
                      <p className="text-xs text-muted-foreground">
                        Adjust public name, role, and contact
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
                      <div className="font-medium">Sync availability</div>
                      <p className="text-xs text-muted-foreground">
                        Align hours and blocks with your team
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
      <ServiceModal
        isOpen={isCreateSessionOpen}
        onClose={() => setIsCreateSessionOpen(false)}
        onSuccess={() => {
          loadServices();
          toast.success("Session created successfully");
        }}
      />
    </div>
  );
}
