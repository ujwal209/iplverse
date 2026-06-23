"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { VenueAutocomplete } from "@/components/dashboard/venue-autocomplete";

export default function VenuesHub() {
  const router = useRouter();
  const [venue, setVenue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue.trim()) return;
    router.push(`/dashboard/analytics/venues/${encodeURIComponent(venue)}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-12 max-w-5xl mx-auto pt-12 pb-24">
      <div className="text-center space-y-4 w-full">
        <div className="mx-auto h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-lg">
          <MapPin className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold outfit-bold tracking-tight">Venue Analytics</h1>
        <p className="inter-regular text-muted-foreground text-lg max-w-2xl mx-auto">
          Deep dive into stadium statistics, pitch behaviors, and historical scoring patterns.
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto mt-8 bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-10">
        <form onSubmit={handleSearch} className="flex flex-col gap-6 items-center justify-center">
          <VenueAutocomplete 
            placeholder="Search Stadiums..."
            value={venue}
            onChange={setVenue}
          />
          
          <button 
            type="submit" 
            disabled={!venue} 
            className="h-14 px-12 text-lg outfit-bold rounded-xl w-full sm:w-auto mt-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Explore Stadium
          </button>
        </form>
      </div>
    </div>
  );
}
