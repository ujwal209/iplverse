import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { UserNav } from "@/components/dashboard/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarTrigger } from "@/components/dashboard/sidebar-trigger";
import { createClient } from "@supabase/supabase-js";
import { RealtimeSocialListener } from "@/components/dashboard/realtime-social-listener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = await currentUser();
  
  if (!user) {
    user = {
      id: "mock_user_id",
      firstName: "Guest",
      lastName: "User",
      imageUrl: "",
      primaryEmailAddress: {
        emailAddress: "guest@example.com",
      },
    } as any;
  }

  // Check if onboarding is completed
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile, error } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('clerk_id', user.id)
    .maybeSingle();

  // Redirect to onboarding if they haven't completed it
  if (!profile || error) {
    redirect("/onboarding");
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Global Dashboard Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur h-20 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center">
            <SidebarTrigger />
            <Link href="/" className="flex items-center">
              <img src="/main_logo.png" alt="IPL Verse Logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>
          <UserNav 
            firstName={user.firstName} 
            emailAddress={user.primaryEmailAddress?.emailAddress} 
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <RealtimeSocialListener />
    </div>
  );
}
