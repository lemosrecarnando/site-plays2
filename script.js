const ADMIN_PASSWORD = "@lemos13";
let editingId = null;

async function fetchSpotifyCover(link){
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`;
    const res = await fetch(oembedUrl);
    if(!res.ok) throw new Error("oEmbed não disponível");
    const data = await res.json();
    return data.thumbnail_url || "https://via.placeholder.com/400x400?text=Sem+Capa";
  } catch(e){
    console.warn("Não foi possível pegar capa automaticamente:", e);
    return "https://via.placeholder.com/400x400?text=Sem+Capa";
  }
}

async function loadPlaylists() {
  try {
    const snapshot = await db.collection("playlists").get();
    const playlists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderPlaylists(playlists);
  } catch(err) {
    alert("Erro ao carregar playlists: " + err.message);
    console.error(err);
  }
}

function renderPlaylists(playlists){
  const grid = document.getElementById("playlistGrid");
  grid.innerHTML = "";
  playlists.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = p.cover_url;
    img.alt = p.name;
    card.appendChild(img);

    const title = document.createElement("strong");
    title.textContent = p.name;
    card.appendChild(title);

    const btnContainer = document.createElement("div");
    btnContainer.className = "btnContainer";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      document.getElementById("hiddenForm").classList.add("show");
      document.getElementById("name").value = p.name;
      document.getElementById("cover").value = p.cover_url;
      document.getElementById("link").value = p.link_url;
      editingId = p.id;
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Apagar";
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();
      if(confirm(`Deseja apagar a playlist "${p.name}"?`)){
        try {
          await db.collection("playlists").doc(p.id).delete();
          loadPlaylists();
        } catch(err) {
          alert("Erro ao apagar: " + err.message);
        }
      }
    };

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);
    card.appendChild(btnContainer);

    card.onclick = () => window.open(p.link_url, "_blank");
    grid.appendChild(card);
  });
}

document.getElementById("toggleForm").addEventListener("click", () => {
  document.getElementById("hiddenForm").classList.toggle("show");
  editingId = null;
});

document.getElementById("addForm").addEventListener("submit", async function(e){
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const link = document.getElementById("link").value.trim();
  const coverInput = document.getElementById("cover").value.trim();
  const password = document.getElementById("password").value;

  if(password !== ADMIN_PASSWORD){
    alert("❌ Senha incorreta!");
    return;
  }
  if(!link){
    alert("Coloque o link da playlist.");
    return;
  }

  const cover_url = coverInput || await fetchSpotifyCover(link);

  try {
    if(editingId){
      await db.collection("playlists").doc(editingId).set({name, cover_url, link_url: link});
    } else {
      await db.collection("playlists").add({name, cover_url, link_url: link});
    }
  } catch(err) {
    alert("Erro ao salvar playlist: " + err.message);
    console.error(err);
    return;
  }

  this.reset();
  document.getElementById("hiddenForm").classList.remove("show");
  editingId = null;
  loadPlaylists();
});

loadPlaylists();
