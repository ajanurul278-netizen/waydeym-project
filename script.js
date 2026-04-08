// GANTI ISI DI DALAM KURUNG KURAWAL INI DENGAN PUNYAMU
const firebaseConfig = {
    apiKey: "AIzaSyAs1oJZ4j54b5ebis8HZwjppktLBzGQhhM",
    authDomain: "waydeym-project.firebaseapp.com",
    databaseURL: "https://waydeym-project-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "waydeym-project",
    storageBucket: "waydeym-project.firebasestorage.app",
    messagingSenderId: "529560163661",
    appId: "1:529560163661:web:bc534018a5933775151304"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Setup Peta
const map = L.map('map').setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};

document.getElementById('btnStart').addEventListener('click', () => {
    const name = document.getElementById('username').value;
    if (!name) return alert("Isi nama dulu!");

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Kirim ke Firebase
            database.ref('locations/' + name).set({
                lat: lat,
                lng: lng,
                timestamp: Date.now()
            });

            map.setView([lat, lng], 15);
            document.getElementById('status').innerText = "📍 Jejak aktif!";
        }, null, { enableHighAccuracy: true });
    }
});

// Baca data orang lain
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    for (let id in data) {
        const info = data[id];
        if (markers[id]) {
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            // Marker diamond neon
            const diamondIcon = L.divIcon({
                className: 'neon-marker',
                html: '◆',
                iconSize: [30, 30]
            });
            markers[id] = L.marker([info.lat, info.lng], {icon: diamondIcon}).addTo(map).bindPopup(id);
        }
    }
});
