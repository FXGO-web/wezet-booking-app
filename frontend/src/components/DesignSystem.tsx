import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Calendar, Heart, Sparkles, Wind, Zap } from "lucide-react";

export function DesignSystem() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 lg:p-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-4">
          <h1>WEZET Design System</h1>
          <p className="text-muted-foreground max-w-2xl">
            A premium wellness platform design system focused on clarity, balance, and elevated experiences.
          </p>
        </div>

        {/* Brand Colors */}
        <section className="space-y-8">
          <div>
            <h2>Color Palette</h2>
            <p className="text-muted-foreground mt-2">Orange wellness palette with sand, off-white, charcoal, and soft gradients</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#EF7C48] shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Primary Orange</p>
                <p className="text-xs text-muted-foreground">#EF7C48</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#F7A679] shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Orange Light</p>
                <p className="text-xs text-muted-foreground">#F7A679</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#C45F32] shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Orange Dark</p>
                <p className="text-xs text-muted-foreground">#C45F32</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#FCE3D4] border shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Orange Muted</p>
                <p className="text-xs text-muted-foreground">#FCE3D4</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#E8DDD0] shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Sand</p>
                <p className="text-xs text-muted-foreground">#E8DDD0</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#FDF9F5] border shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Off White</p>
                <p className="text-xs text-muted-foreground">#FDF9F5</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-[#2A2A2E] shadow-md"></div>
              <div className="space-y-1">
                <p className="text-sm">Charcoal</p>
                <p className="text-xs text-muted-foreground">#2A2A2E</p>
              </div>
            </div>
            
            <div className="space-y-3 col-span-2">
              <div className="h-24 rounded-2xl shadow-md" style={{
                background: 'linear-gradient(135deg, #EF7C48 0%, #F5A26D 100%)'
              }}></div>
              <div className="space-y-1">
                <p className="text-sm">Orange Gradient A</p>
                <p className="text-xs text-muted-foreground">Primary gradient</p>
              </div>
            </div>
            
            <div className="space-y-3 col-span-2">
              <div className="h-24 rounded-2xl shadow-md" style={{
                background: 'linear-gradient(135deg, #FCE3D4 0%, #F7A679 100%)'
              }}></div>
              <div className="space-y-1">
                <p className="text-sm">Orange Gradient B</p>
                <p className="text-xs text-muted-foreground">Soft glow gradient</p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Typography */}
        <section className="space-y-8">
          <div>
            <h2>Typography</h2>
            <p className="text-muted-foreground mt-2">Clean, modern typographic scale with breathing room</p>
          </div>
          
          <div className="space-y-6 bg-card p-8 rounded-2xl border shadow-sm">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Display Large</p>
              <div className="text-[3.5rem] font-medium leading-[1.2] tracking-[-0.02em]">WEZET</div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Heading 1</p>
              <h1>Find Your Balance</h1>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Heading 2</p>
              <h2>Upcoming Sessions</h2>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Heading 3</p>
              <h3>Energy & Breathwork</h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Body Text</p>
              <p>Experience elevated wellness through modern movement, breathwork, and energy balancing practices designed for clarity.</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Small Text</p>
              <p className="text-sm text-muted-foreground">Supporting text and metadata</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Spacing Scale */}
        <section className="space-y-8">
          <div>
            <h2>Spacing Scale</h2>
            <p className="text-muted-foreground mt-2">Breathable, consistent spacing system</p>
          </div>
          
          <div className="bg-card p-8 rounded-2xl border shadow-sm">
            <div className="space-y-4">
              {[
                { size: '4px', label: 'xs', width: 'w-1' },
                { size: '8px', label: 'sm', width: 'w-2' },
                { size: '16px', label: 'base', width: 'w-4' },
                { size: '24px', label: 'md', width: 'w-6' },
                { size: '32px', label: 'lg', width: 'w-8' },
                { size: '48px', label: 'xl', width: 'w-12' },
                { size: '64px', label: '2xl', width: 'w-16' },
                { size: '96px', label: '3xl', width: 'w-24' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-6">
                  <div className={`${item.width} h-12 bg-primary rounded-lg`}></div>
                  <div className="text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground ml-3">{item.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* Buttons */}
        <section className="space-y-8">
          <div>
            <h2>Buttons</h2>
            <p className="text-muted-foreground mt-2">Clean buttons with subtle depth and hover states</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Primary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">Book Session</Button>
                <Button className="w-full" size="sm">Small</Button>
                <Button className="w-full" size="lg">Large</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Secondary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" className="w-full">View Calendar</Button>
                <Button variant="secondary" className="w-full" size="sm">Small</Button>
                <Button variant="secondary" className="w-full" size="lg">Large</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Outline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">Learn More</Button>
                <Button variant="outline" className="w-full" size="sm">Small</Button>
                <Button variant="outline" className="w-full" size="lg">Large</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ghost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full">Cancel</Button>
                <Button variant="ghost" className="w-full" size="sm">Small</Button>
                <Button variant="ghost" className="w-full" size="lg">Large</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">With Icons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button variant="secondary" className="w-full">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorite
                </Button>
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Featured
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Inputs */}
        <section className="space-y-8">
          <div>
            <h2>Input Fields</h2>
            <p className="text-muted-foreground mt-2">Clean forms with soft backgrounds</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label>Email</label>
                  <Input type="email" placeholder="name@example.com" />
                </div>
                <div className="space-y-2">
                  <label>Full Name</label>
                  <Input placeholder="Enter your name" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Disabled State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label>Disabled Input</label>
                  <Input disabled placeholder="Disabled field" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Cards */}
        <section className="space-y-8">
          <div>
            <h2>Cards</h2>
            <p className="text-muted-foreground mt-2">Elevated surfaces with soft shadows</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>With header and description</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Clean card design with consistent padding and rounded corners.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>With primary border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Used for emphasis or active states.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Muted Background</CardTitle>
                <CardDescription>Subtle differentiation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Secondary information or inactive states.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section className="space-y-8">
          <div>
            <h2>Badges</h2>
            <p className="text-muted-foreground mt-2">Status indicators and labels</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Available</Badge>
            <Badge variant="outline">Pending</Badge>
            <Badge variant="destructive">Cancelled</Badge>
            <Badge className="bg-[#0D7A7A] text-white">Confirmed</Badge>
            <Badge className="bg-[#E8DDD0] text-[#2A2A2E]">Completed</Badge>
          </div>
        </section>

        <Separator />

        {/* Icons */}
        <section className="space-y-8">
          <div>
            <h2>Iconography</h2>
            <p className="text-muted-foreground mt-2">Minimal, outlined icons from Lucide</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: Calendar, label: 'Calendar' },
              { icon: Heart, label: 'Favorite' },
              { icon: Sparkles, label: 'Featured' },
              { icon: Wind, label: 'Breathwork' },
              { icon: Zap, label: 'Energy' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border">
                <Icon className="h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Radius & Shadows */}
        <section className="space-y-8">
          <div>
            <h2>Border Radius & Shadows</h2>
            <p className="text-muted-foreground mt-2">Rounded geometry with soft, elevated shadows</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="h-24 bg-card border rounded-sm shadow-sm"></div>
              <p className="text-sm">Small · 6px</p>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-card border rounded-md shadow-md"></div>
              <p className="text-sm">Medium · 10px</p>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-card border rounded-lg shadow-lg"></div>
              <p className="text-sm">Large · 14px</p>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-card border rounded-2xl shadow-xl"></div>
              <p className="text-sm">XL · 20px</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}