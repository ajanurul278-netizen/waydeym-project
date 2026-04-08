// 1. Konfigurasi Firebase (Gunakan milikmu)
const firebaseConfig = {
    apiKey: "AIzaSyAs1oJZ4j54b5ebis8HZwjppktLBzGQhhM",
    authDomain: "waydeym-project.firebaseapp.com",
    databaseURL: "https://waydeym-project-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "waydeym-project",
    storageBucket: "waydeym-project.firebasestorage.app",
    messagingSenderId: "529560163661",
    appId: "1:529560163661:web:bc534018a5933775151304"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 2. Setup Peta
const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};
const trails = {}; // Untuk menyimpan garis jejak (Polyline) tiap user
let isUserInteracting = false;

// Deteksi interaksi user agar peta tidak auto-center saat digeser manual
map.on('movestart', () => { isUserInteracting = true; });
map.on('dragend', () => { 
    // Jika ingin auto-center kembali aktif setelah 10 detik diam, aktifkan baris bawah:
    // setTimeout(() => { isUserInteracting = false; }, 10000); 
});

// 3. Fungsi Kirim Data (Tombol Mulai)
document.getElementById('btnStart').addEventListener('click', function() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Isi nama dulu!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Mencari sinyal...";
        
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const timestamp = Date.now();

            // Ambil data lama untuk menambah array jejak
            database.ref('locations/' + name).once('value').then((snapshot) => {
                let history = [];
                if (snapshot.exists() && snapshot.val().history) {
                    history = snapshot.val().history;
                }

                // Tambahkan posisi baru ke sejarah
                history.push({ lat, lng, time: timestamp });

                // Fitur Jejak: Hanya simpan 10 koordinat terakhir (biar memudar/hilang)
                if (history.length > 10) {
                    history.shift();
                }

                // Update ke Firebase
                database.ref('locations/' + name).set({
                    lat: lat,
                    lng: lng,
                    history: history,
                    lastActive: timestamp
                });
            });

            if (!isUserInteracting) {
                map.setView([lat, lng], 15);
            }
            document.getElementById('status').innerText = "Jejak Aktif ◆";
        }, (err) => {
            document.getElementById('status').innerText = "GPS Error: " + err.message;
        }, { enableHighAccuracy: true });
    }
});

// 4. Baca Data & Gambar Jejak
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const currentTime = Date.now();

    for (let id in data) {
        const info = data[id];

        // LOGIKA AUTO-CLEANUP 15 DETIK
        if (currentTime - info.lastActive > 15000) {
            if (markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
            if (trails[id]) {
                map.removeLayer(trails[id]);
                delete trails[id];
            }
            continue;
        }

        // UPDATE ATAU BUAT MARKER
        if (markers[id]) {
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            const diamondIcon = L.divIcon({
                className: 'neon-marker',
                html: '◆',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            markers[id] = L.marker([info.lat, info.lng], { icon: diamondIcon }).addTo(map).bindPopup(id);
        }

        // UPDATE ATAU BUAT GARIS JEJAK (POLYLINE)
        if (info.history && info.history.length > 1) {
            const pointList = info.history.map(p => [p.lat, p.lng]);
            
            if (trails[id]) {
                trails[id].setLatLngs(pointList);
            } else {
                trails[id] = L.polyline(pointList, {
                    color: '#00f2fe',
                    weight: 4,
                    opacity: 0.6,
                    dashArray: '5, 10', // Biar garisnya putus-putus estetik
                    lineJoin: 'round'
                }).addTo(map);
            }
        }
    }

    // Hapus marker/trail jika ID sudah tidak ada di Firebase
    for (let id in markers) {
        if (!data[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
            if (trails[id]) {
                map.removeLayer(trails[id]);
                delete trails[id];
            }
        }
    }
});
