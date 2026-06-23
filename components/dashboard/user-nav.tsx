"use client";

import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";

interface UserNavProps {
  firstName?: string | null;
  emailAddress?: string | null;
}

export function UserNav({ firstName, emailAddress }: UserNavProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium inter-regular hidden sm:inline-block">
          {firstName ? `Hi, ${firstName}` : emailAddress}
        </span>
        <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium inter-regular text-muted-foreground hidden sm:inline-block">
        Guest Player
      </span>
      <SignInButton mode="modal">
        <button className="text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all cursor-pointer">
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}
