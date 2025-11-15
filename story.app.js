// --- Global variables ---
const API_URL = 'http://127.0.0.1:5000';
window.API_URL = API_URL; // Make globally accessible
let wardsData = [];
let forecastChart;
let trendBarChart;

// --- Main function: Runs when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    populateWardDropdown();
    
    document.getElementById('ward-dropdown').addEventListener('change', (event) => {
        const ward_no = event.target.value;
        if (ward_no) {
            fetchWardForecast(ward_no);
        }
    });
});

async function populateWardDropdown() {
    const select = document.getElementById('ward-dropdown');
    try {
        const response = await fetch(`${API_URL}/api/ward-risk/current`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        wardsData = await response.json();
        
        // Sort wards by name
        wardsData.sort((a, b) => a.ward_name.localeCompare(b.ward_name));
        
        select.innerHTML = '<option value="">-- Select a ward --</option>'; // Clear loading
        
        wardsData.forEach(ward => {
            const option = document.createElement('option');
            option.value = ward.ward_no;
            option.textContent = ward.ward_name;
            select.appendChild(option);
        });
        
        // Auto-load the first ward's forecast
        if (wardsData.length > 0) {
            select.value = wardsData[0].ward_no;
            fetchWardForecast(wardsData[0].ward_no);
        }

    } catch (error) {
        console.error("Error fetching ward list:", error);
        select.innerHTML = '<option value="">Error loading wards</option>';
    }
}

async function fetchWardForecast(ward_no) {
    console.log(`Fetching forecast for ward ${ward_no}`);
    try {
        const response = await fetch(`${API_URL}/api/forecast/${ward_no}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const forecastData = await response.json();
        console.log("Forecast data received:", forecastData);
        updateForecastChart(forecastData);
        updateTrendBarChart(forecastData);
        
        return forecastData; // Return data for narrative generation

    } catch (error) {
        console.error("Error fetching forecast data:", error);
        return null;
    }
}

// Make fetchWardForecast globally accessible
window.fetchWardForecast = fetchWardForecast;

function updateForecastChart(forecastData) {
    const ctx = document.getElementById('forecast-chart').getContext('2d');
    
    const labels = forecastData.map(d => d.ds);
    const predictions = forecastData.map(d => d.yhat);

    if (forecastChart) {
        forecastChart.destroy();
    }

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Predicted Max Temp (°C)',
                data: predictions,
                borderColor: '#0B8A5F',
                backgroundColor: 'rgba(11, 138, 95, 0.12)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Temp (°C)' } },
                x: { title: { display: true, text: 'Date' } }
            },
            plugins: {
                title: {
                    display: true,
                    text: '14-Day Max Temperature Forecast',
                    font: { size: 18 }
                }
            }
        }
    });
}

function updateTrendBarChart(forecastData) {
    const canvas = document.getElementById('trend-bar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const temps = forecastData.map(d => d.yhat);
    const labels = ['Early Week', 'Mid Week', 'Late Week'];
    const segmentSize = Math.floor(temps.length / 3) || 1;
    const segmentData = [0, 1, 2].map(segment => {
        const start = segment * segmentSize;
        const slice = temps.slice(start, start + segmentSize);
        if (!slice.length) return 0;
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        return Number(avg.toFixed(1));
    });

    if (trendBarChart) {
        trendBarChart.destroy();
    }

    trendBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Temperature Window (°C)',
                data: segmentData,
                backgroundColor: ['#0B8A5F', '#0A6E4A', '#064635'],
                borderRadius: 6,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148,163,184,0.2)' },
                    ticks: { color: '#0A0A0A' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#0A0A0A' }
                }
            }
        }
    });
}
