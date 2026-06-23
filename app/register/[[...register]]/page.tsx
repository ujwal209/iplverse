"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white select-none">
      {/* Left Branding Side */}
      <div className="hidden lg:flex w-1/2 bg-[#0B2A96] flex-col justify-between p-12 text-white relative overflow-hidden border-r border-[#0B2A96]/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        
        {/* Animated background shapes */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#401A23]/10 rounded-full blur-[128px] animate-pulse duration-3000"></div>

        <div className="relative z-10 flex items-center">
          <Link href="/">
            <img src="/main_logo.png" alt="IPL Verse Logo" className="h-20 w-auto object-contain hover:scale-[1.02] transition-transform brightness-0 invert" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg mt-auto mb-auto">
          <h1 className="text-display text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight outfit-extrabold text-white">
            Start your journey to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">top of the leaderboard.</span>
          </h1>
          <p className="text-body text-lg text-blue-100 leading-relaxed font-sans opacity-90">
            Create an account to build your dream squad, test your cricket knowledge, and compete with fans globally.
          </p>
        </div>

        <div className="relative z-10 text-xs text-blue-200 font-mono opacity-80">
          © {new Date().getFullYear()} IPL Verse. All rights reserved.
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex flex-col p-6 sm:p-12 md:p-16 justify-center items-center bg-white text-[#401A23]">
        <div className="lg:hidden w-full flex items-center justify-center mb-8">
          <Link href="/">
            <img src="/main_logo.png" alt="IPL Verse Logo" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        <div className="w-full max-w-[420px] flex justify-center">
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            forceRedirectUrl="/onboarding"
            appearance={{
              variables: {
                colorPrimary: "#0B2A96",
                colorText: "#401A23",
                colorBackground: "#ffffff",
                colorInputText: "#401A23",
                colorInputBackground: "#ffffff",
                fontFamily: '"Google Sans", "Inter", sans-serif',
                borderRadius: "1rem",
              },
              elements: {
                card: "shadow-none border-0 bg-transparent p-0 w-full",
                headerTitle: "text-[#401A23] font-bold text-2xl outfit-bold",
                headerSubtitle: "text-[#401A23]/70 text-sm",
                socialButtonsBlockButton: "border border-[#0B2A96]/20 hover:bg-[#0B2A96]/5 text-[#401A23] font-medium",
                formButtonPrimary: "bg-[#0B2A96] hover:bg-[#0B2A96]/95 text-white font-bold py-3 rounded-2xl shadow-[0_4px_20px_rgba(18,75,126,0.3)] border-0",
                formFieldInput: "border border-[#0B2A96]/20 focus:ring-2 focus:ring-[#0B2A96] focus:border-transparent rounded-2xl text-[#401A23] bg-white",
                footerActionLink: "text-[#0B2A96] hover:underline font-bold",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
