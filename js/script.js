const grid = document.getElementById('isoGrid');
const infoPanel = document.getElementById('infoPanel');
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const container = document.querySelector('.container');

// List your markdown files here
const postFiles = [
  'post1.md',
  'post2.md',
  'post3.md',
  // Add more filenames as needed
];

const tileSize = 192; // px, must match --tile-size in CSS

Promise.all(
    postFiles.map(filename =>
    fetch(`assets/posts/${filename}`)
      .then(res => res.text())
      .then(md => {
        // Simple frontmatter parser (YAML-like, at the top of the file)
        const match = md.match(/^---\s*([\s\S]*?)---\s*([\s\S]*)$/);
        let meta = {}, content = md;
        if (match) {
          const metaLines = match[1].split('\n').filter(Boolean);
          metaLines.forEach(line => {
            const [key, ...rest] = line.split(':');
            meta[key.trim()] = rest.join(':').trim();
          });
          content = match[2].trim();
        }
        return {
          img: meta.image,
          title: meta.title,
          x: Number(meta.x),
          y: Number(meta.y),
          content
        };
      })
  )
).then(tileData => {
  // Calculate grid bounds based on tileData
  const xs = tileData.map(t => t.x);
  const ys = tileData.map(t => t.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Set grid width/height to fit all tiles including isometric offset
  const isoOffset = tileSize;
  const gridCols = maxX - minX + 1;
  const gridRows = maxY - minY + 1;
  grid.style.width = (tileSize * gridCols + isoOffset * 2) + 'px';
  grid.style.height = (tileSize * gridRows + isoOffset * 2) + 'px';

  // Centering offset for isometric grid
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  let selectedTile = null;

  tileData.forEach((tile) => {
    const div = document.createElement('div');
    div.className = 'tile';
    // Use manual x and y, centered
    div.style.setProperty('--x', tile.x - centerX);
    div.style.setProperty('--y', tile.y - centerY);
    // Set z-index so tiles lower on the grid are on top
    div.style.zIndex = 1000 + (tile.x + tile.y * gridCols); // or use (tile.x + tile.y)
    div.innerHTML = `
      <img src="assets/images/${tile.img}" alt="${tile.title}" />
    `;
    div.addEventListener('click', () => {
      if (selectedTile === div) {
        div.classList.remove('selected');
        selectedTile = null;
        infoPanel.classList.remove('visible');
        container.classList.remove('panel-open');
        panelTitle.textContent = '';
        panelContent.textContent = '';
      } else {
        if (selectedTile) selectedTile.classList.remove('selected');
        div.classList.add('selected');
        selectedTile = div;
        infoPanel.classList.add('visible');
        container.classList.add('panel-open');
        panelTitle.innerHTML = marked.parseInline(tile.title); // Markdown for title
        panelContent.innerHTML = marked.parse(tile.content);   // Markdown for content
      }
    });
    grid.appendChild(div);
  });
});