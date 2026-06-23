const players = ['Virat Kohli', 'MS Dhoni', 'Rohit Sharma', 'Jasprit Bumrah', 'Sachin Tendulkar', 'AB de Villiers', 'Chris Gayle'];
async function fetchImages() {
  for (const player of players) {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(player)}&prop=pageimages&format=json&pithumbsize=800`);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId].thumbnail?.source;
    console.log(`${player}: ${imageUrl}`);
  }
}
fetchImages();
