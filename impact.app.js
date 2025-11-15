// --- Global variables ---
const API_URL = 'http://127.0.0.1:5000';
let map;
let originalWardsData = []; // To store the master data
let currentWardsData = [];  // To store what's *currently* displayed
let wardMarkers = []; // To keep track of map markers

// --- Main function: Runs when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchCurrentRiskData();
    
    document.getElementById('simulate-toggle').addEventListener('change', (event) => {
        handleSimulationToggle(event.target.checked);
    });
});

function initMap() {
    map = L.map('map').setView([13.0, 77.5], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

async function fetchCurrentRiskData() {
    console.log("Fetching current risk data...");
    try {
        const response = await fetch(`${API_URL}/api/ward-risk/current`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        originalWardsData = await response.json();
        currentWardsData = originalWardsData; // Initially, current is original
        
        console.log("Data received:", originalWardsData);

        if (originalWardsData.length > 0) {
            map.setView([originalWardsData[0].latitude, originalWardsData[0].longitude], 11);
            updateDashboard(); // Draw map and list
        } else {
            document.getElementById('ward-list').innerHTML = "<p>No ward data found.</p>";
        }
    } catch (error) {
        console.error("Error fetching risk data:", error);
        document.getElementById('ward-list').innerHTML = `<p>Error loading data. Is the Python backend running?</p>`;
    }
}

function handleSimulationToggle(isSimulationActive) {
    if (isSimulationActive) {
        console.log("--- SIMULATION ON ---");
        currentWardsData = simulateCoolRoofs(originalWardsData);
    } else {
        console.log("--- SIMULATION OFF ---");
        currentWardsData = originalWardsData;
    }
    updateDashboard(); // Redraw map and list
}

function simulateCoolRoofs(data) {
    // We apply a simple 20% reduction to the final Vulnerability_Score
    // as an *estimate* of the impact. This is perfect for a demo.
    return data.map(ward => {
        const simulatedWard = { ...ward }; // Create a new object
        const simulatedTemp = simulatedWard.temperature_max - 2.0;
        
        simulatedWard.Heat_Risk_Index = (
            (simulatedTemp * 0.5) +
            (simulatedWard.humidity_max * 0.3) -
            (simulatedWard.precipitation_sum * 0.2)
        );
        simulatedWard.Population_At_Risk = simulatedWard.Heat_Risk_Index * simulatedWard.Population;
        simulatedWard.Vulnerability_Score = simulatedWard.Vulnerability_Score * 0.8; // 20% reduction
        simulatedWard.temperature_max = simulatedTemp;
        
        return simulatedWard;
    });
}

function updateDashboard() {
    wardMarkers.forEach(marker => marker.remove());
    wardMarkers = [];
    addWardMarkers();
    populateWardList();
}

function addWardMarkers() {
    currentWardsData.forEach(ward => {
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
        wardMarkers.push(marker);
    });
}

function populateWardList() {
    const listElement = document.getElementById('ward-list');
    listElement.innerHTML = ''; 

    const sortedWards = [...currentWardsData].sort((a, b) => b.Vulnerability_Score - a.Vulnerability_Score);

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
