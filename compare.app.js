// --- Global variables ---
const API_URL = 'http://127.0.0.1:5000';
let wardsData = [];

// --- Main function: Runs when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    populateWardDropdowns();
    
    document.getElementById('compare-btn').addEventListener('click', handleCompare);
});

async function populateWardDropdowns() {
    const selectA = document.getElementById('ward-a');
    const selectB = document.getElementById('ward-b');
    
    try {
        const response = await fetch(`${API_URL}/api/ward-risk/current`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        wardsData = await response.json();
        wardsData.sort((a, b) => a.ward_name.localeCompare(b.ward_name));
        
        selectA.innerHTML = '<option value="">-- Select Ward A --</option>';
        selectB.innerHTML = '<option value="">-- Select Ward B --</option>';
        
        wardsData.forEach(ward => {
            const optionA = document.createElement('option');
            optionA.value = ward.ward_no;
            optionA.textContent = ward.ward_name;
            selectA.appendChild(optionA);
            
            const optionB = document.createElement('option');
            optionB.value = ward.ward_no;
            optionB.textContent = ward.ward_name;
            selectB.appendChild(optionB);
        });

    } catch (error) {
        console.error("Error fetching ward list:", error);
        selectA.innerHTML = '<option value="">Error</option>';
        selectB.innerHTML = '<option value="">Error</option>';
    }
}

function handleCompare() {
    const wardNoA = document.getElementById('ward-a').value;
    const wardNoB = document.getElementById('ward-b').value;
    
    const wardDataA = wardsData.find(w => w.ward_no == wardNoA);
    const wardDataB = wardsData.find(w => w.ward_no == wardNoB);
    
    updateCompareBox('a', wardDataA);
    updateCompareBox('b', wardDataB);
}

// Make handleCompare globally accessible
window.handleCompare = handleCompare;

function updateCompareBox(boxId, data) {
    const box = document.getElementById(`compare-box-${boxId}`);
    if (!data) {
        box.innerHTML = `
            <h3>Select a Ward</h3>
            <ul>
                <li><strong>Risk Score:</strong> <span>--</span></li>
                <li><strong>Population:</strong> <span>--</span></li>
                <li><strong>Max Temp:</strong> <span>--</span></li>
                <li><strong>Max Humidity:</strong> <span>--</span></li>
                <li><strong>Heat Risk Index:</strong> <span>--</span></li>
            </ul>
        `;
        return;
    }
    
    box.innerHTML = `
        <h3>${data.ward_name}</h3>
        <ul>
            <li><strong>Risk Score:</strong> <span>${data.Vulnerability_Score.toFixed(2)}</span></li>
            <li><strong>Population:</strong> <span>${data.Population.toLocaleString()}</span></li>
            <li><strong>Max Temp:</strong> <span>${data.temperature_max.toFixed(1)}°C</span></li>
            <li><strong>Max Humidity:</strong> <span>${data.humidity_max.toFixed(1)}%</span></li>
            <li><strong>Heat Risk Index:</strong> <span>${data.Heat_Risk_Index.toFixed(2)}</span></li>
        </ul>
    `;
}
