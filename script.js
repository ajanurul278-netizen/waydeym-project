const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Setup Map (CartoDB Dark Matter)
const map = L.map('map').setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; WayDeym Solidaritas'
}).addTo(map);

let myMarker, otherMarkers = {};

function startTracking() {
    const nama = document.getElementById('username').value;
    const pin = document.getElementById('pin').value;

    if (!nama || !pin) return alert("Isi Nama & PIN!");

    document.getElementById('status').innerText = "Mencari lokasi Anda...";

    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        
        if (!myMarker) {
            myMarker = L.circleMarker([latitude, longitude], {
                radius: 10, fillColor: "#00f2fe", color: "#fff", weight: 3, fillOpacity: 1
            }).addTo(map);
            map.setView([latitude, longitude], 15);
        } else {
            myMarker.setLatLng([latitude, longitude]);
        }

        myMarker.bindTooltip(nama.toUpperCase() + " ◆ ONLINE", { 
            permanent: true, direction: 'top', className: 'custom-label' 
        }).openTooltip();

        db.ref('users/' + nama).set({ lat: latitude, lng: longitude, pin: pin });
        document.getElementById('status').innerText = "Jejak Aktif - WayDeym";
    });
}

// Pantau Teman
db.ref('users').on('value', snapshot => {
    const data = snapshot.val();
    const namaUser = document.getElementById('username').value;

    for (let id in data) {
        if (id === namaUser) continue;
        const u = data[id];
        
        if (otherMarkers[id]) {
            otherMarkers[id].setLatLng([u.lat, u.lng]);
        } else {
            otherMarkers[id] = L.circleMarker([u.lat, u.lng], {
                radius: 8, fillColor: "#ff4b2b", color: "#fff", weight: 2, fillOpacity: 1
            }).addTo(map).bindTooltip(id.toUpperCase() + " ◆ WAYDEYM", { 
                permanent: true, direction: 'top', className: 'custom-label' 
            });
        }
    }
});

document.getElementById('btnStart').addEventListener('click', startTracking);