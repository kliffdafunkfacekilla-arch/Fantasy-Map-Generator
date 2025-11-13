"use strict";
function editProvinces() {
  if (customization) return;
  closeDialogs("#provincesEditor, .stable");
  if (!layerIsOn("toggleProvinces")) toggleProvinces();
  if (!layerIsOn("toggleBiomes")) toggleBiomes();
  if (layerIsOn("toggleCultures")) toggleCultures();
  if (layerIsOn("toggleReligions")) toggleReligions();
  if (layerIsOn("toggleStates")) toggleStates();

  const body = document.getElementById("provincesBody");
  const animate = d3.transition().duration(2000).ease(d3.easeSinIn);
  refreshProvincesEditor();

  if (modules.editProvinces) return;
  modules.editProvinces = true;

  $("#provincesEditor").dialog({
    title: "Provinces Editor",
    resizable: false,
    width: fitContent(),
    close: closeProvincesEditor,
    position: {my: "right top", at: "right-10 top+10", of: "svg"}
  });

  // add listeners
  document.getElementById("provincesEditorRefresh").addEventListener("click", refreshProvincesEditor);
  document.getElementById("provincesEditStyle").addEventListener("click", () => editStyle("provinces"));
  document.getElementById("provincesLegend").addEventListener("click", toggleLegend);
  document.getElementById("provincesPercentage").addEventListener("click", togglePercentageMode);
  document.getElementById("provincesManually").addEventListener("click", enterProvincesCustomizationMode);
  document.getElementById("provincesManuallyApply").addEventListener("click", applyProvincesChange);
  document.getElementById("provincesManuallyCancel").addEventListener("click", () => exitProvincesCustomizationMode());
  document.getElementById("provincesRestore").addEventListener("click", restoreInitialProvinces);
  document.getElementById("provincesAdd").addEventListener("click", addCustomProvince);
  document.getElementById("provincesExport").addEventListener("click", downloadProvincesData);

  body.addEventListener("click", function (ev) {
    const el = ev.target;
    const cl = el.classList;
    if (el.tagName === "FILL-BOX") provinceChangeColor(el);
    else if (cl.contains("icon-info-circled")) openWiki(el);
    else if (cl.contains("icon-trash-empty")) removeCustomProvince(el);
    if (customization === 9) selectProvinceOnLineClick(el);
  });

  body.addEventListener("change", function (ev) {
    const el = ev.target,
      cl = el.classList;
    if (cl.contains("provinceName")) provinceChangeName(el);
  });

  function refreshProvincesEditor() {
    provincesCollectStatistics();
    provincesEditorAddLines();
  }

  function provincesCollectStatistics() {
    const cells = pack.cells;
    const array = new Uint8Array(provincesData.i.length);
    provincesData.cells = Array.from(array);
    provincesData.area = Array.from(array);
    provincesData.rural = Array.from(array);
    provincesData.urban = Array.from(array);

    for (const i of cells.i) {
      if (cells.h[i] < 20) continue;
      const p = cells.province[i];
      provincesData.cells[p] += 1;
      provincesData.area[p] += cells.area[i];
      provincesData.rural[p] += cells.pop[i];
      if (cells.burg[i]) provincesData.urban[p] += pack.burgs[cells.burg[i]].population;
    }
  }

  function provincesEditorAddLines() {
    const unit = " " + getAreaUnit();
    const p = provincesData;
    let lines = "",
      totalArea = 0,
      totalPopulation = 0;

    for (const i of p.i) {
      if (!i || provincesData.name[i] === "removed") continue; // ignore water and removed provinces
      const area = getArea(p.area[i]);
      const rural = p.rural[i] * populationRate;
      const urban = p.urban[i] * populationRate * urbanization;
      const population = rn(rural + urban);
      const populationTip = `Total population: ${si(population)}; Rural population: ${si(
        rural
      )}; Urban population: ${si(urban)}`;
      totalArea += area;
      totalPopulation += population;

      lines += /* html */ `
        <div
          class="states provinces"
          data-id="${i}"
          data-name="${p.name[i]}"
          data-cells=${p.cells[i]}
          data-area=${area}
          data-population=${population}
          data-color=${p.color[i]}
        >
          <fill-box fill="${p.color[i]}"></fill-box>
          <input data-tip="Province name. Click and type to change" class="provinceName" value="${
            p.name[i]
          }" autocorrect="off" spellcheck="false" />
          <span data-tip="Cells count" class="icon-check-empty hide"></span>
          <div data-tip="Cells count" class="provinceCells hide">${p.cells[i]}</div>
          <span data-tip="Province area" style="padding-right: 4px" class="icon-map-o hide"></span>
          <div data-tip="Province area" class="provinceArea hide">${si(area) + unit}</div>
          <span data-tip="${populationTip}" class="icon-male hide"></span>
          <div data-tip="${populationTip}" class="provincePopulation hide">${si(population)}</div>
          <span data-tip="Open Wikipedia article about the province" class="icon-info-circled pointer hide"></span>
          ${
            i > 12 && !p.cells[i]
              ? '<span data-tip="Remove the custom province" class="icon-trash-empty hide"></span>'
              : ""
          }
        </div>
      `;
    }
    body.innerHTML = lines;

    // update footer
    provincesFooterProvinces.innerHTML = body.querySelectorAll(":scope > div").length;
    provincesFooterCells.innerHTML = pack.cells.h.filter(h => h >= 20).length;
    provincesFooterArea.innerHTML = si(totalArea) + unit;
    provincesFooterPopulation.innerHTML = si(totalPopulation);
    provincesFooterArea.dataset.area = totalArea;
    provincesFooterPopulation.dataset.population = totalPopulation;

    // add listeners
    body.querySelectorAll("div.provinces").forEach(el => el.addEventListener("mouseenter", ev => provinceHighlightOn(ev)));
    body.querySelectorAll("div.provinces").forEach(el => el.addEventListener("mouseleave", ev => provinceHighlightOff(ev)));

    if (body.dataset.type === "percentage") {
      body.dataset.type = "absolute";
      togglePercentageMode();
    }
    applySorting(provincesHeader);
    $("#provincesEditor").dialog({width: fitContent()});
  }

  function provinceHighlightOn(event) {
    if (customization === 9) return;
    const province = +event.target.dataset.id;
    provinces
      .select("#province" + province)
      .raise()
      .transition(animate)
      .attr("stroke-width", 2)
      .attr("stroke", "#cd4c11");
  }

  function provinceHighlightOff(event) {
    if (customization === 9) return;
    const province = +event.target.dataset.id;
    const color = provincesData.color[province];
    provinces
      .select("#province" + province)
      .transition()
      .attr("stroke-width", 0.7)
      .attr("stroke", color);
  }

  function provinceChangeColor(el) {
    const currentFill = el.getAttribute("fill");
    const province = +el.parentNode.dataset.id;

    const callback = newFill => {
      el.fill = newFill;
      provincesData.color[province] = newFill;
      provinces
        .select("#province" + province)
        .attr("fill", newFill)
        .attr("stroke", newFill);
    };

    openPicker(currentFill, callback);
  }

  function provinceChangeName(el) {
    const province = +el.parentNode.dataset.id;
    el.parentNode.dataset.name = el.value;
    provincesData.name[province] = el.value;
  }

  function openWiki(el) {
    const provinceName = el.parentNode.dataset.name;
    if (provinceName === "Custom" || !provinceName) return tip("Please fill in the province name", false, "error");
    const customProvinceLink = `https://en.wikipedia.org/w/index.php?search=${provinceName}`;
    openURL(customProvinceLink);
  }

  function toggleLegend() {
    if (legend.selectAll("*").size()) {
      clearLegend();
      return;
    } // hide legend
    const d = provincesData;
    const data = Array.from(d.i)
      .filter(i => d.cells[i])
      .sort((a, b) => d.area[b] - d.area[a])
      .map(i => [i, d.color[i], d.name[i]]);
    drawLegend("Provinces", data);
  }

  function togglePercentageMode() {
    if (body.dataset.type === "absolute") {
      body.dataset.type = "percentage";
      const totalCells = +provincesFooterCells.innerHTML;
      const totalArea = +provincesFooterArea.dataset.area;
      const totalPopulation = +provincesFooterPopulation.dataset.population;

      body.querySelectorAll(":scope>  div").forEach(function (el) {
        el.querySelector(".provinceCells").innerHTML = rn((+el.dataset.cells / totalCells) * 100) + "%";
        el.querySelector(".provinceArea").innerHTML = rn((+el.dataset.area / totalArea) * 100) + "%";
        el.querySelector(".provincePopulation").innerHTML = rn((+el.dataset.population / totalPopulation) * 100) + "%";
      });
    } else {
      body.dataset.type = "absolute";
      provincesEditorAddLines();
    }
  }

  function addCustomProvince() {
    const p = provincesData,
      i = provincesData.i.length;
    if (i > 254) {
      tip("Maximum number of provinces reached (255), data cleansing is required", false, "error");
      return;
    }

    p.i.push(i);
    p.color.push(getRandomColor());
    p.name.push("Custom");
    p.cost.push(50);

    p.rural.push(0);
    p.urban.push(0);
    p.cells.push(0);
    p.area.push(0);

    const unit = getAreaUnit();
    const line = `<div class="states provinces" data-id="${i}" data-name="${p.name[i]}" data-cells=0 data-area=0 data-population=0 data-color=${p.color[i]}>
      <fill-box fill="${p.color[i]}"></fill-box>
      <input data-tip="Province name. Click and type to change" class="provinceName" value="${p.name[i]}" autocorrect="off" spellcheck="false">
      <span data-tip="Cells count" class="icon-check-empty hide"></span>
      <div data-tip="Cells count" class="provinceCells hide">${p.cells[i]}</div>
      <span data-tip="Province area" style="padding-right: 4px" class="icon-map-o hide"></span>
      <div data-tip="Province area" class="provinceArea hide">0 ${unit}</div>
      <span data-tip="Total population: 0" class="icon-male hide"></span>
      <div data-tip="Total population: 0" class="provincePopulation hide">0</div>
      <span data-tip="Remove the custom province" class="icon-trash-empty hide"></span>
    </div>`;

    body.insertAdjacentHTML("beforeend", line);
    provincesFooterProvinces.innerHTML = body.querySelectorAll(":scope > div").length;
    $("#provincesEditor").dialog({width: fitContent()});
  }

  function removeCustomProvince(el) {
    const province = +el.parentNode.dataset.id;
    el.parentNode.remove();
    provincesData.name[province] = "removed";
    provincesFooterProvinces.innerHTML = +provincesFooterProvinces.innerHTML - 1;
  }

  function downloadProvincesData() {
    const unit = areaUnit.value === "square" ? distanceUnitInput.value + "2" : areaUnit.value;
    let data = "Id,Province,Color,Cells,Area " + unit + ",Population\n"; // headers

    body.querySelectorAll(":scope > div").forEach(function (el) {
      data += el.dataset.id + ",";
      data += el.dataset.name + ",";
      data += el.dataset.color + ",";
      data += el.dataset.cells + ",";
      data += el.dataset.area + ",";
      data += el.dataset.population + "\n";
    });

    const name = getFileName("Provinces") + ".csv";
    downloadFile(data, name);
  }

  function enterProvincesCustomizationMode() {
    if (!layerIsOn("toggleProvinces")) toggleProvinces();
    customization = 9;
    provinces.append("g").attr("id", "temp");

    document.querySelectorAll("#provincesBottom > button").forEach(el => (el.style.display = "none"));
    document.querySelectorAll("#provincesBottom > div").forEach(el => (el.style.display = "block"));
    body.querySelector("div.provinces").classList.add("selected");

    provincesEditor.querySelectorAll(".hide").forEach(el => el.classList.add("hidden"));
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "none"));
    provincesFooter.style.display = "none";
    $("#provincesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    tip("Click on province to select, drag the circle to change province", true);
    viewbox
      .style("cursor", "crosshair")
      .on("click", selectProvinceOnMapClick)
      .call(d3.drag().on("start", dragProvinceBrush))
      .on("touchmove mousemove", moveProvinceBrush);
  }

  function selectProvinceOnLineClick(line) {
    const selected = body.querySelector("div.selected");
    if (selected) selected.classList.remove("selected");
    line.classList.add("selected");
  }

  function selectProvinceOnMapClick() {
    const point = d3.mouse(this);
    const i = findCell(point[0], point[1]);
    if (pack.cells.h[i] < 20) {
      tip("You cannot reassign water via provinces. Please edit the Heightmap to change water", false, "error");
      return;
    }

    const assigned = provinces.select("#temp").select("polygon[data-cell='" + i + "']");
    const province = assigned.size() ? +assigned.attr("data-province") : pack.cells.province[i];

    body.querySelector("div.selected").classList.remove("selected");
    body.querySelector("div[data-id='" + province + "']").classList.add("selected");
  }

  function dragProvinceBrush() {
    const r = +provincesBrush.value;

    d3.event.on("drag", () => {
      if (!d3.event.dx && !d3.event.dy) return;
      const p = d3.mouse(this);
      moveCircle(p[0], p[1], r);

      const found = r > 5 ? findAll(p[0], p[1], r) : [findCell(p[0], p[1])];
      const selection = found.filter(isLand);
      if (selection) changeProvinceForSelection(selection);
    });
  }

  // change region within selection
  function changeProvinceForSelection(selection) {
    const temp = provinces.select("#temp");
    const selected = body.querySelector("div.selected");

    const provinceNew = selected.dataset.id;
    const color = provincesData.color[provinceNew];

    selection.forEach(function (i) {
      const exists = temp.select("polygon[data-cell='" + i + "']");
      const provinceOld = exists.size() ? +exists.attr("data-province") : pack.cells.province[i];
      if (provinceNew === provinceOld) return;

      // change of append new element
      if (exists.size()) exists.attr("data-province", provinceNew).attr("fill", color).attr("stroke", color);
      else
        temp
          .append("polygon")
          .attr("data-cell", i)
          .attr("data-province", provinceNew)
          .attr("points", getPackPolygon(i))
          .attr("fill", color)
          .attr("stroke", color);
    });
  }

  function moveProvinceBrush() {
    showMainTip();
    const point = d3.mouse(this);
    const radius = +provincesBrush.value;
    moveCircle(point[0], point[1], radius);
  }

  function applyProvincesChange() {
    const changed = provinces.select("#temp").selectAll("polygon");
    changed.each(function () {
      const i = +this.dataset.cell;
      const p = +this.dataset.province;
      pack.cells.province[i] = p;
    });

    if (changed.size()) {
      drawProvinces();
      refreshProvincesEditor();
    }
    exitProvincesCustomizationMode();
  }

  function exitProvincesCustomizationMode(close) {
    customization = 0;
    provinces.select("#temp").remove();
    removeCircle();

    document.querySelectorAll("#provincesBottom > button").forEach(el => (el.style.display = "inline-block"));
    document.querySelectorAll("#provincesBottom > div").forEach(el => (el.style.display = "none"));

    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "all"));
    provincesEditor.querySelectorAll(".hide").forEach(el => el.classList.remove("hidden"));
    provincesFooter.style.display = "block";
    if (!close) $("#provincesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    restoreDefaultEvents();
    clearMainTip();
    const selected = document.querySelector("#provincesBody > div.selected");
    if (selected) selected.classList.remove("selected");
  }

  function restoreInitialProvinces() {
    provincesData = Provinces.getDefault();
    Provinces.define();
    drawProvinces();
    recalculatePopulation();
    refreshProvincesEditor();
  }

  function closeProvincesEditor() {
    exitProvincesCustomizationMode("close");
  }
}
