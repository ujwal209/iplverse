import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

interface GifPickerProps {
  onSelect: (url: string) => void;
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Giphy public beta key (for demonstration)
  const GIPHY_API_KEY = "dc6zaTOxFJmzC";

  useEffect(() => {
    // Load trending by default
    fetchGifs("");
  }, []);

  const fetchGifs = async (searchQuery: string) => {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=15`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=15`;
        
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.data) {
        setGifs(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch GIFs:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    // Simple debounce
    const timeoutId = setTimeout(() => {
      fetchGifs(val);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="w-[300px] sm:w-[320px] h-[350px] bg-white border border-slate-200 shadow-xl rounded-2xl flex flex-col overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex items-center gap-2 relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search GIFs..."
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0B2A96] transition-colors"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 text-[#0B2A96] animate-spin" />
          </div>
        ) : gifs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="w-full h-[100px] rounded-xl overflow-hidden hover:opacity-80 transition-opacity bg-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B2A96]"
              >
                <img 
                  src={gif.images.fixed_height_small.url} 
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-400">
            No GIFs found
          </div>
        )}
      </div>
    </div>
  );
}
