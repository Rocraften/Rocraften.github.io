// scripts/app.js

let skins = [];

document.getElementById("fileInput").addEventListener("change", handleFileUpload);
document.getElementById("generatePack").addEventListener("click", generateSkinPack);

function handleFileUpload(event) {
  const files = event.target.files;
  skins = []; // Reset global skins array
  const preview = document.getElementById("preview");
  preview.innerHTML = ""; // Clear previous previews

  Array.from(files).forEach((file, index) => {
    if (file.type === "image/png") {
      const reader = new FileReader();
      reader.onload = function (e) {
        // Create a container div for this skin preview and input
        const container = document.createElement("div");
        container.classList.add("skin-item");

        // Create image element for preview
        const img = document.createElement("img");
        img.src = e.target.result;

        // Create input element for skin name
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Enter skin name";
        input.value = `Skin${index + 1}`; // Default name

        container.appendChild(img);
        container.appendChild(input);
        preview.appendChild(container);

        // Store the image data and reference to the input field
        skins.push({ data: e.target.result, nameInput: input });
      };
      reader.readAsDataURL(file);
    }
  });
}

function generateSkinPack() {
  const packNameInput = document.getElementById("packName");
  const packName = packNameInput.value.trim() || "SkinPack";

  if (skins.length === 0) {
    alert("Please upload at least one skin!");
    return;
  }

  const zip = new JSZip();
  const skinsArray = [];

  // Process each skin file
  skins.forEach((skinObj, index) => {
    const skinName = skinObj.nameInput.value.trim() || `Skin${index + 1}`;
    const fileName = `${skinName}.png`;

    // Remove the base64 header from the data URL
    const base64Data = skinObj.data.replace(/^data:image\/png;base64,/, "");
    // Add the image file to the zip at the root level
    zip.file(fileName, base64Data, { base64: true });

    // Build the skin entry for skins.json
    skinsArray.push({
      localization_name: skinName,
      geometry: `geometry.${packName}.${skinName}`,
      texture: fileName,
      type: "free",
    });
  });

  // Create manifest.json (note: using minimal formatting as in your sample)
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

  // Create skins.json
  const skinsJSON = {
    skins: skinsArray,
    serialize_name: packName,
    localization_name: packName,
  };

  // Create texts/en_US.lang content.
  // In your sample, it looks like:
  // skinpack.SkinName=SkinName
  // skin.SkinName.Skin=Skin
  // skin.SkinName.Skin=Skin
  // For each skin, we repeat the skin line twice.
  let langContent = `skinpack.${packName}=${packName}\n`;
  skinsArray.forEach((skin) => {
    langContent += `skin.${packName}.${skin.localization_name}=${skin.localization_name}\n`;
    langContent += `skin.${packName}.${skin.localization_name}=${skin.localization_name}\n`;
  });

  // Add files at the root of the zip
  zip.file("manifest.json", JSON.stringify(manifest));
  zip.file("skins.json", JSON.stringify(skinsJSON));

  // Create a texts folder and add en_US.lang inside it
  zip.folder("texts").file("en_US.lang", langContent);

  // Generate the final .mcpack file and force download
  zip.generateAsync({ type: "blob" }).then((content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${packName}.mcpack`;
    a.click();
  });
}

function generateUUID() {
  // Simple random UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
