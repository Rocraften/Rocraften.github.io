// scripts/app.js

let skins = []; // Array to store each skin: { data, nameInput }

// Trigger the hidden file input when "Add Skin" is clicked.
document.getElementById("addSkinBtn").addEventListener("click", () => {
  console.log("Add Skin button clicked.");
  document.getElementById("individualInput").click();
});

// When a file is selected, handle the upload.
document.getElementById("individualInput").addEventListener("change", handleIndividualUpload);

// Generate the skin pack when button is clicked.
document.getElementById("generatePack").addEventListener("click", generateSkinPack);

function handleIndividualUpload(event) {
  console.log("File input changed.");
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected.");
    return;
  }
  if (file.type !== "image/png") {
    alert("Only PNG files are allowed.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    console.log("File read complete.");
    const dataUrl = e.target.result;

    // Create a container for the skin item.
    const container = document.createElement("div");
    container.className = "skin-item";

    // Create a canvas element for the 3D preview.
    const canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 200;
    container.appendChild(canvas);

    // Create an input element for editing the skin name.
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter skin name";
    input.value = "Skin" + (skins.length + 1);
    container.appendChild(input);

    // Append the container to the skins container.
    document.getElementById("skinsContainer").appendChild(container);

    // Initialize skinview3d for a 3D preview on the canvas.
    try {
      const viewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: canvas.width,
        height: canvas.height,
        skin: dataUrl
      });
      // Try to add a walking animation if available.
      try {
        if (typeof skinview3d.WalkingAnimation === "function") {
          viewer.animations.add(new skinview3d.WalkingAnimation());
        } else {
          console.warn("WalkingAnimation is not available, skipping animation.");
        }
      } catch (animError) {
        console.error("Error adding walking animation:", animError);
      }
      console.log("Skinview3d initialized successfully.");
    } catch (err) {
      console.error("Error initializing skin viewer:", err);
      // Fallback: If skinview3d fails, display a flat image instead.
      const fallbackImg = document.createElement("img");
      fallbackImg.src = dataUrl;
      fallbackImg.style.width = "150px";
      fallbackImg.style.height = "200px";
      container.insertBefore(fallbackImg, canvas);
      container.removeChild(canvas);
    }

    // Save the skin data and the corresponding name input.
    skins.push({ data: dataUrl, nameInput: input });
    console.log("Skin added. Total skins: " + skins.length);
  };

  reader.onerror = function (err) {
    console.error("Error reading file:", err);
  };

  reader.readAsDataURL(file);
  // Reset the file input so that the same file can be chosen again if needed.
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

  // Loop over each skin and add its image to the ZIP at the root.
  skins.forEach((skinObj, index) => {
    const skinName = skinObj.nameInput.value.trim() || "Skin" + (index + 1);
    const fileName = skinName + ".png";
    const base64Data = skinObj.data.replace(/^data:image\/png;base64,/, "");
    zip.file(fileName, base64Data, { base64: true });
    
    skinsArray.push({
      localization_name: skinName,
      geometry: `geometry.${packName}.${skinName}`,
      texture: fileName,
      type: "free"
    });
  });

  // Build manifest.json (minified).
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

  // Build skins.json.
  const skinsJSON = {
    skins: skinsArray,
    serialize_name: packName,
    localization_name: packName
  };

  // Build texts/en_US.lang file.
  // For each skin, output exactly two lines:
  // skinpack.[skin_name]=[skin_name]
  // skin.[skin_name].[skin_name]=[skin_name]
  let langContent = "";
  skinsArray.forEach((skin) => {
    langContent += `skinpack.${skin.localization_name}=${skin.localization_name}\n`;
    langContent += `skin.${skin.localization_name}.${skin.localization_name}=${skin.localization_name}\n`;
  });

  zip.file("manifest.json", JSON.stringify(manifest));
  zip.file("skins.json", JSON.stringify(skinsJSON));
  zip.folder("texts").file("en_US.lang", langContent);

  // Generate the final .mcpack file (a ZIP blob) and trigger the download.
  zip.generateAsync({ type: "blob" }).then((content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = packName + ".mcpack";
    a.click();
  });
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
