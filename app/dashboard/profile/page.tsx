import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { ProfileClient } from "./profile-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function ProfilePage() {
  let user = await currentUser();
  const supabase = getSupabase();
  
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

  let dbUser = null;
  if (supabase) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .maybeSingle();
    dbUser = data;
  }

  if (!dbUser) {
    dbUser = {
      id: "mock-uuid-1234",
      username: "Guest Kohli",
      favorite_team: "Royal Challengers Bangalore",
      favorite_player: "Virat Kohli",
      experience_level: "legend",
      games_played: 42,
      wins: 35,
      current_streak: 5,
      total_points: 1250,
      clerk_id: "mock_user_id",
    };
  }

  let unlockedIds: string[] = [];
  if (supabase) {
    const { data: achievementsData } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', dbUser.id);
    unlockedIds = achievementsData?.map((a: any) => a.achievement_id) || [];
  }

  return (
    <ProfileClient 
      dbUser={dbUser} 
      email={user.primaryEmailAddress?.emailAddress || ""} 
      unlockedIds={unlockedIds} 
    />
  );
}
