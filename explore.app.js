// --- Global variables ---
const API_URL = 'http://127.0.0.1:5000';
let map;
let wardsData = [];

// --- Main function: Runs when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchCurrentRiskData();
});

function initMap() {
    map = L.map('map').setView([13.0, 77.5], 11); // Default center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

async function fetchCurrentRiskData() {
    console.log("Fetching current risk data...");
    try {
        const response = await fetch(`${API_URL}/api/ward-risk/current`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        wardsData = await response.json();
        console.log("Data received:", wardsData);

        if (wardsData.length > 0) {
            map.setView([wardsData[0].latitude, wardsData[0].longitude], 11);
            addWardMarkers();
            populateWardList();
        } else {
            document.getElementById('ward-list').innerHTML = "<p>No ward data found.</p>";
        }
    } catch (error) {
        console.error("Error fetching risk data:", error);
        document.getElementById('ward-list').innerHTML = `<p>Error loading data. Is the Python backend running?</p>`;
    }
}

function addWardMarkers() {
    wardsData.forEach(ward => {
        const marker = L.circleMarker([ward.latitude, ward.longitude], {
            radius: 8,
            fillColor: getRiskColor(ward.Vulnerability_Score),
            color: '#333',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
            <strong>${ward.ward_name}</strong><br>
            Risk Score: ${ward.Vulnerability_Score.toFixed(2)}
        `);
    });
}

function populateWardList() {
    const listElement = document.getElementById('ward-list');
    listElement.innerHTML = ''; // Clear "Loading..." text

    const sortedWards = [...wardsData].sort((a, b) => b.Vulnerability_Score - a.Vulnerability_Score);

    sortedWards.forEach(ward => {
        const item = document.createElement('div');
        item.className = 'ward-item';
        item.innerHTML = `
            <span>${ward.ward_name}</span>
            <span class="ward-score" style="background-color: ${getRiskColor(ward.Vulnerability_Score)}">
                ${ward.Vulnerability_Score.toFixed(1)}
            </span>
        `;
        listElement.appendChild(item);
    });
}

function getRiskColor(score) {
    if (score > 80) return '#d73027'; // High risk (Red)
    if (score > 60) return '#f46d43'; // (Orange)
    if (score > 40) return '#fdae61'; // (Light Orange)
    if (score > 20) return '#fee08b'; // (Yellow)
    return '#66bd63'; // Low risk (Green)
}
