import { useState, useEffect } from "react";
import { settingsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  Settings as SettingsIcon,
  Save,
  DollarSign,
  Calendar as CalendarIcon,
  CreditCard,
  Mail,
  Bell,
  FileText
} from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

export function SettingsPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // General Settings
  const [platformName, setPlatformName] = useState("WEZET");
  const [supportEmail, setSupportEmail] = useState("support@wezet.com");
  const [timezone, setTimezone] = useState("pst");

  // Currency & Pricing
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [multiCurrency, setMultiCurrency] = useState(true);
  const [taxRate, setTaxRate] = useState("8.5");

  // Booking Rules
  const [minAdvance, setMinAdvance] = useState("24");
  const [maxAdvance, setMaxAdvance] = useState("90");
  const [cancelWindow, setCancelWindow] = useState("48");
  const [requireApproval, setRequireApproval] = useState(false);

  // Payment Integration
  const [stripePublic, setStripePublic] = useState("");
  const [stripeSecret, setStripeSecret] = useState("");
  const [testMode, setTestMode] = useState(true);

  // Email Templates
  const [bookingConfirm, setBookingConfirm] = useState(
    "Hi {{client_name}}, your booking with {{team_member}} on {{date}} is confirmed!"
  );
  const [bookingReminder, setBookingReminder] = useState(
    "Reminder: You have a session with {{team_member}} tomorrow at {{time}}."
  );
  const [cancellation, setCancellation] = useState(
    "Your booking on {{date}} has been canceled. {{reason}}"
  );

  // Notification Settings
  const [newBookingNotify, setNewBookingNotify] = useState(true);
  const [cancelNotify, setCancelNotify] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("admin@wezet.com");

  // Policies
  const [refundPolicy, setRefundPolicy] = useState(
    "Full refund available up to 48 hours before the session. Cancellations within 48 hours are non-refundable."
  );
  const [privacyPolicy, setPrivacyPolicy] = useState("https://wezet.com/privacy");
  const [termsUrl, setTermsUrl] = useState("https://wezet.com/terms");

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        console.log("No access token, using defaults");
        setLoading(false);
        return;
      }

      const { settings } = await settingsAPI.get(accessToken);

      if (settings) {
        // General
        setPlatformName(settings.platformName || "WEZET");
        setSupportEmail(settings.supportEmail || "support@wezet.com");
        setTimezone(settings.timezone || "pst");

        // Currency
        setDefaultCurrency(settings.defaultCurrency || "EUR");
        setMultiCurrency(settings.multiCurrency ?? true);
        setTaxRate(settings.taxRate?.toString() || "8.5");

        // Booking Rules
        setMinAdvance(settings.minAdvance?.toString() || "24");
        setMaxAdvance(settings.maxAdvance?.toString() || "90");
        setCancelWindow(settings.cancelWindow?.toString() || "48");
        setRequireApproval(settings.requireApproval ?? false);

        // Payment
        setStripePublic(settings.stripePublic || "");
        setStripeSecret(settings.stripeSecret || "");
        setTestMode(settings.testMode ?? true);

        // Email Templates
        setBookingConfirm(settings.bookingConfirm || bookingConfirm);
        setBookingReminder(settings.bookingReminder || bookingReminder);
        setCancellation(settings.cancellation || cancellation);

        // Notifications
        setNewBookingNotify(settings.newBookingNotify ?? true);
        setCancelNotify(settings.cancelNotify ?? true);
        setDailySummary(settings.dailySummary ?? true);
        setNotifyEmail(settings.notifyEmail || "admin@wezet.com");

        // Policies
        setRefundPolicy(settings.refundPolicy || refundPolicy);
        setPrivacyPolicy(settings.privacyPolicy || "https://wezet.com/privacy");
        setTermsUrl(settings.termsUrl || "https://wezet.com/terms");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    setSaving(section);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        toast.error("Please log in to save settings");
        return;
      }

      await settingsAPI.update(data, accessToken);
      toast.success(`${section} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${section}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveGeneral = () => {
    saveSettings("General Settings", {
      platformName,
      supportEmail,
      timezone,
    });
  };

  const handleSaveCurrency = () => {
    saveSettings("Currency Settings", {
      defaultCurrency,
      multiCurrency,
      taxRate: parseFloat(taxRate),
    });
  };

  const handleSaveBookingRules = () => {
    saveSettings("Booking Rules", {
      minAdvance: parseInt(minAdvance),
      maxAdvance: parseInt(maxAdvance),
      cancelWindow: parseInt(cancelWindow),
      requireApproval,
    });
  };

  const handleSavePayment = () => {
    saveSettings("Payment Settings", {
      stripePublic,
      stripeSecret,
      testMode,
    });
  };

  const handleSaveEmailTemplates = () => {
    saveSettings("Email Templates", {
      bookingConfirm,
      bookingReminder,
      cancellation,
    });
  };

  const handleSaveNotifications = () => {
    saveSettings("Notification Settings", {
      newBookingNotify,
      cancelNotify,
      dailySummary,
      notifyEmail,
    });
  };

  const handleSavePolicies = () => {
    saveSettings("Policies", {
      refundPolicy,
      privacyPolicy,
      termsUrl,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1>Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings, integrations, and policies
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>General Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  defaultValue="WEZET"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  defaultValue="support@wezet.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  defaultValue="pst"
                  value={timezone}
                  onValueChange={(value) => setTimezone(value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                    <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                    <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleSaveGeneral}
                disabled={saving === "General Settings"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>

          {/* Currency & Pricing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Currency & Pricing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  defaultValue="eur"
                  value={defaultCurrency}
                  onValueChange={(value) => setDefaultCurrency(value)}
                >
                  <SelectTrigger id="defaultCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eur">EUR - Euro</SelectItem>
                    <SelectItem value="dkk">DKK - Danish Krone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Multi-Currency Support</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow clients to pay in EUR or DKK
                  </p>
                </div>
                <Switch
                  defaultChecked={multiCurrency}
                  onCheckedChange={(checked) => setMultiCurrency(checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  defaultValue="8.5"
                  placeholder="8.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSaveCurrency}
                disabled={saving === "Currency Settings"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Currency Settings
              </Button>
            </CardContent>
          </Card>

          {/* Booking Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Booking Rules</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="minAdvance">Minimum Booking Advance (hours)</Label>
                <Input
                  id="minAdvance"
                  type="number"
                  defaultValue="24"
                  placeholder="24"
                  value={minAdvance}
                  onChange={(e) => setMinAdvance(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAdvance">Maximum Booking Advance (days)</Label>
                <Input
                  id="maxAdvance"
                  type="number"
                  defaultValue="90"
                  placeholder="90"
                  value={maxAdvance}
                  onChange={(e) => setMaxAdvance(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancelWindow">Cancellation Window (hours)</Label>
                <Input
                  id="cancelWindow"
                  type="number"
                  defaultValue="48"
                  placeholder="48"
                  value={cancelWindow}
                  onChange={(e) => setCancelWindow(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval</Label>
                  <p className="text-xs text-muted-foreground">
                    Bookings need manual approval
                  </p>
                </div>
                <Switch
                  defaultChecked={requireApproval}
                  onCheckedChange={(checked) => setRequireApproval(checked)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSaveBookingRules}
                disabled={saving === "Booking Rules"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Booking Rules
              </Button>
            </CardContent>
          </Card>

          {/* Payment Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Payment Integration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stripePublic">Stripe Publishable Key</Label>
                <Input
                  id="stripePublic"
                  type="password"
                  defaultValue="pk_test_••••••••••••••••"
                  value={stripePublic}
                  onChange={(e) => setStripePublic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeSecret">Stripe Secret Key</Label>
                <Input
                  id="stripeSecret"
                  type="password"
                  defaultValue="sk_test_••••••••••••••••"
                  value={stripeSecret}
                  onChange={(e) => setStripeSecret(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Test Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Use Stripe test environment
                  </p>
                </div>
                <Switch
                  defaultChecked={testMode}
                  onCheckedChange={(checked) => setTestMode(checked)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSavePayment}
                disabled={saving === "Payment Settings"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>

          {/* Email Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Email Templates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bookingConfirm">Booking Confirmation</Label>
                <Textarea
                  id="bookingConfirm"
                  rows={3}
                  defaultValue="Hi {{client_name}}, your booking with {{team_member}} on {{date}} is confirmed!"
                  value={bookingConfirm}
                  onChange={(e) => setBookingConfirm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingReminder">Reminder Email</Label>
                <Textarea
                  id="bookingReminder"
                  rows={3}
                  defaultValue="Reminder: You have a session with {{team_member}} tomorrow at {{time}}."
                  value={bookingReminder}
                  onChange={(e) => setBookingReminder(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation">Cancellation Email</Label>
                <Textarea
                  id="cancellation"
                  rows={3}
                  defaultValue="Your booking on {{date}} has been canceled. {{reason}}"
                  value={cancellation}
                  onChange={(e) => setCancellation(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSaveEmailTemplates}
                disabled={saving === "Email Templates"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Email Templates
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Notification Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Booking Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Email admins when new bookings are made
                  </p>
                </div>
                <Switch
                  defaultChecked={newBookingNotify}
                  onCheckedChange={(checked) => setNewBookingNotify(checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cancellation Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert team members of cancellations
                  </p>
                </div>
                <Switch
                  defaultChecked={cancelNotify}
                  onCheckedChange={(checked) => setCancelNotify(checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary Emails</Label>
                  <p className="text-xs text-muted-foreground">
                    Send daily schedule summary to team
                  </p>
                </div>
                <Switch
                  defaultChecked={dailySummary}
                  onCheckedChange={(checked) => setDailySummary(checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notifyEmail">Notification Email</Label>
                <Input
                  id="notifyEmail"
                  type="email"
                  defaultValue="admin@wezet.com"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSaveNotifications}
                disabled={saving === "Notification Settings"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>

          {/* Policies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Policies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Textarea
                  id="refundPolicy"
                  rows={4}
                  defaultValue="Full refund available up to 48 hours before the session. Cancellations within 48 hours are non-refundable."
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Privacy Policy URL</Label>
                <Input
                  id="privacyPolicy"
                  type="url"
                  defaultValue="https://wezet.com/privacy"
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsUrl">Terms of Service URL</Label>
                <Input
                  id="termsUrl"
                  type="url"
                  defaultValue="https://wezet.com/terms"
                  value={termsUrl}
                  onChange={(e) => setTermsUrl(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSavePolicies}
                disabled={saving === "Policies"}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Policies
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}