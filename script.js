const firebaseConfig = {
    apiKey: "AIzaSyAs1oJZ4j54b5ebis8HZwjppktLBzGQhhM",
    authDomain: "waydeym-project.firebaseapp.com",
    databaseURL: "https://waydeym-project-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "waydeym-project",
    storageBucket: "waydeym-project.firebasestorage.app",
    messagingSenderId: "529560163661",
    appId: "1:529560163661:web:bc534018a5933775151304"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};
const trails = {};
let myName = "";
let myPos = null;
let isInteracting = false;
let myHistory = []; // Simpan lokal dulu agar garis cepat muncul

// Deteksi Interaksi
map.on('movestart', () => { isInteracting = true; });

// Tombol Fokus
const btnFocus = document.getElementById('btnFocus');
btnFocus.onclick = () => {
    isInteracting = false;
    if (myPos) map.flyTo([myPos.lat, myPos.lng], 16);
};

document.getElementById('btnStart').onclick = function() {
    myName = document.getElementById('username').value.trim();
    const maxPoints = parseInt(document.getElementById('trailLimit').value) || 20;

    if (!myName) return alert("Isi nama dulu!");

    // LANGSUNG SEMBUNYIKAN UI (Jangan nunggu GPS)
    document.getElementById('inputArea').style.display = "none";
    document.getElementById('subTitle').innerText = "MENUNGGU GPS...";
    
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            myPos = { lat, lng };

            // Update UI setelah GPS dapat
            document.getElementById('subTitle').innerText = "TRACKING: " + myName;
            btnFocus.style.display = "block";
            document.getElementById('status').innerText = "Sinyal Terkunci ◆";

            // Update History Lokal
            myHistory.push({ lat, lng });
            if (myHistory.length > maxPoints) myHistory.shift();

            // Kirim ke Firebase
            database.ref('locations/' + myName).set({
                lat: lat,
                lng: lng,
                history: myHistory,
                lastActive: Date.now()
            });

            if (!isInteracting) map.setView([lat, lng], 16);
            
        }, (err) => {
            document.getElementById('status').innerText = "GPS Error!";
        }, { enableHighAccuracy: true });
    }
};

// Pantau Database
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const now = Date.now();
    for (let id in data) {
        const info = data[id];

        // Hapus jika tidak aktif 15 detik
        if (now - info.lastActive > 15000) {
            if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
            if (trails[id]) { map.removeLayer(trails[id]); delete trails[id]; }
            continue;
        }

        // Marker
        if (markers[id]) {
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            const icon = L.divIcon({ className: 'neon-marker', html: '◆', iconSize: [40, 40], iconAnchor: [20, 20] });
            markers[id] = L.marker([info.lat, info.lng], { icon: icon }).addTo(map).bindPopup(id);
        }

        // Garis Jejak (Polyline)
        if (info.history && info.history.length > 1) {
            const path = info.history.map(p => [p.lat, p.lng]);
            if (trails[id]) {
                trails[id].setLatLngs(path);
            } else {
                trails[id] = L.polyline(path, { 
                    color: '#00f2fe', 
                    weight: 5, 
                    opacity: 0.8,
                    lineJoin: 'round'
                }).addTo(map);
            }
        }
    }
});
