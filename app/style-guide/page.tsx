"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { Rocket, Users, TrendingUp, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/shared/stat-tile";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { GradientText } from "@/components/shared/gradient-text";
import { AnimatedGradientBorder } from "@/components/shared/animated-gradient-border";
import { BentoGrid, BentoTile } from "@/components/shared/bento-grid";
import {
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonStatTile,
  SkeletonBentoGrid,
} from "@/components/shared/skeletons";
import { toast } from "@/lib/toast";
import { useSpotlightHover } from "@/lib/use-spotlight-hover";

function ThrowButton() {
  const [shouldThrow, setShouldThrow] = useState(false);
  if (shouldThrow) {
    throw new Error("Style guide demo error — this is intentional.");
  }
  return (
    <Button variant="destructive" onClick={() => setShouldThrow(true)}>
      Trigger error boundary
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-h3 font-display font-bold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const onSpotlightMove = useSpotlightHover(spotlightRef);

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <header className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["bg-brand", "Primary"],
            ["bg-brand-hover", "Primary hover"],
            ["bg-brand-subtle", "Primary subtle"],
            ["bg-gradient-2", "Gradient-2 (teal)"],
            ["bg-ink", "Secondary/Ink"],
            ["bg-success", "Success"],
            ["bg-warning", "Warning"],
            ["bg-danger", "Danger"],
          ].map(([cls, label]) => (
            <div key={cls} className="space-y-1.5">
              <div className={`h-14 rounded-md border border-border-default ${cls}`} />
              <p className="text-caption text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <p className="text-display-xl font-display font-bold">Display XL</p>
          <p className="text-display-lg font-display font-bold">Display LG</p>
          <p className="text-display-md font-display font-bold">Display MD</p>
          <p className="text-h3 font-semibold">Heading H3</p>
          <p className="text-h4 font-semibold">Heading H4</p>
          <p className="text-body-lg">Body LG — marketing lead paragraph text.</p>
          <p className="text-body">Body — default UI/body text.</p>
          <p className="text-body-sm text-text-secondary">Body SM — table cells, helper text.</p>
          <p className="text-caption font-medium uppercase tracking-wide text-text-muted">
            Caption / label
          </p>
          <p className="font-mono text-body-sm">A8X9-2LmQ (monospace device code)</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button variant="primary" size="hero">
            Hero CTA
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Cards (standard / glass / bento)">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Standard card</CardTitle>
              <CardDescription>bg-card, border, shadow-xs</CardDescription>
            </CardHeader>
            <CardContent>Default card variant.</CardContent>
          </Card>
          <GradientMesh className="rounded-lg p-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Glass card</CardTitle>
                <CardDescription>Floating over a gradient mesh</CardDescription>
              </CardHeader>
              <CardContent>Only for floating/overlay contexts.</CardContent>
            </Card>
          </GradientMesh>
          <div
            ref={spotlightRef}
            onMouseMove={onSpotlightMove}
            className="spotlight rounded-lg border border-border-default bg-bg-card p-6 shadow-xs"
          >
            <p className="text-h4 font-semibold">Spotlight hover</p>
            <p className="text-body-sm text-text-muted">Move your cursor over this card (desktop).</p>
          </div>
        </div>
      </Section>

      <Section title="Gradient text, gradient border, glow">
        <div className="space-y-6">
          <p className="text-display-md font-display font-bold">
            Turn every tap into a <GradientText>Google review</GradientText>
          </p>
          <AnimatedGradientBorder className="inline-block">
            <Button variant="primary" size="hero" className="border-0">
              Activate Device
            </Button>
          </AnimatedGradientBorder>
          <Card className="glow-success inline-block">
            <CardContent className="pt-6">Glow accent (trending-up context)</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Bento grid">
        <BentoGrid>
          <BentoTile span="hero" glow>
            <StatTile label="Total scans this month" value={4280} trend={{ direction: "up", percent: 18 }} />
          </BentoTile>
          <BentoTile>
            <StatTile label="Active devices" value={12} trend={{ direction: "up", percent: 4 }} />
          </BentoTile>
          <BentoTile>
            <StatTile label="Locations" value={3} />
          </BentoTile>
          <BentoTile>
            <StatTile label="Employees ranked" value={9} trend={{ direction: "down", percent: 2 }} />
          </BentoTile>
        </BentoGrid>
      </Section>

      <Section title="Status badges">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="active" />
          <StatusBadge status="unassigned" />
          <StatusBadge status="deactivated" />
          <StatusBadge status="pending" />
          <StatusBadge status="grace_period" />
          <StatusBadge status="suspended" />
        </div>
      </Section>

      <Section title="Form elements">
        <div className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sg-input">Location name</Label>
            <Input id="sg-input" placeholder="e.g. Downtown Cafe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sg-textarea">Message</Label>
            <Textarea id="sg-textarea" placeholder="Type here..." />
          </div>
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Scans</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono">A8X9-2LmQ</TableCell>
              <TableCell>Downtown Cafe</TableCell>
              <TableCell>
                <StatusBadge status="active" />
              </TableCell>
              <TableCell className="text-right">142</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">uhzy-lSOZ</TableCell>
              <TableCell>—</TableCell>
              <TableCell>
                <StatusBadge status="unassigned" />
              </TableCell>
              <TableCell className="text-right">0</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Smartphone}
          title="Let's get your first device live"
          description="Activate a device to start tracking scans and reviews."
          action={
            <Button>
              <Rocket className="size-4" /> Activate a device
            </Button>
          }
        />
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate device?</DialogTitle>
              <DialogDescription>
                This device will stop redirecting scans. You can reactivate it later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button variant="destructive">Deactivate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.success("Device activated")}>
            Fire success
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Payment failed")}>
            Fire error
          </Button>
          <Button variant="secondary" onClick={() => toast.warning("Grace period started")}>
            Fire warning
          </Button>
          <Button variant="secondary" onClick={() => toast.info("Synced with Stripe")}>
            Fire info
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              for (let i = 0; i < 5; i++) {
                setTimeout(() => toast.success(`Rapid toast #${i + 1}`), i * 80);
              }
            }}
          >
            Fire 5 rapidly (test max-3 stacking)
          </Button>
        </div>
      </Section>

      <Section title="Skeletons (loading states)">
        <div className="space-y-4">
          <SkeletonText />
          <SkeletonCard />
          <SkeletonTable rows={2} columns={3} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SkeletonStatTile />
            <SkeletonStatTile />
          </div>
          <SkeletonBentoGrid />
        </div>
      </Section>

      <Section title="Error boundary (throws on click)">
        <ThrowButton />
      </Section>

      <Section title="404 page">
        <p className="text-body-sm text-text-muted">
          Visit{" "}
          <a href="/this-does-not-exist" className="text-brand underline">
            /this-does-not-exist
          </a>{" "}
          to see the themed 404 page.
        </p>
      </Section>

      <Section title="Icons + trend context">
        <div className="flex gap-6 text-text-secondary">
          <Users className="size-6" />
          <TrendingUp className="size-6" />
          <Smartphone className="size-6" />
        </div>
      </Section>
    </div>
  );
}
