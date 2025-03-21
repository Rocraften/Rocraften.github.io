// js/upload.js
import { auth, firestore, storage } from "./firebase-config.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";

// Ensure the user is signed in
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const category = document.getElementById("category").value;
  const tagsInput = document.getElementById("tags").value;
  const tags = tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
  const file = document.getElementById("asset-file").files[0];
  
  if (!file) {
    uploadMessage.innerText = "Please select a file.";
    return;
  }
  
  try {
    // Upload file to Firebase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `assets/${fileName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(snapshot.ref);
    
    // Save asset metadata in Firestore (default approved: false)
    await addDoc(collection(firestore, "assets"), {
      title,
      description,
      category,
      tags,
      fileUrl,
      uploader: auth.currentUser.uid,
      approved: false,
      timestamp: serverTimestamp()
    });
    
    uploadMessage.innerText = "Asset uploaded successfully! It is pending approval.";
    uploadForm.reset();
  } catch (error) {
    uploadMessage.innerText = "Error uploading asset: " + error.message;
  }
});
