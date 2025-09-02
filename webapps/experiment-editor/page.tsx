"use client";

import { useState } from "react";
import { parse, writeUncompressed } from "./nbt";
import { unzipSync, zipSync } from "fflate";

const EXPERIMENTS = [
  {
    id: "villager_trades_rebalance",
    name: "Villager Trade Rebalancing",
    since: "1.20.30",
    description: "Contains updated trades for villages for the purpose of rebalancing",
  },
  {
    id: "y_2025_drop_3",
    name: "Drop 3 2025",
    since: "1.21.100",
    description: "Adds copper golems, along with copper tools, armor, chests, and nuggets.",
  },
  {
    id: "data_driven_biomes",
    name: "Custom Biomes",
    since: "1.16.100",
    description: "Create custom biomes and change world generation",
  },
  {
    id: "upcoming_creator_features",
    name: "Upcoming Creator Features",
    since: "1.17.0",
    description: "Includes adjustable fog parameters",
  },
  {
    id: "gametest",
    name: "Beta APIs",
    since: "1.16.210",
    description: 'Use "-beta" versions of API modules in Add-On packs',
  },
  {
    id: "experimental_creator_cameras",
    name: "Experimental Creator Camera Features",
    since: "1.21.70",
    description: "Enables the use of the latest custom camera features",
  },
  {
    id: "jigsaw_structures",
    name: "Data-Driven Jigsaw Structures",
    since: "1.21.50",
    description: "Loads Jigsaw Structures from the behavior pack worldgen folder",
  },
];

function versionToNumber(version: string): number {
  return parseFloat(version.split(".").slice(0, 2).join("."));
}

export default function Page() {
  const [status, setStatus] = useState("");
  const [worldVersion, setWorldVersion] = useState<string | null>(null);
  const [availableExperiments, setAvailableExperiments] = useState<typeof EXPERIMENTS>([]);

  async function handleFile(file: File) {
    setStatus("📕 Reading world...");
    const buffer = await file.arrayBuffer();
    const zip = unzipSync(new Uint8Array(buffer));
    const levelDat = zip["level.dat"];
    if (!levelDat) {
      setStatus("😱 level.dat not found.");
      return;
    }

    const parsed = parse(levelDat.buffer);
    const root = parsed.value;

    const versionArray = root?.Version?.LevelVersion?.value;
    const versionString = versionArray ? `${versionArray[0]}.${versionArray[1]}.${versionArray[2]}` : "0.0.0";
    setWorldVersion(versionString);

    const numericVersion = versionToNumber(versionString);
    const filtered = EXPERIMENTS.filter(exp => versionToNumber(exp.since) <= numericVersion);
    setAvailableExperiments(filtered);

    setStatus(`🪛 World version ${versionString} detected. Select experiments below.`);
  }

  async function edit(file: File) {
    setStatus("Editing...");
    const buffer = await file.arrayBuffer();
    const zip = unzipSync(new Uint8Array(buffer));
    const levelDat = zip["level.dat"];
    if (!levelDat) {
      setStatus("😱 level.dat not found.");
      return;
    }

    const parsed = parse(levelDat.buffer);
    const root = parsed.value;

    const toggles = availableExperiments
      .filter(exp => (document.getElementById(exp.id) as HTMLInputElement)?.checked)
      .map(exp => ({ name: exp.id, enabled: true }));

    if (!root.Experiments) root.Experiments = {};
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
  }

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.6)",
        width: "420px",
        textAlign: "center",
        color: "#ecf0f1",
      }}
    >
      <h1 style={{ color: "#00cec9", fontSize: "1.8rem", marginBottom: "1rem" }}>
        MCEDU Experiments Web Editor
      </h1>
      <input
        type="file"
        id="file"
        accept=".mcworld"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        style={{
          width: "100%",
          padding: "0.6rem",
          borderRadius: "6px",
          border: "none",
          background: "#dfe6e9",
          color: "#2d3436",
          fontWeight: "bold",
        }}
      />
      {availableExperiments.length > 0 && (
        <div style={{ marginTop: "1rem", textAlign: "left" }}>
          {availableExperiments.map(exp => (
            <label key={exp.id} style={{ display: "block", margin: "0.5rem 0" }}>
              <input type="checkbox" id={exp.id} /> <strong>{exp.name}</strong>
              <br />
              <span style={{ fontSize: "0.8rem", color: "#b2bec3" }}>{exp.description}</span>
            </label>
          ))}
        </div>
      )}
      {availableExperiments.length > 0 && (
        <button
          onClick={() => {
            const fileInput = document.getElementById("file") as HTMLInputElement;
            const file = fileInput.files?.[0];
            if (file) edit(file);
          }}
          style={{
            marginTop: "1rem",
            padding: "0.7rem",
            width: "100%",
            border: "none",
            borderRadius: "6px",
            background: "#0984e3",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.3s ease",
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.background = "#74b9ff";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.background = "#0984e3";
          }}
        >
          Edit & Download
        </button>
      )}
      <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>{status}</div>
    </div>
  );
}
