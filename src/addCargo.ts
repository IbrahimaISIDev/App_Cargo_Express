import * as L from 'leaflet';

interface Cargo {
  id: string;
  type: string;
  dateDepart: Date;
  dateArrivee: Date;
  status: string;
}

document.addEventListener('DOMContentLoaded', () => {
  const addCargoBtn = document.getElementById('addCargoBtn');
  const addCargoModal = document.getElementById('addCargoModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const addCargoForm = document.getElementById('addCargoForm') as HTMLFormElement;
  const cargoList = document.getElementById('cargo-list');

  const dateDepartInput = document.getElementById('dateDepart') as HTMLInputElement;
  const dateArriveeInput = document.getElementById('dateArrivee') as HTMLInputElement;
  const stopCriteriaSelect = document.getElementById('stopCriteria') as HTMLSelectElement;
  const criteriaValueInput = document.getElementById('criteriaValue') as HTMLInputElement;
  let pointDepart: L.LatLng | null = null;
  let pointArrivee: L.LatLng | null = null;

  addCargoBtn?.addEventListener('click', () => {
    addCargoModal?.classList.remove('hidden');
  });

  cancelBtn?.addEventListener('click', () => {
    addCargoModal?.classList.add('hidden');
  });

  addCargoForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const type = (addCargoForm.elements.namedItem('type') as HTMLInputElement)?.value;
    const dateDepart = new Date(addCargoForm.dateDepart.value);
    const dateArrivee = new Date(addCargoForm.dateArrivee.value);
    const stopCriteria = addCargoForm.stopCriteria.value;
    const criteriaValue = parseFloat(addCargoForm.criteriaValue.value);

    const newRow = document.createElement('tr');
    newRow.classList.add('border-b');
    newRow.innerHTML = `
      <td class="py-2 px-4">C003</td>
      <td class="py-2 px-4">${type}</td>
      <td class="py-2 px-4">${dateDepart.toISOString().split('T')[0]}</td>
      <td class="py-2 px-4">${dateArrivee.toISOString().split('T')[0]}</td>
      <td class="py-2 px-4"><button>Ouvert</button></td>
      <td class="py-2 px-4"><button>En attente</button></td>
      <td class="py-2 px-4">
        <button class="bg-blue-700 text-white px-4 py-2 rounded-lg">Voir</button>
      </td>
    `;
    cargoList?.appendChild(newRow);
    addCargoModal?.classList.add('hidden');
    addCargoForm.reset();
  });

  function validateForm(): boolean {
    clearErrors();
    let isValid = true;

    const selectedType = getSelectedType();
    if (!selectedType) {
      showError('typeError', 'Veuillez choisir un type de cargaison.');
      isValid = false;
    }

    const now = new Date();
    const dateDepart = new Date(dateDepartInput.value);
    const dateArrivee = new Date(dateArriveeInput.value);

    if (dateDepart < now) {
      showError('dateDepartError', 'La date de départ ne doit pas être inférieure à la date actuelle.');
      isValid = false;
    }

    if (dateArrivee <= dateDepart) {
      showError('dateArriveeError', 'La date d\'arrivée doit être supérieure à la date de départ.');
      isValid = false;
    }

    if (stopCriteriaSelect.value && parseFloat(criteriaValueInput.value) <= 0) {
      showError('criteriaValueError', 'La valeur doit être positive.');
      isValid = false;
    }

    /* if (!pointDepart || !pointArrivee) {
      showError('mapError', 'Veuillez choisir les points de départ et d\'arrivée.');
      isValid = false;
    } else if (pointDepart.lat === pointArrivee.lat && pointDepart.lng === pointArrivee.lng) {
      showError('mapError', 'Les points de départ et d\'arrivée doivent être différents.');
      isValid = false;
    } */

    return isValid;
  }

  function clearErrors() {
    document.getElementById('typeError')!.textContent = '';
    document.getElementById('dateDepartError')!.textContent = '';
    document.getElementById('dateArriveeError')!.textContent = '';
    document.getElementById('criteriaValueError')!.textContent = '';
    document.getElementById('mapError')!.textContent = '';
  }

  function showError(elementId: string, message: string) {
    document.getElementById(elementId)!.textContent = message;
  }

  function getSelectedType(): string | null {
    const radios = document.getElementsByName('type');
    for (const radio of Array.from(radios)) {
      if ((radio as HTMLInputElement).checked) {
        return (radio as HTMLInputElement).value;
      }
    }
    return null;
  }
});

// Initialisation de la carte Leaflet
const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
}).addTo(map);

// Variables globales pour les marqueurs de départ et d'arrivée
let departMarker: L.Marker | null = null, arriveeMarker: L.Marker | null = null;

// Gestion de l'événement de clic sur la carte
map.on("click", function (e: L.LeafletMouseEvent) {
  if (!departMarker) {
    // Création du marqueur de départ
    departMarker = createMarker(e.latlng, "Lieu de départ");
    updateInputWithLocationName(e.latlng, "depart");
  } else if (!arriveeMarker) {
    // Création du marqueur d'arrivée
    arriveeMarker = createMarker(e.latlng, "Lieu d'arrivée");
    updateInputWithLocationName(e.latlng, "arrivee");
    calculateDistance(departMarker.getLatLng(), arriveeMarker.getLatLng());
  }
});

// Création d'un marqueur avec un popup
function createMarker(latlng: L.LatLngExpression, popupText: string): L.Marker {
  return L.marker(latlng)
    .addTo(map)
    .bindPopup(popupText)
    .openPopup();
}

// Mise à jour des champs de formulaire avec le nom du lieu
function updateInputWithLocationName(latlng: L.LatLng, inputId: string) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
    .then((response) => response.json())
    .then((data) => {
      const locationName = data.display_name || `${latlng.lat}, ${latlng.lng}`;
      (document.getElementById(inputId) as HTMLInputElement).value = locationName;
    })
    .catch((error) => {
      console.error("Error fetching location name:", error);
      (document.getElementById(inputId) as HTMLInputElement).value = `${latlng.lat}, ${latlng.lng}`;
    });
}

// Calcul de la distance entre deux points
function calculateDistance(start: L.LatLng, end: L.LatLng) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLon = ((end.lng - start.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) * Math.cos((end.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  (document.getElementById("distance") as HTMLInputElement).value = distance.toFixed(2);
}

// Gestion du champ de saisie en fonction du choix
const choixSelect = document.getElementById("choix") as HTMLSelectElement;
const champSaisi = document.getElementById("champ-saisi");
const labelValeur = document.querySelector("#champ-saisi label");
const inputValeur = document.getElementById("valeur") as HTMLInputElement;

choixSelect.addEventListener("change", function () {
  if (this.value === "poids") {
    showInputField("Poids maximal", "Entrez le poids maximal");
  } else if (this.value === "nombre") {
    showInputField("Nombre maximal de produits", "Entrez le nombre maximal de produits");
  } else {
    hideInputField();
  }
});

// Affichage du champ de saisie avec l'étiquette appropriée
function showInputField(labelText: string, placeholderText: string) {
  champSaisi?.classList.remove("hidden");
  labelValeur!.textContent = labelText;
  inputValeur.placeholder = placeholderText;
}

// Masquage du champ de saisie
function hideInputField() {
  champSaisi?.classList.add("hidden");
}
