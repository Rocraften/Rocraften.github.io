// scripts/app.js

let skins = [];

document.getElementById("fileInput").addEventListener("change", handleFileUpload);
document.getElementById("generatePack").addEventListener("click", generateSkinPack);

function handleFileUpload(event) {
  const files = event.target.files;
  skins = []; // reset array for new uploads
  const preview = document.getElementById("preview");
  preview.innerHTML = ""; // clear previous previews

  Array.from(files).forEach((file, index) => {
    if (file.type === "image/png") {
      const reader = new FileReader();
      reader.onload = function (e) {
        // Create a container for each skin preview and its name input
        const container = document.createElement("div");
        container.classList.add("skin-item");

        // Create an image element for preview
        const img = document.createElement("img");
        img.src = e.target.result;

        // Create an input for the skin name
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Enter skin name";
        input.value = `Skin${index + 1}`;

        container.appendChild(img);
        container.appendChild(input);
        preview.appendChild(container);

        // Save the data and reference to the input
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

  // Process and add each skin image at the root of the pack
  skins.forEach((skinObj, index) => {
    const skinName = skinObj.nameInput.value.trim() || `Skin${index + 1}`;
    const fileName = `${skinName}.png`;

    // Remove the base64 header from the image data
    const base64Data = skinObj.data.replace(/^data:image\/png;base64,/, "");
    // Add the skin image file directly to the root of the zip
    zip.file(fileName, base64Data, { base64: true });

    // Prepare the skin entry for skins.json
    skinsArray.push({
      localization_name: skinName,
      geometry: `geometry.${packName}.${skinName}`,
      texture: fileName,
      type: "free"
    });
  });

  // Build manifest.json (without extra description, matching your provided sample)
  const manifest = {
    format_version: 1,
    header: {
      name: packName,
      uuid: generateUUID(),
      version: [1, 0, 0]
    },
    modules: [
      {
        type: "skin_pack",
        uuid: generateUUID(),
        version: [1, 0, 0]
      }
    ]
  };

  // Build skins.json
  const skinsJSON = {
    skins: skinsArray,
    serialize_name: packName,
    localization_name: packName
  };

  // Build texts/en_US.lang content.
  // Format based on your sample:
  // skinpack.SkinName=SkinName
  // skin.SkinName.Skin=SkinName (repeated twice for each skin)
  let langContent = `skinpack.${packName}=${packName}\n`;
  skinsArray.forEach((skin) => {
    langContent += `skin.${packName}.${skin.localization_name}=${skin.localization_name}\n`;
    langContent += `skin.${packName}.${skin.localization_name}=${skin.localization_name}\n`;
  });

  // Add files at the zip root
  zip.file("manifest.json", JSON.stringify(manifest));
  zip.file("skins.json", JSON.stringify(skinsJSON));

  // Create the "texts" folder and add en_US.lang inside
  zip.folder("texts").file("en_US.lang", langContent);

  // Generate the .mcpack file and trigger a download
  zip.generateAsync({ type: "blob" }).then((content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${packName}.mcpack`;
    a.click();
  });
}

function generateUUID() {
  // Simple UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
