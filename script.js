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
let maxPoints = 20;

// Deteksi Scroll/Geser Peta
map.on('movestart', () => { isInteracting = true; });

// Tombol Fokus
const btnFocus = document.getElementById('btnFocus');
btnFocus.onclick = () => {
    if (myPos) {
        isInteracting = false;
        map.flyTo([myPos.lat, myPos.lng], 16);
    }
};

document.getElementById('btnStart').onclick = function() {
    myName = document.getElementById('username').value.trim();
    maxPoints = parseInt(document.getElementById('trailLimit').value) || 20;

    if (!myName) return alert("Masukkan nama!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Mencari Lokasi...";

        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            myPos = { lat, lng };

            // UI LOGIC: Sembunyikan Input, Tampilkan Tombol Fokus
            document.getElementById('inputArea').style.display = "none";
            document.getElementById('subTitle').innerText = "TRACKING: " + myName;
            btnFocus.style.display = "block";

            // Update Database
            const userRef = database.ref('locations/' + myName);
            userRef.once('value').then((snap) => {
                let history = (snap.val() && snap.val().history) ? snap.val().history : [];
                history.push({ lat, lng });

                if (history.length > maxPoints) history.shift();

                userRef.set({
                    lat: lat,
                    lng: lng,
                    history: history,
                    lastActive: Date.now()
                });
            });

            // Auto Center jika tidak sedang scroll
            if (!isInteracting) {
                map.setView([lat, lng], 16);
            }
            document.getElementById('status').innerText = "Lokasi Terkunci ◆";
        }, (err) => {
            alert("Gagal akses GPS: " + err.message);
        }, { enableHighAccuracy: true });
    }
};

// Monitor Database
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

        // Marker Update
        if (markers[id]) {
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            const icon = L.divIcon({ className: 'neon-marker', html: '◆', iconSize: [40, 40], iconAnchor: [20, 20] });
            markers[id] = L.marker([info.lat, info.lng], { icon: icon }).addTo(map).bindPopup(id);
        }

        // Polyline (Garis Biru) Update
        if (info.history && info.history.length > 1) {
            const path = info.history.map(p => [p.lat, p.lng]);
            if (trails[id]) {
                trails[id].setLatLngs(path);
            } else {
                trails[id] = L.polyline(path, { color: '#00f2fe', weight: 4, opacity: 0.6 }).addTo(map);
            }
        }
    }
});
