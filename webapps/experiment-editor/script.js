import { unzipSync, zipSync } from "https://cdn.skypack.dev/fflate";
import { parse, writeUncompressed } from "./nbt.js";

const experiments = [
  { id: "villager_trades_rebalance", name: "Villager Trade Rebalancing", since: "1.20.30", description: "Contains updated trades for villages for the purpose of rebalancing" },
  { id: "y_2025_drop_3", name: "Drop 3 2025", since: "1.21.100", description: "Adds copper golems, along with copper tools, armor, chests, and nuggets." },
  { id: "data_driven_biomes", name: "Custom Biomes", since: "1.16.100", description: "Create custom biomes and change world generation" },
  { id: "upcoming_creator_features", name: "Upcoming Creator Features", since: "1.17.0", description: "Includes adjustable fog parameters" },
  { id: "gametest", name: "Beta APIs", since: "1.16.210", description: 'Use "-beta" versions of API modules in Add-On packs' },
  { id: "experimental_creator_cameras", name: "Experimental Creator Camera Features", since: "1.21.70", description: "Enables the use of the latest custom camera features" },
  { id: "jigsaw_structures", name: "Data-Driven Jigsaw Structures", since: "1.21.50", description: "Loads Jigsaw Structures from the behavior pack worldgen folder" },
];

function versionToNumber(v) {
  const [major, minor, patch] = v.split(".").map(Number);
  return major * 10000 + minor * 100 + patch;
}

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setStatus("📕 Reading world...");
  const buffer = await file.arrayBuffer();
  const zip = unzipSync(new Uint8Array(buffer));
  const levelDat = zip["level.dat"];
  if (!levelDat) return setStatus("😱 level.dat not found.");

  const parsed = parse(levelDat.buffer);
  const root = parsed.value;
  const versionArr = root?.Version?.LevelVersion?.value;
  const versionStr = versionArr ? `${versionArr[0]}.${versionArr[1]}.${versionArr[2]}` : "0.0.0";
  const numericVersion = versionToNumber(versionStr);

  const filtered = experiments.filter(exp => versionToNumber(exp.since) <= numericVersion);
  renderExperiments(filtered);

  setStatus(`🌍 World version ${versionStr} detected. Select experiments below.`);
  document.getElementById("editButton").classList.remove("hidden");
});

function renderExperiments(list) {
  const container = document.getElementById("experimentContainer");
  container.innerHTML = "";
  list.forEach(exp => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" id="${exp.id}" />
      <strong>${exp.name}</strong><br />
      <span>${exp.description}</span>
    `;
    container.appendChild(label);
  });
  container.classList.remove("hidden");
}

document.getElementById("editButton").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  setStatus("⌚ Editing...");
  const buffer = await file.arrayBuffer();
  const zip = unzipSync(new Uint8Array(buffer));
  const levelDat = zip["level.dat"];
  if (!levelDat) return setStatus("😱 level.dat not found.");

  const parsed = parse(levelDat.buffer);
  const root = parsed.value;

  const toggles = experiments
    .filter(exp => document.getElementById(exp.id)?.checked)
    .map(exp => ({ name: exp.id, enabled: true }));

  root.Experiments = root.Experiments || {};
  root.Experiments.Experiments = toggles;

  const newLevelDat = writeUncompressed({ type: "compound", name: "", value: root });
  zip["level.dat"] = new Uint8Array(newLevelDat);
  const newZip = zipSync(zip);

  const blob = new Blob([newZip], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "edited.mcworld";
  link.click();

  setStatus("🚀 Edited and downloaded!");
});

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}
