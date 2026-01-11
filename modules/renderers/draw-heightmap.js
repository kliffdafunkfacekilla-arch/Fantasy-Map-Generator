"use strict";

function drawHeightmap() {
  TIME && console.time("drawHeightmap");

  const ocean = terrs.select("#oceanHeights");
  const land = terrs.select("#landHeights");

  // Clear existing SVG paths (we are switching to Canvas)
  ocean.selectAll("*").remove();
  land.selectAll("*").remove();

  // Get or Create Canvas Container (foreignObject)
  let fo = terrs.select("#heightmapFO");
  if (fo.empty()) {
    fo = terrs.insert("foreignObject", ":first-child")
      .attr("id", "heightmapFO")
      .attr("width", graphWidth)
      .attr("height", graphHeight)
      .style("pointer-events", "none"); // Let clicks pass through to SVG

    fo.append("xhtml:canvas")
      .attr("id", "heightmapCanvas")
      .attr("width", graphWidth)
      .attr("height", graphHeight)
      .style("display", "block");
  }

  const canvas = document.getElementById("heightmapCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, graphWidth, graphHeight);

  const { cells, vertices } = grid;
  const used = new Uint8Array(cells.i.length);
  const heights = Array.from(cells.i).sort((a, b) => cells.h[a] - cells.h[b]);

  // Render Ocean
  const renderOceanCells = Boolean(+ocean.attr("data-render"));
  if (renderOceanCells) {
    const scheme = getColorScheme(ocean.attr("scheme"));
    const skip = +ocean.attr("skip") + 1 || 1;
    const relax = +ocean.attr("relax") || 0;

    // Draw base ocean
    ctx.fillStyle = scheme(1);
    ctx.fillRect(0, 0, graphWidth, graphHeight);

    let currentLayer = 0;
    for (const i of heights) {
      const h = cells.h[i];
      if (h > currentLayer) currentLayer += skip;
      if (h < currentLayer) continue;
      if (currentLayer >= 20) break;
      if (used[i]) continue;

      const onborder = cells.c[i].some(n => cells.h[n] < h);
      if (!onborder) continue;

      const vertex = cells.v[i].find(v => vertices.c[v].some(k => cells.h[k] < h));
      const chain = connectVertices(cells, vertices, vertex, h, used);
      if (chain.length < 3) continue;

      const points = simplifyLine(chain, relax).map(v => vertices.p[v]);
      drawPoly(ctx, points, getColor(h, scheme));
    }
  }

  // Render Land
  {
    const scheme = getColorScheme(land.attr("scheme"));
    const skip = +land.attr("skip") + 1 || 1;
    const relax = +land.attr("relax") || 0;

    // Draw base land
    if (!renderOceanCells) { // If ocean is off, fill background
      // or handle transparently
    }
    // But usually base land is drawn for h=20
    ctx.fillStyle = scheme(0.8); // Base land color approximately
    // Actually we should iterate layers.

    let currentLayer = 20;
    for (const i of heights) {
      const h = cells.h[i];
      if (h > currentLayer) currentLayer += skip;
      if (h < currentLayer) continue;
      if (currentLayer > 100) break;
      if (used[i]) continue;

      const onborder = cells.c[i].some(n => cells.h[n] < h);
      if (!onborder) continue;

      const startVertex = cells.v[i].find(v => vertices.c[v].some(k => cells.h[k] < h));
      const chain = connectVertices(cells, vertices, startVertex, h, used);
      if (chain.length < 3) continue;

      const points = simplifyLine(chain, relax).map(v => vertices.p[v]);

      const color = getColor(h, scheme);
      const terracing = land.attr("terracing") / 10 || 0;

      if (terracing) {
        drawPoly(ctx, points, d3.color(color).darker(terracing).hex(), 0.7, 1.4); // shadow
      }
      drawPoly(ctx, points, color);
    }
  }

  function drawPoly(ctx, points, color, dx = 0, dy = 0) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(points[0][0] + dx, points[0][1] + dy);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0] + dx, points[i][1] + dy);
    }
    ctx.fill();
  }

  // Helper to connect Voronoi vertices into a path
  function connectVertices(cells, vertices, start, h, used) {
    const MAX_ITERATIONS = vertices.c.length;
    const n = cells.i.length;
    const chain = [];
    for (let i = 0, current = start; i === 0 || (current !== start && i < MAX_ITERATIONS); i++) {
      const prev = chain[chain.length - 1];
      chain.push(current);
      const c = vertices.c[current];
      c.filter(c => cells.h[c] === h).forEach(c => (used[c] = 1));

      const c0 = c[0] >= n || cells.h[c[0]] < h;
      const c1 = c[1] >= n || cells.h[c[1]] < h;
      const c2 = c[2] >= n || cells.h[c[2]] < h;

      const v = vertices.v[current];
      if (v[0] !== prev && c0 !== c1) current = v[0];
      else if (v[1] !== prev && c1 !== c2) current = v[1];
      else if (v[2] !== prev && c0 !== c2) current = v[2];

      if (current === chain.at(-1)) break; // Loop detected
    }
    return chain;
  }

  // Optimized Simplification using 'simplify-js'
  function simplifyLine(chain, tolerance) {
    if (!tolerance || chain.length < 3) return chain;
    // Convert buffer indices to points {x,y} for simplify.js
    // But wait, chain is indices. simplify.js needs coordinates.
    // We map to coordinates later in the main loop. 
    // So we sadly need to map to coords HERE to use simplify.js, then just use them.

    // Actually the existing code mapped `map(v => vertices.p[v])` AFTER simplify.
    // But existing simplify was index-based filtering.
    // To use Visvalingam/Ramer, we need coordinates.

    const points = chain.map(v => ({ x: vertices.p[v][0], y: vertices.p[v][1] }));
    const simplified = simplify(points, tolerance, true);
    // Convert back to array of [x,y] since drawPoly expects that?
    // Or just update drawPoly to handle {x,y} objects.
    return simplified.map(p => [p.x, p.y]);
  }

  TIME && console.timeEnd("drawHeightmap");
}
