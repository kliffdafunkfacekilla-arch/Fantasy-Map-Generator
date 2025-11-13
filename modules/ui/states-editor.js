"use strict";
function editStates() {
  if (customization) return;
  closeDialogs("#statesEditor, .stable");
  if (!layerIsOn("toggleStates")) toggleStates();
  if (!layerIsOn("toggleBiomes")) toggleBiomes();
  if (layerIsOn("toggleCultures")) toggleCultures();
  if (layerIsOn("toggleReligions")) toggleReligions();
  if (layerIsOn("toggleProvinces")) toggleProvinces();

  const body = document.getElementById("statesBody");
  const animate = d3.transition().duration(2000).ease(d3.easeSinIn);
  refreshStatesEditor();

  if (modules.editStates) return;
  modules.editStates = true;

  $("#statesEditor").dialog({
    title: "States Editor",
    resizable: false,
    width: fitContent(),
    close: closeStatesEditor,
    position: {my: "right top", at: "right-10 top+10", of: "svg"}
  });

  // add listeners
  document.getElementById("statesEditorRefresh").addEventListener("click", refreshStatesEditor);
  document.getElementById("statesEditStyle").addEventListener("click", () => editStyle("states"));
  document.getElementById("statesLegend").addEventListener("click", toggleLegend);
  document.getElementById("statesPercentage").addEventListener("click", togglePercentageMode);
  document.getElementById("statesManually").addEventListener("click", enterStatesCustomizationMode);
  document.getElementById("statesManuallyApply").addEventListener("click", applyStatesChange);
  document.getElementById("statesManuallyCancel").addEventListener("click", () => exitStatesCustomizationMode());
  document.getElementById("statesRestore").addEventListener("click", restoreInitialStates);
  document.getElementById("statesAdd").addEventListener("click", addCustomState);
  document.getElementById("statesExport").addEventListener("click", downloadStatesData);

  body.addEventListener("click", function (ev) {
    const el = ev.target;
    const cl = el.classList;
    if (el.tagName === "FILL-BOX") stateChangeColor(el);
    else if (cl.contains("icon-info-circled")) openWiki(el);
    else if (cl.contains("icon-trash-empty")) removeCustomState(el);
    if (customization === 8) selectStateOnLineClick(el);
  });

  body.addEventListener("change", function (ev) {
    const el = ev.target,
      cl = el.classList;
    if (cl.contains("stateName")) stateChangeName(el);
  });

  function refreshStatesEditor() {
    statesCollectStatistics();
    statesEditorAddLines();
  }

  function statesCollectStatistics() {
    const cells = pack.cells;
    const array = new Uint8Array(statesData.i.length);
    statesData.cells = Array.from(array);
    statesData.area = Array.from(array);
    statesData.rural = Array.from(array);
    statesData.urban = Array.from(array);

    for (const i of cells.i) {
      if (cells.h[i] < 20) continue;
      const s = cells.state[i];
      statesData.cells[s] += 1;
      statesData.area[s] += cells.area[i];
      statesData.rural[s] += cells.pop[i];
      if (cells.burg[i]) statesData.urban[s] += pack.burgs[cells.burg[i]].population;
    }
  }

  function statesEditorAddLines() {
    const unit = " " + getAreaUnit();
    const s = statesData;
    let lines = "",
      totalArea = 0,
      totalPopulation = 0;

    for (const i of s.i) {
      if (!i || statesData.name[i] === "removed") continue; // ignore water and removed states
      const area = getArea(s.area[i]);
      const rural = s.rural[i] * populationRate;
      const urban = s.urban[i] * populationRate * urbanization;
      const population = rn(rural + urban);
      const populationTip = `Total population: ${si(population)}; Rural population: ${si(
        rural
      )}; Urban population: ${si(urban)}`;
      totalArea += area;
      totalPopulation += population;

      lines += /* html */ `
        <div
          class="states"
          data-id="${i}"
          data-name="${s.name[i]}"
          data-cells=${s.cells[i]}
          data-area=${area}
          data-population=${population}
          data-color=${s.color[i]}
        >
          <fill-box fill="${s.color[i]}"></fill-box>
          <input data-tip="State name. Click and type to change" class="stateName" value="${
            s.name[i]
          }" autocorrect="off" spellcheck="false" />
          <span data-tip="Cells count" class="icon-check-empty hide"></span>
          <div data-tip="Cells count" class="stateCells hide">${s.cells[i]}</div>
          <span data-tip="State area" style="padding-right: 4px" class="icon-map-o hide"></span>
          <div data-tip="State area" class="stateArea hide">${si(area) + unit}</div>
          <span data-tip="${populationTip}" class="icon-male hide"></span>
          <div data-tip="${populationTip}" class="statePopulation hide">${si(population)}</div>
          <span data-tip="Open Wikipedia article about the state" class="icon-info-circled pointer hide"></span>
          ${
            i > 12 && !s.cells[i]
              ? '<span data-tip="Remove the custom state" class="icon-trash-empty hide"></span>'
              : ""
          }
        </div>
      `;
    }
    body.innerHTML = lines;

    // update footer
    statesFooterStates.innerHTML = body.querySelectorAll(":scope > div").length;
    statesFooterCells.innerHTML = pack.cells.h.filter(h => h >= 20).length;
    statesFooterArea.innerHTML = si(totalArea) + unit;
    statesFooterPopulation.innerHTML = si(totalPopulation);
    statesFooterArea.dataset.area = totalArea;
    statesFooterPopulation.dataset.population = totalPopulation;

    // add listeners
    body.querySelectorAll("div.states").forEach(el => el.addEventListener("mouseenter", ev => stateHighlightOn(ev)));
    body.querySelectorAll("div.states").forEach(el => el.addEventListener("mouseleave", ev => stateHighlightOff(ev)));

    if (body.dataset.type === "percentage") {
      body.dataset.type = "absolute";
      togglePercentageMode();
    }
    applySorting(statesHeader);
    $("#statesEditor").dialog({width: fitContent()});
  }

  function stateHighlightOn(event) {
    if (customization === 8) return;
    const state = +event.target.dataset.id;
    states
      .select("#state" + state)
      .raise()
      .transition(animate)
      .attr("stroke-width", 2)
      .attr("stroke", "#cd4c11");
  }

  function stateHighlightOff(event) {
    if (customization === 8) return;
    const state = +event.target.dataset.id;
    const color = statesData.color[state];
    states
      .select("#state" + state)
      .transition()
      .attr("stroke-width", 0.7)
      .attr("stroke", color);
  }

  function stateChangeColor(el) {
    const currentFill = el.getAttribute("fill");
    const state = +el.parentNode.dataset.id;

    const callback = newFill => {
      el.fill = newFill;
      statesData.color[state] = newFill;
      states
        .select("#state" + state)
        .attr("fill", newFill)
        .attr("stroke", newFill);
    };

    openPicker(currentFill, callback);
  }

  function stateChangeName(el) {
    const state = +el.parentNode.dataset.id;
    el.parentNode.dataset.name = el.value;
    statesData.name[state] = el.value;
  }

  function openWiki(el) {
    const stateName = el.parentNode.dataset.name;
    if (stateName === "Custom" || !stateName) return tip("Please fill in the state name", false, "error");
    const customStateLink = `https://en.wikipedia.org/w/index.php?search=${stateName}`;
    openURL(customStateLink);
  }

  function toggleLegend() {
    if (legend.selectAll("*").size()) {
      clearLegend();
      return;
    } // hide legend
    const d = statesData;
    const data = Array.from(d.i)
      .filter(i => d.cells[i])
      .sort((a, b) => d.area[b] - d.area[a])
      .map(i => [i, d.color[i], d.name[i]]);
    drawLegend("States", data);
  }

  function togglePercentageMode() {
    if (body.dataset.type === "absolute") {
      body.dataset.type = "percentage";
      const totalCells = +statesFooterCells.innerHTML;
      const totalArea = +statesFooterArea.dataset.area;
      const totalPopulation = +statesFooterPopulation.dataset.population;

      body.querySelectorAll(":scope>  div").forEach(function (el) {
        el.querySelector(".stateCells").innerHTML = rn((+el.dataset.cells / totalCells) * 100) + "%";
        el.querySelector(".stateArea").innerHTML = rn((+el.dataset.area / totalArea) * 100) + "%";
        el.querySelector(".statePopulation").innerHTML = rn((+el.dataset.population / totalPopulation) * 100) + "%";
      });
    } else {
      body.dataset.type = "absolute";
      statesEditorAddLines();
    }
  }

  function addCustomState() {
    const s = statesData,
      i = statesData.i.length;
    if (i > 254) {
      tip("Maximum number of states reached (255), data cleansing is required", false, "error");
      return;
    }

    s.i.push(i);
    s.color.push(getRandomColor());
    s.name.push("Custom");
    s.cost.push(50);

    s.rural.push(0);
    s.urban.push(0);
    s.cells.push(0);
    s.area.push(0);

    const unit = getAreaUnit();
    const line = `<div class="states" data-id="${i}" data-name="${s.name[i]}" data-cells=0 data-area=0 data-population=0 data-color=${s.color[i]}>
      <fill-box fill="${s.color[i]}"></fill-box>
      <input data-tip="State name. Click and type to change" class="stateName" value="${s.name[i]}" autocorrect="off" spellcheck="false">
      <span data-tip="Cells count" class="icon-check-empty hide"></span>
      <div data-tip="Cells count" class="stateCells hide">${s.cells[i]}</div>
      <span data-tip="State area" style="padding-right: 4px" class="icon-map-o hide"></span>
      <div data-tip="State area" class="stateArea hide">0 ${unit}</div>
      <span data-tip="Total population: 0" class="icon-male hide"></span>
      <div data-tip="Total population: 0" class="statePopulation hide">0</div>
      <span data-tip="Remove the custom state" class="icon-trash-empty hide"></span>
    </div>`;

    body.insertAdjacentHTML("beforeend", line);
    statesFooterStates.innerHTML = body.querySelectorAll(":scope > div").length;
    $("#statesEditor").dialog({width: fitContent()});
  }

  function removeCustomState(el) {
    const state = +el.parentNode.dataset.id;
    el.parentNode.remove();
    statesData.name[state] = "removed";
    statesFooterStates.innerHTML = +statesFooterStates.innerHTML - 1;
  }

  function downloadStatesData() {
    const unit = areaUnit.value === "square" ? distanceUnitInput.value + "2" : areaUnit.value;
    let data = "Id,State,Color,Cells,Area " + unit + ",Population\n"; // headers

    body.querySelectorAll(":scope > div").forEach(function (el) {
      data += el.dataset.id + ",";
      data += el.dataset.name + ",";
      data += el.dataset.color + ",";
      data += el.dataset.cells + ",";
      data += el.dataset.area + ",";
      data += el.dataset.population + "\n";
    });

    const name = getFileName("States") + ".csv";
    downloadFile(data, name);
  }

  function enterStatesCustomizationMode() {
    if (!layerIsOn("toggleStates")) toggleStates();
    customization = 8;
    states.append("g").attr("id", "temp");

    document.querySelectorAll("#statesBottom > button").forEach(el => (el.style.display = "none"));
    document.querySelectorAll("#statesBottom > div").forEach(el => (el.style.display = "block"));
    body.querySelector("div.states").classList.add("selected");

    statesEditor.querySelectorAll(".hide").forEach(el => el.classList.add("hidden"));
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "none"));
    statesFooter.style.display = "none";
    $("#statesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    tip("Click on state to select, drag the circle to change state", true);
    viewbox
      .style("cursor", "crosshair")
      .on("click", selectStateOnMapClick)
      .call(d3.drag().on("start", dragStateBrush))
      .on("touchmove mousemove", moveStateBrush);
  }

  function selectStateOnLineClick(line) {
    const selected = body.querySelector("div.selected");
    if (selected) selected.classList.remove("selected");
    line.classList.add("selected");
  }

  function selectStateOnMapClick() {
    const point = d3.mouse(this);
    const i = findCell(point[0], point[1]);
    if (pack.cells.h[i] < 20) {
      tip("You cannot reassign water via states. Please edit the Heightmap to change water", false, "error");
      return;
    }

    const assigned = states.select("#temp").select("polygon[data-cell='" + i + "']");
    const state = assigned.size() ? +assigned.attr("data-state") : pack.cells.state[i];

    body.querySelector("div.selected").classList.remove("selected");
    body.querySelector("div[data-id='" + state + "']").classList.add("selected");
  }

  function dragStateBrush() {
    const r = +statesBrush.value;

    d3.event.on("drag", () => {
      if (!d3.event.dx && !d3.event.dy) return;
      const p = d3.mouse(this);
      moveCircle(p[0], p[1], r);

      const found = r > 5 ? findAll(p[0], p[1], r) : [findCell(p[0], p[1])];
      const selection = found.filter(isLand);
      if (selection) changeStateForSelection(selection);
    });
  }

  // change region within selection
  function changeStateForSelection(selection) {
    const temp = states.select("#temp");
    const selected = body.querySelector("div.selected");

    const stateNew = selected.dataset.id;
    const color = statesData.color[stateNew];

    selection.forEach(function (i) {
      const exists = temp.select("polygon[data-cell='" + i + "']");
      const stateOld = exists.size() ? +exists.attr("data-state") : pack.cells.state[i];
      if (stateNew === stateOld) return;

      // change of append new element
      if (exists.size()) exists.attr("data-state", stateNew).attr("fill", color).attr("stroke", color);
      else
        temp
          .append("polygon")
          .attr("data-cell", i)
          .attr("data-state", stateNew)
          .attr("points", getPackPolygon(i))
          .attr("fill", color)
          .attr("stroke", color);
    });
  }

  function moveStateBrush() {
    showMainTip();
    const point = d3.mouse(this);
    const radius = +statesBrush.value;
    moveCircle(point[0], point[1], radius);
  }

  function applyStatesChange() {
    const changed = states.select("#temp").selectAll("polygon");
    changed.each(function () {
      const i = +this.dataset.cell;
      const s = +this.dataset.state;
      pack.cells.state[i] = s;
    });

    if (changed.size()) {
      drawStates();
      refreshStatesEditor();
    }
    exitStatesCustomizationMode();
  }

  function exitStatesCustomizationMode(close) {
    customization = 0;
    states.select("#temp").remove();
    removeCircle();

    document.querySelectorAll("#statesBottom > button").forEach(el => (el.style.display = "inline-block"));
    document.querySelectorAll("#statesBottom > div").forEach(el => (el.style.display = "none"));

    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "all"));
    statesEditor.querySelectorAll(".hide").forEach(el => el.classList.remove("hidden"));
    statesFooter.style.display = "block";
    if (!close) $("#statesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    restoreDefaultEvents();
    clearMainTip();
    const selected = document.querySelector("#statesBody > div.selected");
    if (selected) selected.classList.remove("selected");
  }

  function restoreInitialStates() {
    statesData = States.getDefault();
    States.define();
    drawStates();
    recalculatePopulation();
    refreshStatesEditor();
  }

  function closeStatesEditor() {
    exitStatesCustomizationMode("close");
  }
}
