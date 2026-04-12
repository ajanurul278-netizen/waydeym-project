const map = L.map('map').setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
const iconDiam = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});
const iconPanah = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/507/507205.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

let jejakKoordinat = [];
let garisBayangan = null;
let markerSaya = null;
const MAX_TITIK = 10;

function success(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const speed = position.coords.speed || 0;
    const koordinatSekarang = [lat, lng];

    let iconAktif = iconDiam;
    if (speed > 0.5) {
        iconAktif = iconPanah;
    }

    if (markerSaya) {
        map.removeLayer(markerSaya);
    }

    markerSaya = L.marker(koordinatSekarang, { icon: iconAktif }).addTo(map);

    jejakKoordinat.push(koordinatSekarang);
    if (jejakKoordinat.length > MAX_TITIK) {
        jejakKoordinat.shift();
    }

    if (garisBayangan) {
        map.removeLayer(garisBayangan);
    }
    garisBayangan = L.polyline(jejakKoordinat, { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
    map.setView(koordinatSekarang, 13);
}
        
    

function error(err) {
    console.warn("Gagal mengambil lokasi: " + err.message);
}

navigator.geolocation.watchPosition(success, error);

