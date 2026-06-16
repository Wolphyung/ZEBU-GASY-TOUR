// ============================================
// VÉRIFICATION DE LA SESSION
// ============================================
if (!localStorage.getItem('admin_logged_in')) {
  window.location.href = 'login.html';
}

// ============================================
// VARIABLES GLOBALES
// ============================================
let newsData = [];
let editingId = null;
let tempImageData = null;

// ============================================
// CONFIGURATION GITHUB - À MODIFIER
// ============================================
const GITHUB_CONFIG = {
  owner: 'Wolphyung',     // Votre nom GitHub
  repo: 'ZEBU-GASY-TOUR',                 // Nom du repository
  path: 'data/news.json',
  branch: 'main',
  // Créez un token ici: https://github.com/settings/tokens
  // Cochez 'repo' pour autoriser l'écriture
//   token: 'GITHUB_TOKEN'
};

// ============================================
// CHARGEMENT DE LA CONFIGURATION GITHUB
// ============================================
let GITHUB_CONFIG = null;

async function loadGitHubConfig() {
  try {
    // Essayer de charger config.js
    const response = await fetch('config.js?t=' + Date.now());
    if (response.ok) {
      const script = document.createElement('script');
      script.src = 'config.js?t=' + Date.now();
      document.head.appendChild(script);
      
      return new Promise((resolve) => {
        script.onload = () => {
          // La variable GITHUB_CONFIG est maintenant disponible
          resolve();
        };
        script.onerror = () => {
          console.warn('config.js non trouvé, utilisation des valeurs par défaut');
          resolve();
        };
      });
    }
  } catch (error) {
    console.warn('Erreur chargement config:', error);
  }
}

// ============================================
// DONNÉES PAR DÉFAUT
// ============================================
function useDefaultData() {
  newsData = [
    { id: 1, title: 'Nouveau circuit : Découverte du Sud Sauvage', content: 'Partez pour une aventure de 7 jours à travers le Grand Sud de Madagascar.', date: '2026-06-16', type: 'promotion', image: '', active: true },
    { id: 2, title: 'Promotion : -15% sur Nosy Be', content: 'Réservez votre séjour à Nosy Be avant le 30 juillet et bénéficiez de 15% de réduction.', date: '2026-06-15', type: 'promotion', image: '', active: true },
    { id: 3, title: 'Nouveau menu au Zébu Resto', content: 'Découvrez notre nouvelle carte automnale avec des plats signatures.', date: '2026-06-14', type: 'actualite', image: '', active: true }
  ];
  saveToGitHub();
}

// ============================================
// SAUVEGARDER SUR GITHUB
// ============================================
async function saveToGitHub() {
  // Sauvegarder dans localStorage pour le fallback
  localStorage.setItem('zgt_news', JSON.stringify(newsData));
  
  try {
    // Récupérer le SHA actuel du fichier
    const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha = '';
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }
    
    // Préparer le contenu en Base64
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(newsData, null, 2))));
    
    // Mettre à jour le fichier
    const updateUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Mise à jour des actualités - ${new Date().toLocaleString()}`,
        content: content,
        sha: sha,
        branch: GITHUB_CONFIG.branch
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Fichier mis à jour sur GitHub');
      showToast('✅ Données sauvegardées sur GitHub !');
    } else {
      const errorData = await updateResponse.json();
      console.error('Erreur GitHub:', errorData);
      showToast('⚠️ Erreur de sauvegarde. Vérifiez votre token.', 'error');
    }
  } catch (error) {
    console.error('Erreur de sauvegarde:', error);
    showToast('⚠️ Données sauvegardées localement. Synchronisez manuellement.', 'error');
  }
  
  renderDashboard();
  renderNewsTable();
}

// ============================================
// RENDU DU DASHBOARD
// ============================================
function renderDashboard() {
  const total = newsData.length;
  const promos = newsData.filter(n => n.type === 'promotion').length;
  const events = newsData.filter(n => n.type === 'evenement').length;
  const active = newsData.filter(n => n.active).length;
  
  document.getElementById('totalNews').textContent = total;
  document.getElementById('totalPromos').textContent = promos;
  document.getElementById('totalEvents').textContent = events;
  document.getElementById('totalActive').textContent = active;
  
  const preview = document.getElementById('latestNewsPreview');
  const latest = newsData.slice(0, 3);
  if (latest.length === 0) {
    preview.innerHTML = '<p class="text-muted">Aucune actualité pour le moment.</p>';
  } else {
    preview.innerHTML = latest.map(n => `
      <div class="d-flex align-items-center border-bottom pb-2 mb-2 gap-3">
        ${n.image ? `<img src="${n.image}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">` : ''}
        <div class="flex-grow-1">
          <strong>${n.title}</strong>
          <span class="badge badge-type ${n.type} ms-2">${n.type}</span>
          <p class="small text-muted mb-0">${n.content.substring(0, 60)}${n.content.length > 60 ? '...' : ''}</p>
        </div>
        <small class="text-muted">${n.date}</small>
      </div>
    `).join('');
  }
}

// ============================================
// RENDU DU TABLEAU
// ============================================
function renderNewsTable() {
  const tbody = document.getElementById('newsTableBody');
  if (newsData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucune actualité</td></tr>';
    return;
  }
  
  tbody.innerHTML = newsData.map(n => `
    <tr>
      <td>#${n.id}</td>
      <td>${n.image ? `<img src="${n.image}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">` : '<span class="text-muted">Aucune</span>'}</td>
      <td><strong>${n.title}</strong></td>
      <td><span class="badge badge-type ${n.type}">${n.type}</span></td>
      <td>${n.date}</td>
      <td>${n.active ? '<span class="badge bg-success">Actif</span>' : '<span class="badge bg-secondary">Inactif</span>'}</td>
      <td>
        <button class="btn-action" onclick="editNews(${n.id})" title="Modifier"><i class="fas fa-edit"></i></button>
        <button class="btn-action" onclick="toggleNews(${n.id})" title="${n.active ? 'Désactiver' : 'Activer'}">
          <i class="fas ${n.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
        </button>
        <button class="btn-action danger" onclick="deleteNews(${n.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// NAVIGATION
// ============================================
document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const page = this.dataset.page;
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');
    const titles = { dashboard: 'Tableau de bord', news: 'Actualités & Promotions' };
    document.getElementById('pageTitle').textContent = titles[page] || page;
  });
});

// ============================================
// TOGGLE SIDEBAR
// ============================================
document.getElementById('toggleSidebar')?.addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
});

// ============================================
// DATE ACTUELLE
// ============================================
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ============================================
// DÉCONNEXION
// ============================================
document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  localStorage.removeItem('admin_logged_in');
  window.location.href = 'login.html';
});

// ============================================
// GESTION DE L'IMAGE
// ============================================
document.getElementById('newsImage').addEventListener('change', function(e) {
  const file = this.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    alert('L\'image est trop volumineuse. Taille max : 2MB');
    this.value = '';
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image valide (JPG, PNG, GIF)');
    this.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(event) {
    tempImageData = event.target.result;
    document.getElementById('imagePreviewImg').src = tempImageData;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('newsImageData').value = tempImageData;
  };
  reader.readAsDataURL(file);
});

function removeImage() {
  tempImageData = null;
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('imagePreviewImg').src = '';
  document.getElementById('newsImageData').value = '';
  document.getElementById('newsImage').value = '';
}

// ============================================
// MODAL - AJOUT / ÉDITION
// ============================================
const newsModal = new bootstrap.Modal(document.getElementById('newsModal'));

document.getElementById('addNewsBtn').addEventListener('click', function() {
  editingId = null;
  tempImageData = null;
  document.getElementById('newsModalTitle').textContent = 'Ajouter une actualité';
  document.getElementById('editId').value = '';
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsContent').value = '';
  document.getElementById('newsType').value = 'actualite';
  document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('newsActive').checked = true;
  document.getElementById('newsImage').value = '';
  document.getElementById('newsImageData').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  newsModal.show();
});

function editNews(id) {
  const item = newsData.find(n => n.id === id);
  if (!item) return;
  editingId = id;
  tempImageData = item.image || null;
  document.getElementById('newsModalTitle').textContent = 'Modifier l\'actualité';
  document.getElementById('editId').value = id;
  document.getElementById('newsTitle').value = item.title;
  document.getElementById('newsContent').value = item.content;
  document.getElementById('newsType').value = item.type;
  document.getElementById('newsDate').value = item.date;
  document.getElementById('newsActive').checked = item.active;
  document.getElementById('newsImageData').value = item.image || '';
  
  if (item.image) {
    document.getElementById('imagePreviewImg').src = item.image;
    document.getElementById('imagePreview').style.display = 'block';
  } else {
    document.getElementById('imagePreview').style.display = 'none';
  }
  newsModal.show();
}

// ============================================
// SAUVEGARDER
// ============================================
document.getElementById('saveNewsBtn').addEventListener('click', function() {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('newsTitle').value.trim();
  const content = document.getElementById('newsContent').value.trim();
  const type = document.getElementById('newsType').value;
  const date = document.getElementById('newsDate').value || new Date().toISOString().split('T')[0];
  const active = document.getElementById('newsActive').checked;
  const image = document.getElementById('newsImageData').value || '';
  
  if (!title || !content) {
    alert('Veuillez remplir tous les champs');
    return;
  }
  
  if (id) {
    const index = newsData.findIndex(n => n.id === parseInt(id));
    if (index !== -1) {
      newsData[index] = { ...newsData[index], title, content, type, date, active, image };
    }
  } else {
    const newId = newsData.length > 0 ? Math.max(...newsData.map(n => n.id)) + 1 : 1;
    newsData.push({ id: newId, title, content, date, type, image, active });
  }
  
  saveToGitHub();
  newsModal.hide();
});

// ============================================
// SUPPRIMER
// ============================================
function deleteNews(id) {
  if (!confirm('Voulez-vous vraiment supprimer cette actualité ?')) return;
  newsData = newsData.filter(n => n.id !== id);
  saveToGitHub();
}

// ============================================
// ACTIVER / DÉSACTIVER
// ============================================
function toggleNews(id) {
  const item = newsData.find(n => n.id === id);
  if (item) {
    item.active = !item.active;
    saveToGitHub();
  }
}

// ============================================
// TOAST POUR LES NOTIFICATIONS
// ============================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toastMsg');
  if (toast) {
    toast.textContent = message;
    toast.className = 'toast-notification ' + type;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

// ============================================
// INITIALISATION
// ============================================
loadData();