// scripts/app.js

let skins = []; // Array to store each skin { data, nameInput }

document.getElementById("addSkinBtn").addEventListener("click", () => {
  document.getElementById("individualInput").click();
});

document
  .getElementById("individualInput")
  .addEventListener("change", handleIndividualUpload);

document
  .getElementById("generatePack")
  .addEventListener("click", generateSkinPack);

function handleIndividualUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== "image/png") {
    alert("Only PNG files are allowed.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    // Create container for this skin
    const skinsContainer = document.getElementById("skinsContainer");
    const container = document.createElement("div");
    container.classList.add("skin-item");

    // Create a canvas element for 3D preview
    const canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 200;
    container.appendChild(canvas);

    // Create an input for the skin name
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter skin name";
    input.value = `Skin${skins.length + 1}`;
    container.appendChild(input);

    // Append the container to the skins container
    skinsContainer.appendChild(container);

    // Initialize skinview3d viewer on the canvas with the skin data URL
    const viewer = new skinview3d.SkinViewer({
      canvas: canvas,
      width: canvas.width,
      height: canvas.height,
      skin: e.target.result,
      animation: new skinview3d.WalkingAnimation(),
    });

    // Store the skin data and reference to its name input
    skins.push({ data: e.target.result, nameInput: input });
  };
  reader.readAsDataURL(file);

  // Reset the input so that the same file can be chosen again if needed
  event.target.value = "";
}

function generateSkinPack() {
  const packNameInput = document.getElementById("packName");
  const packName = packNameInput.value.trim() || "SkinPack";

  if (skins.length === 0) {
    alert("Please add at least one skin!");
    return;
  }

  const zip = new JSZip();
  const skinsArray = [];

  // Process each skin: add image file at the root and create skins.json entry.
  skins.forEach((skinObj, index) => {
    const skinName = skinObj.nameInput.value.trim() || `Skin${index + 1}`;
    const fileName = `${skinName}.png`;
    const base64Data = skinObj.data.replace(/^data:image\/png;base64,/, "");
    zip.file(fileName, base64Data, { base64: true });

    skinsArray.push({
      localization_name: skinName,
      geometry: `geometry.${packName}.${skinName}`,
      texture: fileName,
      type: "free",
    });
  });

  // Build manifest.json
  const manifest = {
    format_version: 1,
    header: {
      name: packName,
      uuid: generateUUID(),
      version: [1, 0, 0],
    },
    modules: [
      {
        type: "skin_pack",
        uuid: generateUUID(),
        version: [1, 0, 0],
      },
    ],
  };

  // Build skins.json
  const skinsJSON = {
    skins: skinsArray,
    serialize_name: packName,
    localization_name: packName,
  };

  // Build texts/en_US.lang file.
  // Each skin produces exactly two lines:
  // skinpack.[skinName]=[skinName]
  // skin.[skinName].[skinName]=[skinName]
  let langContent = "";
  skinsArray.forEach((skin) => {
    langContent += `skinpack.${skin.localization_name}=${skin.localization_name}\n`;
    langContent += `skin.${skin.localization_name}.${skin.localization_name}=${skin.localization_name}\n`;
  });

  // Add manifest and skins.json to the root of the ZIP.
  zip.file("manifest.json", JSON.stringify(manifest));
  zip.file("skins.json", JSON.stringify(skinsJSON));

  // Create texts folder and add en_US.lang inside.
  zip.folder("texts").file("en_US.lang", langContent);

  // Generate the .mcpack and force download.
  zip.generateAsync({ type: "blob" }).then((content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${packName}.mcpack`;
    a.click();
  });
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
