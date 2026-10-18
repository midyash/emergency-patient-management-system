
const API = "https://emergency-patient-management-system.onrender.com/api";

const patientRows = document.getElementById("patientRows");
const historyRows = document.getElementById("historyRows");

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
    }

    return data;
}

function levelText(level) {
    const names = {
        1: "Critical",
        2: "Urgent",
        3: "Normal"
    };

    return names[level] || "Unknown";
}

function statusBadge(status) {
    const className = {
        Waiting: "status-waiting",
        Treated: "status-treated",
        Cancelled: "status-cancelled"
    }[status] || "status-cancelled";

    return `<span class="status ${className}">${escapeHtml(status)}</span>`;
}

function patientRow(patient) {
    const id = Number(patient.patient_id);
    const level = Number(patient.emergency_level);

    let action = "";

    if (patient.status === "Waiting") {
        action = `<button class="small-btn cancel-btn"
                    onclick="cancelPatient(${id})">Cancel</button>`;
    }

    return `
        <tr>
            <td>
                <span class="patient-name">${escapeHtml(patient.name)}</span>
                <span class="patient-symptoms">ID: ${id} · Age: ${Number(patient.age)}</span>
            </td>
            <td>
                <span class="level level-${level}">
                    L${level} · ${levelText(level)}
                </span>
            </td>
            <td>${statusBadge(patient.status)}</td>
            <td>${action}</td>
        </tr>
    `;
}

async function loadPatients() {
    try {
        const patients = await request(`${API}/patients`);

        document.getElementById("totalCount").textContent = patients.length;
        document.getElementById("waitingCount").textContent =
            patients.filter(p => p.status === "Waiting").length;
        document.getElementById("treatedCount").textContent =
            patients.filter(p => p.status === "Treated").length;
        document.getElementById("criticalCount").textContent =
            patients.filter(p =>
                p.status === "Waiting" && p.emergency_level === 1
            ).length;

        const waiting = patients
            .filter(p => p.status === "Waiting")
            .sort((a, b) =>
                a.emergency_level - b.emergency_level ||
                a.patient_id - b.patient_id
            );

        const otherPatients = patients.filter(p => p.status !== "Waiting");

        const ordered = [...waiting, ...otherPatients];

        patientRows.innerHTML = ordered.length
            ? ordered.map(patientRow).join("")
            : '<tr><td colspan="4">No patient records yet.</td></tr>';

        await loadHistory();
    } catch (error) {
        patientRows.innerHTML =
            `<tr><td colspan="4">${escapeHtml(error.message)}. Is the Python server running?</td></tr>`;
    }
}

async function loadHistory() {
    try {
        const history = await request(`${API}/history`);

        historyRows.innerHTML = history.length
            ? history.slice().reverse().map(patient => `
                <tr>
                    <td>${Number(patient.patient_id)}</td>
                    <td>${escapeHtml(patient.name)}</td>
                    <td>
                        <span class="level level-${Number(patient.emergency_level)}">
                            L${Number(patient.emergency_level)} ·
                            ${levelText(patient.emergency_level)}
                        </span>
                    </td>
                    <td>${escapeHtml(patient.symptoms)}</td>
                </tr>
            `).join("")
            : '<tr><td colspan="4">No treatments recorded yet.</td></tr>';
    } catch (error) {
        historyRows.innerHTML =
            `<tr><td colspan="4">${escapeHtml(error.message)}</td></tr>`;
    }
}

document.getElementById("patientForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("formMessage");
    message.textContent = "Registering patient...";

    const patient = {
        name: document.getElementById("name").value.trim(),
        age: Number(document.getElementById("age").value),
        emergency_level: Number(document.getElementById("level").value),
        symptoms: document.getElementById("symptoms").value.trim()
    };

    try {
        const result = await request(`${API}/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patient)
        });

        message.textContent =
            `Patient registered successfully. ID: ${result.patient_id}`;

        event.target.reset();
        document.getElementById("level").value = "2";

        await loadPatients();
    } catch (error) {
        message.textContent = `Registration failed: ${error.message}`;
    }
});

async function searchPatient() {
    const input = document.getElementById("searchId");
    const message = document.getElementById("searchMessage");
    const id = input.value.trim();

    if (!id || Number(id) < 1) {
        message.textContent = "Enter a valid patient ID.";
        return;
    }

    try {
        const patient = await request(`${API}/patients/${Number(id)}`);

        message.textContent =
            `Found: ${patient.name} · ID ${patient.patient_id} · ` +
            `${levelText(patient.emergency_level)} · ${patient.status}`;

        const rows = Array.from(patientRows.querySelectorAll("tr"));
        rows.forEach(row => row.style.outline = "");

        const match = rows.find(row =>
            row.cells[0]?.textContent.includes(`ID: ${patient.patient_id} ·`)
        );

        if (match) {
            match.style.outline = "2px solid #4386e8";
            match.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    } catch (error) {
        message.textContent = error.message;
    }
}

async function cancelPatient(id) {
    if (!confirm(`Cancel registration for patient ${id}?`)) {
        return;
    }

    try {
        const result = await request(`${API}/patients/${id}`, {
            method: "DELETE"
        });

        document.getElementById("formMessage").textContent = result.message;
        await loadPatients();
    } catch (error) {
        document.getElementById("formMessage").textContent =
            `Cancellation failed: ${error.message}`;
    }
}

async function treatNext() {
    const message = document.getElementById("treatMessage");
    message.textContent = "Processing...";

    try {
        const result = await request(`${API}/treat-next`, {
            method: "POST"
        });

        message.textContent =
            `Treatment recorded for ${result.patient.name} (ID: ${result.patient.patient_id}).`;

        await loadPatients();
    } catch (error) {
        message.textContent = error.message;
    }
}

loadPatients();
