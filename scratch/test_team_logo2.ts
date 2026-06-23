async function run() {
  const teamName = "Chennai Super Kings";
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(teamName)}&gsrlimit=1&pithumbsize=500`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
