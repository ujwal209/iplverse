"use server"

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

export async function completeOnboarding(formData: {
  username: string;
  favorite_team: string;
  favorite_player: string;
  experience_level: string;
}) {
  try {
    // Authenticate the user securely on the backend
    const user = await currentUser();
    if (!user) {
      throw new Error("You must be logged in to complete onboarding.");
    }

    // Initialize Supabase with the Service Role Key to bypass RLS
    // We do this securely on the server so the key is never exposed to the browser.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase server keys are not configured properly.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the user profile using the service role key
    const { error } = await supabase.from('users').insert({
      clerk_id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      username: formData.username,
      favorite_team: formData.favorite_team,
      favorite_player: formData.favorite_player,
      experience_level: formData.experience_level
    });

    if (error) {
      console.error("Supabase insert error:", error);
      const msg = error.message || "";
      if (error.code === "23505" || msg.includes("users_username_key")) {
        throw new Error("This username is already taken. Please choose another one.");
      }
      if (msg.includes("users_clerk_id_key") || msg.includes("users_pkey")) {
        throw new Error("You have already completed onboarding.");
      }
      throw new Error(error.message || "Failed to create user profile.");
    }

    return { success: true };
  } catch (err: any) {
    console.error("Action error:", err);
    return { success: false, error: err.message || "Failed to save profile." };
  }
}
