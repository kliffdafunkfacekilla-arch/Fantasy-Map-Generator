"use strict";
function editReligions() {
  if (customization) return;
  closeDialogs("#religionsEditor, .stable");
  if (!layerIsOn("toggleReligions")) toggleReligions();
  if (layerIsOn("toggleStates")) toggleStates();
  if (layerIsOn("toggleCultures")) toggleCultures();
  if (layerIsOn("toggleBiomes")) toggleBiomes();
  if (layerIsOn("toggleProvinces")) toggleProvinces();

  const body = document.getElementById("religionsBody");
  const animate = d3.transition().duration(2000).ease(d3.easeSinIn);
  refreshReligionsEditor();

  if (modules.editReligions) return;
  modules.editReligions = true;

  $("#religionsEditor").dialog({
    title: "Religions Editor",
    resizable: false,
    width: fitContent(),
    close: closeReligionsEditor,
    position: {my: "right top", at: "right-10 top+10", of: "svg"}
  });

  // add listeners
  document.getElementById("religionsEditorRefresh").addEventListener("click", refreshReligionsEditor);
  document.getElementById("religionsEditStyle").addEventListener("click", () => editStyle("religions"));
  document.getElementById("religionsLegend").addEventListener("click", toggleLegend);
  document.getElementById("religionsPercentage").addEventListener("click", togglePercentageMode);
  document.getElementById("religionsManually").addEventListener("click", enterReligionsCustomizationMode);
  document.getElementById("religionsManuallyApply").addEventListener("click", applyReligionsChange);
  document.getElementById("religionsManuallyCancel").addEventListener("click", () => exitReligionsCustomizationMode());
  document.getElementById("religionsRestore").addEventListener("click", restoreInitialReligions);
  document.getElementById("religionsAdd").addEventListener("click", addCustomReligion);
  document.getElementById("religionsExport").addEventListener("click", downloadReligionsData);

  body.addEventListener("click", function (ev) {
    const el = ev.target;
    const cl = el.classList;
    if (el.tagName === "FILL-BOX") religionChangeColor(el);
    else if (cl.contains("icon-info-circled")) openWiki(el);
    else if (cl.contains("icon-trash-empty")) removeCustomReligion(el);
    if (customization === 7) selectReligionOnLineClick(el);
  });

  body.addEventListener("change", function (ev) {
    const el = ev.target,
      cl = el.classList;
    if (cl.contains("religionName")) religionChangeName(el);
    else if (cl.contains("religionHabitability")) religionChangeHabitability(el);
  });

  function refreshReligionsEditor() {
    religionsCollectStatistics();
    religionsEditorAddLines();
  }

  function religionsCollectStatistics() {
    const cells = pack.cells;
    const array = new Uint8Array(religionsData.i.length);
    religionsData.cells = Array.from(array);
    religionsData.area = Array.from(array);
    religionsData.rural = Array.from(array);
    religionsData.urban = Array.from(array);

    for (const i of cells.i) {
      if (cells.h[i] < 20) continue;
      const r = cells.religion[i];
      religionsData.cells[r] += 1;
      religionsData.area[r] += cells.area[i];
      religionsData.rural[r] += cells.pop[i];
      if (cells.burg[i]) religionsData.urban[r] += pack.burgs[cells.burg[i]].population;
    }
  }

  function religionsEditorAddLines() {
    const unit = " " + getAreaUnit();
    const r = religionsData;
    let lines = "",
      totalArea = 0,
      totalPopulation = 0;

    for (const i of r.i) {
      if (!i || religionsData.name[i] === "removed") continue; // ignore water and removed religions
      const area = getArea(r.area[i]);
      const rural = r.rural[i] * populationRate;
      const urban = r.urban[i] * populationRate * urbanization;
      const population = rn(rural + urban);
      const populationTip = `Total population: ${si(population)}; Rural population: ${si(
        rural
      )}; Urban population: ${si(urban)}`;
      totalArea += area;
      totalPopulation += population;

      lines += /* html */ `
        <div
          class="states religions"
          data-id="${i}"
          data-name="${r.name[i]}"
          data-cells=${r.cells[i]}
          data-area=${area}
          data-population=${population}
          data-color=${r.color[i]}
        >
          <fill-box fill="${r.color[i]}"></fill-box>
          <input data-tip="Religion name. Click and type to change" class="religionName" value="${
            r.name[i]
          }" autocorrect="off" spellcheck="false" />
          <span data-tip="Cells count" class="icon-check-empty hide"></span>
          <div data-tip="Cells count" class="religionCells hide">${r.cells[i]}</div>
          <span data-tip="Religion area" style="padding-right: 4px" class="icon-map-o hide"></span>
          <div data-tip="Religion area" class="religionArea hide">${si(area) + unit}</div>
          <span data-tip="${populationTip}" class="icon-male hide"></span>
          <div data-tip="${populationTip}" class="religionPopulation hide">${si(population)}</div>
          <span data-tip="Open Wikipedia article about the religion" class="icon-info-circled pointer hide"></span>
          ${
            i > 12 && !r.cells[i]
              ? '<span data-tip="Remove the custom religion" class="icon-trash-empty hide"></span>'
              : ""
          }
        </div>
      `;
    }
    body.innerHTML = lines;

    // update footer
    religionsFooterReligions.innerHTML = body.querySelectorAll(":scope > div").length;
    religionsFooterCells.innerHTML = pack.cells.h.filter(h => h >= 20).length;
    religionsFooterArea.innerHTML = si(totalArea) + unit;
    religionsFooterPopulation.innerHTML = si(totalPopulation);
    religionsFooterArea.dataset.area = totalArea;
    religionsFooterPopulation.dataset.population = totalPopulation;

    // add listeners
    body.querySelectorAll("div.religions").forEach(el => el.addEventListener("mouseenter", ev => religionHighlightOn(ev)));
    body.querySelectorAll("div.religions").forEach(el => el.addEventListener("mouseleave", ev => religionHighlightOff(ev)));

    if (body.dataset.type === "percentage") {
      body.dataset.type = "absolute";
      togglePercentageMode();
    }
    applySorting(religionsHeader);
    $("#religionsEditor").dialog({width: fitContent()});
  }

  function religionHighlightOn(event) {
    if (customization === 7) return;
    const religion = +event.target.dataset.id;
    religions
      .select("#religion" + religion)
      .raise()
      .transition(animate)
      .attr("stroke-width", 2)
      .attr("stroke", "#cd4c11");
  }

  function religionHighlightOff(event) {
    if (customization === 7) return;
    const religion = +event.target.dataset.id;
    const color = religionsData.color[religion];
    religions
      .select("#religion" + religion)
      .transition()
      .attr("stroke-width", 0.7)
      .attr("stroke", color);
  }

  function religionChangeColor(el) {
    const currentFill = el.getAttribute("fill");
    const religion = +el.parentNode.dataset.id;

    const callback = newFill => {
      el.fill = newFill;
      religionsData.color[religion] = newFill;
      religions
        .select("#religion" + religion)
        .attr("fill", newFill)
        .attr("stroke", newFill);
    };

    openPicker(currentFill, callback);
  }

  function religionChangeName(el) {
    const religion = +el.parentNode.dataset.id;
    el.parentNode.dataset.name = el.value;
    religionsData.name[religion] = el.value;
  }

  function openWiki(el) {
    const religionName = el.parentNode.dataset.name;
    if (religionName === "Custom" || !religionName) return tip("Please fill in the religion name", false, "error");

    const wikiBase = "https://en.wikipedia.org/wiki/";
    const pages = {
      "Hot desert": "Desert_climate#Hot_desert_climates",
      "Cold desert": "Desert_climate#Cold_desert_climates",
      Savanna: "Tropical_and_subtropical_grasslands,_savannas,_and_shrublands",
      Grassland: "Temperate_grasslands,_savannas,_and_shrublands",
      "Tropical seasonal forest": "Seasonal_tropical_forest",
      "Temperate deciduous forest": "Temperate_deciduous_forest",
      "Tropical rainforest": "Tropical_rainforest",
      "Temperate rainforest": "Temperate_rainforest",
      Taiga: "Taiga",
      Tundra: "Tundra",
      Glacier: "Glacier",
      Wetland: "Wetland"
    };
    const customReligionLink = `https://en.wikipedia.org/w/index.php?search=${religionName}`;
    const link = pages[religionName] ? wikiBase + pages[religionName] : customReligionLink;
    openURL(link);
  }

  function toggleLegend() {
    if (legend.selectAll("*").size()) {
      clearLegend();
      return;
    } // hide legend
    const d = religionsData;
    const data = Array.from(d.i)
      .filter(i => d.cells[i])
      .sort((a, b) => d.area[b] - d.area[a])
      .map(i => [i, d.color[i], d.name[i]]);
    drawLegend("Religions", data);
  }

  function togglePercentageMode() {
    if (body.dataset.type === "absolute") {
      body.dataset.type = "percentage";
      const totalCells = +religionsFooterCells.innerHTML;
      const totalArea = +religionsFooterArea.dataset.area;
      const totalPopulation = +religionsFooterPopulation.dataset.population;

      body.querySelectorAll(":scope>  div").forEach(function (el) {
        el.querySelector(".religionCells").innerHTML = rn((+el.dataset.cells / totalCells) * 100) + "%";
        el.querySelector(".religionArea").innerHTML = rn((+el.dataset.area / totalArea) * 100) + "%";
        el.querySelector(".religionPopulation").innerHTML = rn((+el.dataset.population / totalPopulation) * 100) + "%";
      });
    } else {
      body.dataset.type = "absolute";
      religionsEditorAddLines();
    }
  }

  function addCustomReligion() {
    const r = religionsData,
      i = religionsData.i.length;
    if (i > 254) {
      tip("Maximum number of religions reached (255), data cleansing is required", false, "error");
      return;
    }

    r.i.push(i);
    r.color.push(getRandomColor());
    r.name.push("Custom");
    r.cost.push(50);

    r.rural.push(0);
    r.urban.push(0);
    r.cells.push(0);
    r.area.push(0);

    const unit = getAreaUnit();
    const line = `<div class="states religions" data-id="${i}" data-name="${r.name[i]}" data-cells=0 data-area=0 data-population=0 data-color=${r.color[i]}>
      <fill-box fill="${r.color[i]}"></fill-box>
      <input data-tip="Religion name. Click and type to change" class="religionName" value="${r.name[i]}" autocorrect="off" spellcheck="false">
      <span data-tip="Cells count" class="icon-check-empty hide"></span>
      <div data-tip="Cells count" class="religionCells hide">${r.cells[i]}</div>
      <span data-tip="Religion area" style="padding-right: 4px" class="icon-map-o hide"></span>
      <div data-tip="Religion area" class="religionArea hide">0 ${unit}</div>
      <span data-tip="Total population: 0" class="icon-male hide"></span>
      <div data-tip="Total population: 0" class="religionPopulation hide">0</div>
      <span data-tip="Remove the custom religion" class="icon-trash-empty hide"></span>
    </div>`;

    body.insertAdjacentHTML("beforeend", line);
    religionsFooterReligions.innerHTML = body.querySelectorAll(":scope > div").length;
    $("#religionsEditor").dialog({width: fitContent()});
  }

  function removeCustomReligion(el) {
    const religion = +el.parentNode.dataset.id;
    el.parentNode.remove();
    religionsData.name[religion] = "removed";
    religionsFooterReligions.innerHTML = +religionsFooterReligions.innerHTML - 1;
  }

  function downloadReligionsData() {
    const unit = areaUnit.value === "square" ? distanceUnitInput.value + "2" : areaUnit.value;
    let data = "Id,Religion,Color,Cells,Area " + unit + ",Population\n"; // headers

    body.querySelectorAll(":scope > div").forEach(function (el) {
      data += el.dataset.id + ",";
      data += el.dataset.name + ",";
      data += el.dataset.color + ",";
      data += el.dataset.cells + ",";
      data += el.dataset.area + ",";
      data += el.dataset.population + "\n";
    });

    const name = getFileName("Religions") + ".csv";
    downloadFile(data, name);
  }

  function enterReligionsCustomizationMode() {
    if (!layerIsOn("toggleReligions")) toggleReligions();
    customization = 7;
    religions.append("g").attr("id", "temp");

    document.querySelectorAll("#religionsBottom > button").forEach(el => (el.style.display = "none"));
    document.querySelectorAll("#religionsBottom > div").forEach(el => (el.style.display = "block"));
    body.querySelector("div.religions").classList.add("selected");

    religionsEditor.querySelectorAll(".hide").forEach(el => el.classList.add("hidden"));
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "none"));
    religionsFooter.style.display = "none";
    $("#religionsEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    tip("Click on religion to select, drag the circle to change religion", true);
    viewbox
      .style("cursor", "crosshair")
      .on("click", selectReligionOnMapClick)
      .call(d3.drag().on("start", dragReligionBrush))
      .on("touchmove mousemove", moveReligionBrush);
  }

  function selectReligionOnLineClick(line) {
    const selected = body.querySelector("div.selected");
    if (selected) selected.classList.remove("selected");
    line.classList.add("selected");
  }

  function selectReligionOnMapClick() {
    const point = d3.mouse(this);
    const i = findCell(point[0], point[1]);
    if (pack.cells.h[i] < 20) {
      tip("You cannot reassign water via religions. Please edit the Heightmap to change water", false, "error");
      return;
    }

    const assigned = religions.select("#temp").select("polygon[data-cell='" + i + "']");
    const religion = assigned.size() ? +assigned.attr("data-religion") : pack.cells.religion[i];

    body.querySelector("div.selected").classList.remove("selected");
    body.querySelector("div[data-id='" + religion + "']").classList.add("selected");
  }

  function dragReligionBrush() {
    const r = +religionsBrush.value;

    d3.event.on("drag", () => {
      if (!d3.event.dx && !d3.event.dy) return;
      const p = d3.mouse(this);
      moveCircle(p[0], p[1], r);

      const found = r > 5 ? findAll(p[0], p[1], r) : [findCell(p[0], p[1])];
      const selection = found.filter(isLand);
      if (selection) changeReligionForSelection(selection);
    });
  }

  // change region within selection
  function changeReligionForSelection(selection) {
    const temp = religions.select("#temp");
    const selected = body.querySelector("div.selected");

    const religionNew = selected.dataset.id;
    const color = religionsData.color[religionNew];

    selection.forEach(function (i) {
      const exists = temp.select("polygon[data-cell='" + i + "']");
      const religionOld = exists.size() ? +exists.attr("data-religion") : pack.cells.religion[i];
      if (religionNew === religionOld) return;

      // change of append new element
      if (exists.size()) exists.attr("data-religion", religionNew).attr("fill", color).attr("stroke", color);
      else
        temp
          .append("polygon")
          .attr("data-cell", i)
          .attr("data-religion", religionNew)
          .attr("points", getPackPolygon(i))
          .attr("fill", color)
          .attr("stroke", color);
    });
  }

  function moveReligionBrush() {
    showMainTip();
    const point = d3.mouse(this);
    const radius = +religionsBrush.value;
    moveCircle(point[0], point[1], radius);
  }

  function applyReligionsChange() {
    const changed = religions.select("#temp").selectAll("polygon");
    changed.each(function () {
      const i = +this.dataset.cell;
      const r = +this.dataset.religion;
      pack.cells.religion[i] = r;
    });

    if (changed.size()) {
      drawReligions();
      refreshReligionsEditor();
    }
    exitReligionsCustomizationMode();
  }

  function exitReligionsCustomizationMode(close) {
    customization = 0;
    religions.select("#temp").remove();
    removeCircle();

    document.querySelectorAll("#religionsBottom > button").forEach(el => (el.style.display = "inline-block"));
    document.querySelectorAll("#religionsBottom > div").forEach(el => (el.style.display = "none"));

    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "all"));
    religionsEditor.querySelectorAll(".hide").forEach(el => el.classList.remove("hidden"));
    religionsFooter.style.display = "block";
    if (!close) $("#religionsEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    restoreDefaultEvents();
    clearMainTip();
    const selected = document.querySelector("#religionsBody > div.selected");
    if (selected) selected.classList.remove("selected");
  }

  function restoreInitialReligions() {
    religionsData = Religions.getDefault();
    Religions.define();
    drawReligions();
    recalculatePopulation();
    refreshReligionsEditor();
  }

  function closeReligionsEditor() {
    exitReligionsCustomizationMode("close");
  }
}
