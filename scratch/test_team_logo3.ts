async function run() {
  const teamName = "Chennai Super Kings";
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(teamName)}&gsrlimit=1&pithumbsize=500`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "IPLverse/1.0 (test)"
    }
  });
  if (!response.ok) {
    console.log("Error status:", response.status);
    return;
  }
  const text = await response.text();
  console.log("Response starts with:", text.substring(0, 100));
}
run();
