// documento.js
// Gestione documenti

const openAddDoc = document.getElementById("openAddDoc");
const overlayAddDoc = document.getElementById("overlay-add-doc");
const closeAddDoc = document.getElementById("closeAddDoc");
const addDocForm = document.getElementById("addDocForm");
const docList = document.getElementById("docList");

openAddDoc?.addEventListener("click", () => {
  overlayAddDoc.classList.remove("hidden");
});
closeAddDoc?.addEventListener("click", () => {
  overlayAddDoc.classList.add("hidden");
});

addDocForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(addDocForm);
  const doc = {
    title: formData.get("title"),
    file: formData.get("document").name,
  };
  let docs = JSON.parse(localStorage.getItem("docs") || "[]");
  docs.push(doc);
  localStorage.setItem("docs", JSON.stringify(docs));
  overlayAddDoc.classList.add("hidden");
  addDocForm.reset();
  renderDocs();
});

function renderDocs() {
  if (!docList) return;
  docList.innerHTML = "";
  const docs = JSON.parse(localStorage.getItem("docs") || "[]");
  docs.forEach((d) => {
    const li = document.createElement("li");
    li.textContent = `${d.title} - ${d.file}`;
    docList.appendChild(li);
  });
}

renderDocs();