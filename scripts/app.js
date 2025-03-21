// scripts/app.js
document.getElementById("fileInput").addEventListener("change", handleFileUpload);
document.getElementById("generatePack").addEventListener("click", generateSkinPack);

let skins = [];

function handleFileUpload(event) {
  const files = event.target.files;
  const preview = document.getElementById("preview");
  preview.innerHTML = ""; // Clear previous previews

  Array.from(files).forEach((file, index) => {
    if (file.type === "image/png") {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Add to skin list
        skins.push({ name: `Skin${index + 1}`, data: e.target.result });
        
        // Add image preview
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
}

function generateSkinPack() {
  if (skins.length === 0) {
    alert("Please upload at least one skin!");
    return;
  }

  const zip = new JSZip();
  const pack = zip.folder("skins");

  skins.forEach((skin, index) => {
    const base64Data = skin.data.replace(/^data:image\/png;base64,/, "");
    pack.file(`${skin.name}.png`, base64Data, { base64: true });
  });

  // Add manifest.json
  const manifest = {
    "format_version": 1,
    "header": {
      "description": "Custom Minecraft Skin Pack",
      "name": "Skin Pack",
      "uuid": generateUUID(),
      "version": [1, 0, 0]
    },
    "modules": [
      {
        "type": "skin_pack",
        "uuid": generateUUID(),
        "version": [1, 0, 0]
      }
    ]
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate .mcpack file
  zip.generateAsync({ type: "blob" }).then((content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "SkinPack.mcpack";
    a.click();
  });
}

function generateUUID() {
  // Generate a random UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

