async function fetchTeamLogo(teamName: string) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(teamName)}&gsrlimit=1&pithumbsize=500`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.query || !data.query.pages) return null;

    const pages = Object.values(data.query.pages) as any[];
    if (pages.length > 0 && pages[0].thumbnail && pages[0].thumbnail.source) {
      return pages[0].thumbnail.source;
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log("CSK:", await fetchTeamLogo("Chennai Super Kings"));
  console.log("MI:", await fetchTeamLogo("Mumbai Indians"));
}
run();
