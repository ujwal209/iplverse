# IPL Verse 🏏

IPL Verse is the ultimate cricket gaming and analytics platform built for fans of the Indian Premier League. Dive into an interactive world of cricket trivia, historical statistics, and multiplayer arenas!

Whether you're looking to challenge your friends in a real-time 1v1 battle, test your knowledge in engaging mini-games, or dive deep into our comprehensive Stat Warehouse, IPL Verse has something for every cricket fanatic.

## 🎮 Game Modes

- **1v1 Battle Arena**: Challenge your friends in live, real-time multiplayer trivia matches. Customize turn timers, game formats, and round counts!
- **Guess Who**: Deduce the mystery IPL cricketer using visual clues like batting/bowling style, nationality, and team history.
- **Stat Smash**: Compare historic statistics of IPL legends and guess if a stat is higher or lower to build your streak.
- **Guess the Match**: Analyze a partially redacted historic match sheet and deduce the exact IPL clash.
- **Career Path**: Reconstruct a player's franchise timeline chronologically from their debut season to today.
- **Connections**: Group a grid of 16 IPL stars into 4 distinct groups based on subtle shared associations.
- **Arena Quiz**: Tackle trivia questions curated from real IPL match scenarios and records, categorized by Era and Difficulty.

## 📊 Stat Warehouse (Analytics Hub)

Dive into the most comprehensive IPL historical database:
- **Player Profiles**: Find detailed stats for any IPL player.
- **Head to Head**: Directly compare the historic match-ups between batters and bowlers.
- **Venues & Teams**: Stadium statistics, franchise records, and team histories.
- **Leaderboards**: Track the all-time top run-scorers and wicket-takers.

## 💻 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Realtime**: Supabase Realtime for 1v1 Battle Arena 
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Engine**: Groq (for generating dynamic trivia & hints)

## 🚀 Getting Started

First, set up your environment variables by creating a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

GROQ_API_KEY=your_groq_api_key
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 The Team

Built with ❤️ by:
- **Pranay** - [LinkedIn](https://www.linkedin.com/in/pranaysb/)
- **Ujwal** - [LinkedIn](https://www.linkedin.com/in/ujwal-venkatesh-b85829326/)

For any enquiries or collaborations, feel free to reach out to us at:
`pranaysb9@gmail.com` or `easynetcraft@gmail.com`
