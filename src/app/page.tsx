import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, BarChart3, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const features = [
    {
      title: "Manage Events",
      description: "Create, update, and track poker events.",
      href: "/events",
      icon: <CalendarDays className="h-10 w-10 text-primary" />,
    },
    {
      title: "Manage Players",
      description: "Keep a directory of all players and their stats.",
      href: "/players",
      icon: <Users className="h-10 w-10 text-primary" />,
    },
    {
      title: "View Statistics",
      description: "Analyze performance with detailed statistics.",
      href: "/seasons", // Link to seasons for leaderboards, can be /stats later
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
    },
    {
      title: "App Settings",
      description: "Customize application preferences.",
      href: "/settings",
      icon: <Settings className="h-10 w-10 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <h1 className="font-headline text-4xl font-bold text-primary mb-6">
        Poker Tournament Manager
      </h1>
      <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl">
        Welcome to your central hub for organizing and managing poker tournaments.
        Access key features below to get started.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full max-w-4xl">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              {feature.icon}
              <div className="flex flex-col">
                <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">{feature.description}</CardDescription>
              <Button asChild className="w-full">
                <Link href={feature.href}>Go to {feature.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
