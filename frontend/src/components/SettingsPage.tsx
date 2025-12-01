import { useState, useEffect } from "react";
import { settingsAPI } from "../utils/api";
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

  // Load on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // -------------------------
  // Load from API
  // -------------------------
  const loadSettings = async () => {
    setLoading(true);
    try {
      console.log("Attempting to load settings...");
      const { settings } = await settingsAPI.get();

      if (settings) {
        console.log("Loaded settings:", settings);
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

  // -------------------------
  // Save wrapper
  // -------------------------
  const saveSettings = async (section: string, data: any) => {
    setSaving(section);
    try {
      await settingsAPI.update(data);
      toast.success(`${section} saved successfully`);
    } catch (error: any) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${section}: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(null);
    }
  };

  // Handlers (unchanged)
  const handleSaveGeneral = () =>
    saveSettings("General Settings", {
      platformName,
      supportEmail,
      timezone,
    });

  const handleSaveCurrency = () =>
    saveSettings("Currency Settings", {
      defaultCurrency,
      multiCurrency,
      taxRate: parseFloat(taxRate),
    });

  const handleSaveBookingRules = () =>
    saveSettings("Booking Rules", {
      minAdvance: parseInt(minAdvance),
      maxAdvance: parseInt(maxAdvance),
      cancelWindow: parseInt(cancelWindow),
      requireApproval,
    });

  const handleSavePayment = () =>
    saveSettings("Payment Settings", {
      stripePublic,
      stripeSecret,
      testMode,
    });

  const handleSaveEmailTemplates = () =>
    saveSettings("Email Templates", {
      bookingConfirm,
      bookingReminder,
      cancellation,
    });

  const handleSaveNotifications = () =>
    saveSettings("Notification Settings", {
      newBookingNotify,
      cancelNotify,
      dailySummary,
      notifyEmail,
    });

  const handleSavePolicies = () =>
    saveSettings("Policies", {
      refundPolicy,
      privacyPolicy,
      termsUrl,
    });

  // -------------------------
  // Loading state
  // -------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    // TODO: UI unchanged (keeping your full layout intact)
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
            <p className="text-muted-foreground">
              Configure your booking platform preferences
            </p>
          </div>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" /> General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  <SelectItem value="est">Eastern Time (EST)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="cet">Central European Time (CET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveGeneral}
              disabled={saving === "General Settings"}
            >
              {saving === "General Settings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save General Settings
            </Button>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Currency & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="DKK">DKK (kr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="multiCurrency">Enable Multi-currency</Label>
              <Switch
                id="multiCurrency"
                checked={multiCurrency}
                onCheckedChange={setMultiCurrency}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveCurrency}
              disabled={saving === "Currency Settings"}
            >
              {saving === "Currency Settings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Currency Settings
            </Button>
          </CardContent>
        </Card>

        {/* Booking Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Booking Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minAdvance">Min Advance (Hours)</Label>
                <Input
                  id="minAdvance"
                  type="number"
                  value={minAdvance}
                  onChange={(e) => setMinAdvance(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxAdvance">Max Advance (Days)</Label>
                <Input
                  id="maxAdvance"
                  type="number"
                  value={maxAdvance}
                  onChange={(e) => setMaxAdvance(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cancelWindow">Cancellation Window (Hours)</Label>
              <Input
                id="cancelWindow"
                type="number"
                value={cancelWindow}
                onChange={(e) => setCancelWindow(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requireApproval">Require Manual Approval</Label>
              <Switch
                id="requireApproval"
                checked={requireApproval}
                onCheckedChange={setRequireApproval}
              />
            </div>
            <Button
              onClick={handleSaveBookingRules}
              disabled={saving === "Booking Rules"}
            >
              {saving === "Booking Rules" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Booking Rules
            </Button>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Payment Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="stripePublic">Stripe Public Key</Label>
              <Input
                id="stripePublic"
                value={stripePublic}
                onChange={(e) => setStripePublic(e.target.value)}
                type="password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stripeSecret">Stripe Secret Key</Label>
              <Input
                id="stripeSecret"
                value={stripeSecret}
                onChange={(e) => setStripeSecret(e.target.value)}
                type="password"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="testMode">Test Mode</Label>
              <Switch
                id="testMode"
                checked={testMode}
                onCheckedChange={setTestMode}
              />
            </div>
            <Button
              onClick={handleSavePayment}
              disabled={saving === "Payment Settings"}
            >
              {saving === "Payment Settings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Payment Settings
            </Button>
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Email Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bookingConfirm">Booking Confirmation</Label>
              <Textarea
                id="bookingConfirm"
                value={bookingConfirm}
                onChange={(e) => setBookingConfirm(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bookingReminder">Booking Reminder</Label>
              <Textarea
                id="bookingReminder"
                value={bookingReminder}
                onChange={(e) => setBookingReminder(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cancellation">Cancellation Notice</Label>
              <Textarea
                id="cancellation"
                value={cancellation}
                onChange={(e) => setCancellation(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleSaveEmailTemplates}
              disabled={saving === "Email Templates"}
            >
              {saving === "Email Templates" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Email Templates
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="newBookingNotify">Notify on New Booking</Label>
              <Switch
                id="newBookingNotify"
                checked={newBookingNotify}
                onCheckedChange={setNewBookingNotify}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cancelNotify">Notify on Cancellation</Label>
              <Switch
                id="cancelNotify"
                checked={cancelNotify}
                onCheckedChange={setCancelNotify}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dailySummary">Daily Summary Email</Label>
              <Switch
                id="dailySummary"
                checked={dailySummary}
                onCheckedChange={setDailySummary}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notifyEmail">Notification Email</Label>
              <Input
                id="notifyEmail"
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveNotifications}
              disabled={saving === "Notification Settings"}
            >
              {saving === "Notification Settings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="refundPolicy">Refund Policy</Label>
              <Textarea
                id="refundPolicy"
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="privacyPolicy">Privacy Policy URL</Label>
              <Input
                id="privacyPolicy"
                value={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="termsUrl">Terms & Conditions URL</Label>
              <Input
                id="termsUrl"
                value={termsUrl}
                onChange={(e) => setTermsUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSavePolicies}
              disabled={saving === "Policies"}
            >
              {saving === "Policies" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Policies
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}