document.addEventListener("DOMContentLoaded", () => {
    const worldNameInput = document.getElementById("worldName");
    const statesList = document.getElementById("statesList");
    const addStateButton = document.getElementById("addState");
    const biomesList = document.getElementById("biomesList");
    const addBiomeButton = document.getElementById("addBiome");
    const cityCountInput = document.getElementById("cityCount");
    const religionsList = document.getElementById("religionsList");
    const addReligionButton = document.getElementById("addReligion");
    const cityNamesTextarea = document.getElementById("cityNames");
    const cityNamesFileInput = document.getElementById("cityNamesFile");
    const emblemsList = document.getElementById("emblemsList");
    const conflictStatusSelect = document.getElementById("conflictStatus");
    const heightmapUploadInput = document.getElementById("heightmapUpload");
    const generateMapButton = document.getElementById("generateMap");

    addStateButton.addEventListener("click", () => {
        const stateId = `state-${statesList.children.length}`;
        const stateItem = document.createElement("div");
        stateItem.classList.add("list-item");
        stateItem.innerHTML = `
            <input type="text" placeholder="State Name" id="${stateId}-name">
            <input type="number" placeholder="Provinces" id="${stateId}-provinces">
            <button class="remove-item">Remove</button>
        `;
        statesList.appendChild(stateItem);
        updateEmblemsList();
    });

    addBiomeButton.addEventListener("click", () => {
        const biomeId = `biome-${biomesList.children.length}`;
        const biomeItem = document.createElement("div");
        biomeItem.classList.add("list-item");
        biomeItem.innerHTML = `
            <input type="text" placeholder="Biome Name" id="${biomeId}-name">
            <input type="range" min="1" max="100" value="50" id="${biomeId}-frequency">
            <button class="remove-item">Remove</button>
        `;
        biomesList.appendChild(biomeItem);
    });

    addReligionButton.addEventListener("click", () => {
        const religionId = `religion-${religionsList.children.length}`;
        const religionItem = document.createElement("div");
        religionItem.classList.add("list-item");
        religionItem.innerHTML = `
            <input type="text" placeholder="Religion Name" id="${religionId}-name">
            <input type="number" placeholder="%" min="0" max="100" id="${religionId}-distribution">
            <button class="remove-item">Remove</button>
        `;
        religionsList.appendChild(religionItem);
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-item")) {
            e.target.parentElement.remove();
            updateEmblemsList();
        }
    });

    function updateEmblemsList() {
        emblemsList.innerHTML = "";
        const states = Array.from(statesList.children).map((item, index) => {
            return document.getElementById(`state-${index}-name`).value || `State ${index + 1}`;
        });

        states.forEach((stateName, index) => {
            const emblemId = `emblem-${index}`;
            const emblemItem = document.createElement("div");
            emblemItem.classList.add("list-item");
            emblemItem.innerHTML = `
                <label>${stateName}:</label>
                <input type="file" id="${emblemId}" accept="image/png, image/jpeg, image/svg+xml">
            `;
            emblemsList.appendChild(emblemItem);
        });
    }

    generateMapButton.addEventListener("click", () => {
        const worldData = {
            worldName: worldNameInput.value,
            states: Array.from(statesList.children).map((item, index) => ({
                name: document.getElementById(`state-${index}-name`).value,
                provinces: document.getElementById(`state-${index}-provinces`).value,
            })),
            biomes: Array.from(biomesList.children).map((item, index) => ({
                name: document.getElementById(`biome-${index}-name`).value,
                frequency: document.getElementById(`biome-${index}-frequency`).value,
            })),
            cityCount: cityCountInput.value,
            religions: Array.from(religionsList.children).map((item, index) => ({
                name: document.getElementById(`religion-${index}-name`).value,
                distribution: document.getElementById(`religion-${index}-distribution`).value,
            })),
            cityNames: cityNamesTextarea.value.split("\n").filter(name => name.trim() !== ""),
            conflictStatus: conflictStatusSelect.value,
            heightmapImage: heightmapUploadInput.files[0],
            emblems: Array.from(emblemsList.children).map((item, index) => {
                const fileInput = document.getElementById(`emblem-${index}`);
                return fileInput.files[0];
            }),
        };

        if (cityNamesFileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const namesFromFile = e.target.result.split("\n").filter(name => name.trim() !== "");
                worldData.cityNames = [...worldData.cityNames, ...namesFromFile];
                window.startGenerationFromCreation(worldData);
            };
            reader.readAsText(cityNamesFileInput.files[0]);
        } else {
            window.startGenerationFromCreation(worldData);
        }
    });
});
