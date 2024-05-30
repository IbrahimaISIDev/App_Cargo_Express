
document.addEventListener('DOMContentLoaded', () => {
    const addCargoBtn = document.getElementById('addCargoBtn');
    const addCargoModal = document.getElementById('addCargoModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const addCargoForm = document.getElementById('addCargoForm');
    const cargoList = document.getElementById('cargo-list');

    const dateDepartInput = document.getElementById('dateDepart');
    const dateArriveeInput = document.getElementById('dateArrivee');
    const stopCriteriaSelect = document.getElementById('stopCriteria');
    const criteriaValueInput = document.getElementById('criteriaValue');
    let pointDepart = null;
    let pointArrivee = null;

    // Initialisation des compteurs pour chaque type de cargaison
    const cargoCounters = {
        maritime: 0,
        aerien: 0,
        // Ajoutez d'autres types si nécessaire
    };

    addCargoBtn.addEventListener('click', () => {
        addCargoModal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        addCargoModal.classList.add('hidden');
    });

    addCargoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const type = addCargoForm.type.value;
        const dateDepart = addCargoForm.dateDepart.value;
        const dateArrivee = addCargoForm.dateArrivee.value;
        const stopCriteria = addCargoForm.stopCriteria.value;
        const criteriaValue = addCargoForm.criteriaValue.value;

        // Génération d'un identifiant unique pour le type de cargaison
        const cargoId = generateCargoId(type);

        // Création de la nouvelle ligne de cargaison avec l'identifiant unique
        const newRow = createNewCargoRow(cargoId, type, dateDepart, dateArrivee, distance.toFixed(2));
        cargoList.appendChild(newRow);
        addCargoModal.classList.add('hidden');
        addCargoForm.reset();
    });

    // Fonction pour générer un identifiant unique pour chaque type de cargaison
    function generateCargoId(type) {
        if (!cargoCounters[type]) {
            cargoCounters[type] = 0;
        }
        cargoCounters[type]++;
        return `${type.charAt(0).toUpperCase()}${cargoCounters[type].toString().padStart(3, '0')}`;
    }

    function createNewCargoRow(id, type, dateDepart, dateArrivee, distance) {
        const newRow = document.createElement('tr');
        newRow.classList.add('border-b');
        newRow.innerHTML = `
            <td class="py-2 px-4">${id}</td>
            <td class="py-2 px-4">${type}</td>
            <td class="py-2 px-4">${dateDepart}</td>
            <td class="py-2 px-4">${dateArrivee}</td>
            <td class="py-2 px-4">${distance}</td>
            <td class="py-2 px-4"><button>Ouvert</button></td>
            <td class="py-2 px-4"><button>En attente</button></td>
            <td class="py-2 px-4">
                <button class="bg-blue-700 text-white px-4 py-2 rounded-lg">Voir</button>
            </td>
        `;
        return newRow;
    }

    function validateForm() {
        clearErrors();
        let isValid = true;

        const selectedType = getSelectedType();
        if (!selectedType) {
            showError('typeError', 'Veuillez choisir un type de cargaison.');
            isValid = false;
        }

        const now = new Date().toISOString().split('T')[0];
        if (dateDepartInput.value < now) {
            showError('dateDepartError', 'La date de départ ne doit pas être inférieure à la date actuelle.');
            isValid = false;
        }

        if (dateArriveeInput.value <= dateDepartInput.value) {
            showError('dateArriveeError', 'La date d\'arrivée doit être supérieure à la date de départ.');
            isValid = false;
        }

        if (stopCriteriaSelect.value && criteriaValueInput.value <= 0) {
            showError('criteriaValueError', 'La valeur doit être positive.');
            isValid = false;
        }

        return isValid;
    }

    function clearErrors() {
        document.getElementById('typeError').textContent = '';
        document.getElementById('dateDepartError').textContent = '';
        document.getElementById('dateArriveeError').textContent = '';
        document.getElementById('criteriaValueError').textContent = '';
        document.getElementById('mapError').textContent = '';
    }

    function showError(elementId, message) {
        document.getElementById(elementId).textContent = message;
    }

    function getSelectedType() {
        const radios = document.getElementsByName('type');
        for (const radio of radios) {
            if (radio.checked) {
                return radio.value;
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
let departMarker, arriveeMarker;

// Gestion de l'événement de clic sur la carte
map.on("click", function (e) {
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
function createMarker(latlng, popupText) {
    return L.marker(latlng)
        .addTo(map)
        .bindPopup(popupText)
        .openPopup();
}

// Mise à jour des champs de formulaire avec le nom du lieu
function updateInputWithLocationName(latlng, inputId) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
        .then((response) => response.json())
        .then((data) => {
            const locationName = data.display_name || `${latlng.lat}, ${latlng.lng}`;
            document.getElementById(inputId).value = locationName;
        })
        .catch((error) => {
            console.error("Error fetching location name:", error);
            document.getElementById(inputId).value = `${latlng.lat}, ${latlng.lng}`;
        });
}

// Variable globale pour stocker la distance calculée
let distance = null;

// Calcul de la distance entre deux points
function calculateDistance(start, end) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((end.lat - start.lat) * Math.PI) / 180;
    const dLon = ((end.lng - start.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((start.lat * Math.PI) / 180) * Math.cos((end.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance = R * c; // Stocker la distance dans la variable globale
    document.getElementById("distance").value = distance.toFixed(2);
}

// Gestion du champ de saisie en fonction du choix
const choixSelect = document.getElementById("choix");
const champSaisi = document.getElementById("champ-saisi");
const labelValeur = document.querySelector("#champ-saisi label");
const inputValeur = document.getElementById("valeur");

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
function showInputField(labelText, placeholderText) {
    champSaisi.classList.remove("hidden");
    labelValeur.textContent = labelText;
    inputValeur.placeholder = placeholderText;
}

// Masquage du champ de saisie
function hideInputField() {
    champSaisi.classList.add("hidden");
}




// Chargement initial des cargaisons depuis un fichier JSON
document.addEventListener('DOMContentLoaded', function () {
    fetch('cargos.json')
        .then(response => response.json())
        .then(data => {
            let enCoursCount = data.filter(cargo => cargo.status === 'en cours').length;
            document.getElementById('nbEnCours').innerText = enCoursCount;
        })
        .catch(error => console.error('Error:', error));
});

const pageSize = 5; // Nombre d'éléments par page
let currentPage = 1; // Page actuelle
let cargoData = []; // Données des cargaisons

document.addEventListener('DOMContentLoaded', () => {
    // Récupérer les données initiales des cargaisons
    fetchCargoData();

    // Gérer le changement de page
    document.getElementById('pagination').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            currentPage = parseInt(event.target.dataset.page);
            renderCargoList();
        }
    });
});

function fetchCargoData() {
    // Faire une requête AJAX pour obtenir les données des cargaisons (par exemple depuis un fichier JSON ou une API)
    // Assurez-vous de stocker les données dans la variable cargoData une fois qu'elles sont récupérées
    // Exemple de chargement depuis un fichier JSON
    fetch('cargos.json')
        .then(response => response.json())
        .then(data => {
            cargoData = data;
            renderCargoList();
        })
        .catch(error => console.error('Error:', error));
}

function renderCargoList() {
    const cargoList = document.getElementById('cargo-list');
    cargoList.innerHTML = ''; // Effacer le contenu existant

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = cargoData.slice(startIndex, endIndex);

    // Afficher les données des cargaisons paginées
    paginatedData.forEach(cargo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cargo.id}</td>
            <td>${cargo.type}</td>
            <td>${cargo.date}</td>
            <td>${cargo.etat}</td>
            <td>${cargo.status}</td>
        `;
        cargoList.appendChild(row);
    });

    // Afficher les boutons de pagination
    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(cargoData.length / pageSize);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.dataset.page = i;
        if (i === currentPage) {
            button.classList.add('active');
        }
        pagination.appendChild(button);
    }
}

function search() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filterSelect = document.getElementById('filterSelect').value;

    const filteredData = cargoData.filter(cargo => {
        switch (filterSelect) {
            case 'id':
                return cargo.id.toLowerCase().includes(searchInput);
            case 'type':
                return cargo.type.toLowerCase().includes(searchInput);
            case 'date':
                return cargo.date.toLowerCase().includes(searchInput);
            case 'etat':
                return cargo.etat.toLowerCase().includes(searchInput);
            case 'status':
                return cargo.status.toLowerCase().includes(searchInput);
            default:
                return false;
        }
    });

    cargoData = filteredData;
    currentPage = 1;
    renderCargoList();
}
