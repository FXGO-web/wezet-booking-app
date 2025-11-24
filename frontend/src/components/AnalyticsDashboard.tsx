import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Activity,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { analyticsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TeamPerformance {
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

const COLORS = ['#EF7C48', '#F59E6C', '#FBB98E', '#FFD4B0', '#FFE8D2'];

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const { getAccessToken } = useAuth();

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await analyticsAPI.getOverview(timeRange);
      
      if (data) {
        setMetrics(data.metrics);
        setRevenueData(data.revenueData);
        setCategoryData(data.categoryData);
        setTeamPerformance(data.teamPerformance);
      } else {
        // Mock data for demo
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock metrics
    setMetrics([
      {
        title: 'Total Revenue',
        value: '$12,486',
        change: 12.5,
        changeLabel: 'vs last period',
        icon: DollarSign,
        trend: 'up',
      },
      {
        title: 'Total Bookings',
        value: '156',
        change: 8.2,
        changeLabel: 'vs last period',
        icon: Calendar,
        trend: 'up',
      },
      {
        title: 'Active Clients',
        value: '89',
        change: -3.1,
        changeLabel: 'vs last period',
        icon: Users,
        trend: 'down',
      },
      {
        title: 'Avg. Booking Value',
        value: '$80',
        change: 5.4,
        changeLabel: 'vs last period',
        icon: Activity,
        trend: 'up',
      },
    ]);

    // Mock revenue data (last 30 days)
    const revenue: RevenueData[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      revenue.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 800) + 200,
        bookings: Math.floor(Math.random() * 10) + 2,
      });
    }
    setRevenueData(revenue);

    // Mock category data
    setCategoryData([
      { name: 'Breathwork', value: 35, color: COLORS[0] },
      { name: 'Bodywork', value: 25, color: COLORS[1] },
      { name: 'Coaching', value: 20, color: COLORS[2] },
      { name: 'Education', value: 12, color: COLORS[3] },
      { name: 'Retreats', value: 8, color: COLORS[4] },
    ]);

    // Mock team performance
    setTeamPerformance([
      { name: 'Sarah Chen', bookings: 45, revenue: 5400, rating: 4.9 },
      { name: 'Marcus Rodriguez', bookings: 38, revenue: 4560, rating: 4.8 },
      { name: 'Emma Wilson', bookings: 42, revenue: 4200, rating: 4.7 },
      { name: 'David Kim', bookings: 31, revenue: 3720, rating: 4.6 },
    ]);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleExportReport = () => {
    // Generate comprehensive CSV report
    const sections = [
      '=== METRICS OVERVIEW ===',
      metrics.map(m => `${m.title},${m.value},${m.change}%`).join('\n'),
      '',
      '=== REVENUE DATA ===',
      'Date,Revenue,Bookings',
      ...revenueData.map(r => `${r.date},${r.revenue},${r.bookings}`),
      '',
      '=== CATEGORY BREAKDOWN ===',
      'Category,Percentage',
      ...categoryData.map(c => `${c.name},${c.value}%`),
      '',
      '=== TEAM PERFORMANCE ===',
      'Team Member,Bookings,Revenue,Rating',
      ...teamPerformance.map(t => `${t.name},${t.bookings},${t.revenue},${t.rating}`),
    ].join('\n');

    const blob = new Blob([sections], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Analytics report exported successfully');
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1>Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track performance, revenue & insights across your wellness platform
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.trend === 'up';
            const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
            
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className="text-3xl font-semibold">{metric.value}</p>
                      <div className="flex items-center gap-1">
                        <TrendIcon 
                          className={`h-4 w-4 ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`} 
                        />
                        <span className={`text-sm font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(metric.change)}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {metric.changeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue & Bookings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
          </TabsList>

          {/* Revenue Chart */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#EF7C48" 
                        strokeWidth={3}
                        name="Revenue ($)"
                        dot={{ fill: '#EF7C48', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bookings" 
                        stroke="#82ca9d" 
                        strokeWidth={3}
                        name="Bookings"
                        dot={{ fill: '#82ca9d', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Breakdown */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm font-semibold">{category.value}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${category.value}%`,
                              backgroundColor: category.color 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Performance */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e0e0e0' 
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="bookings" 
                        fill="#EF7C48" 
                        name="Bookings"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#FBB98E" 
                        name="Revenue ($)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Team Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Team Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.map((member, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.bookings} bookings • ${member.revenue.toLocaleString()} revenue
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        ⭐ {member.rating}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
