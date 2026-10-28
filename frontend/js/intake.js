// Set while the form is editing a waiting patient (PUT) instead of adding a new one (POST)
let editingPatientId = null;

// The form checkbox for each symptom name the server stores
const SYMPTOM_CHECKBOXES = {
    "Fever": "fever",
    "Fainting / Loss of Consciousness": "fainting",
    "Chest Pain": "chestPain",
    "Severe Bleeding": "bleeding",
    "Vomiting": "vomiting",
    "Dizziness": "dizziness"
};

async function handleFormsubmit(event) {
    event.preventDefault();

    let name = document.getElementById("name").value.trim()
    let age = parseInt(document.getElementById("age").value);
    let phone = document.getElementById("phone").value.trim();
    let gender = document.getElementById("gender").value;
    let pain = document.getElementById("PainSeverity").value;
    let breathing = document.getElementById("BreathingDifficulty").value;
    let duration = document.getElementById("symptomDuration").value;

    if (name == "") {
        alert("Please enter patient name");
        return;
    }
    if (isNaN(age) || age <= 0 || age > 120) {
        alert("Please enter valid age");
        return;
    }
    if (phone.length !== 10) {
        alert("Please enter a valid 10-digit phone number");
        return;
    }

    let symptomsList = Object.keys(SYMPTOM_CHECKBOXES).filter(function (symptom) {
        return document.getElementById(SYMPTOM_CHECKBOXES[symptom]).checked;
    });

    // The backend calculates the triage score and arrival time (services/triage.js)
    const patientDetails = {
        name: name,
        age: age,
        gender: gender,
        phone: phone,
        pain: Number(pain),
        breathing: Number(breathing),
        symptoms: symptomsList,
        duration: duration
    }

    let wasEditing = editingPatientId !== null;

    try {
        if (wasEditing) {
            await updateQueuePatient(editingPatientId, patientDetails);
        } else {
            await addPatientToQueue(patientDetails);
        }
    } catch (error) {
        alert(error.message);
        return;
    }

    resetIntakeForm();
    await renderQueue();

    // After saving an edit, go back to the queue to see the new position
    if (wasEditing) {
        openIntakeSection("queue");
    }
}

// Empties the form and leaves edit mode
function resetIntakeForm() {
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("gender").value = "";
    document.getElementById("PainSeverity").value = "1";
    document.getElementById("painValue").textContent = "1";
    document.getElementById("BreathingDifficulty").value = "1";
    document.getElementById("breathingValue").textContent = "1";
    Object.values(SYMPTOM_CHECKBOXES).forEach(function (checkboxId) {
        document.getElementById(checkboxId).checked = false;
    });
    document.getElementById("symptomDuration").value = "acute";

    editingPatientId = null;
    setFormMode(false);
}

// Fills the form with a waiting patient's details so the receptionist can fix them
function startEditingPatient(patient) {
    resetIntakeForm();

    document.getElementById("name").value = patient.name;
    document.getElementById("age").value = patient.age;
    document.getElementById("phone").value = patient.phone;
    document.getElementById("gender").value = patient.gender;
    document.getElementById("PainSeverity").value = patient.pain;
    document.getElementById("painValue").textContent = patient.pain;
    document.getElementById("BreathingDifficulty").value = patient.breathing;
    document.getElementById("breathingValue").textContent = patient.breathing;
    (patient.symptoms || []).forEach(function (symptom) {
        let checkboxId = SYMPTOM_CHECKBOXES[symptom];
        if (checkboxId) document.getElementById(checkboxId).checked = true;
    });
    document.getElementById("symptomDuration").value = patient.duration;

    editingPatientId = patient.id;
    setFormMode(true, patient.name);
    openIntakeSection("form");
}

// Switches the form's header and buttons between "add" and "edit"
function setFormMode(isEditing, patientName) {
    let header = document.querySelector("#section-form .workspace-card-header span");
    let submitButton = document.querySelector(".submit-intake-btn");

    header.textContent = isEditing ? `✏️ Editing ${patientName}` : "📋 New Patient Details";
    submitButton.textContent = isEditing ? "Save Changes ✅" : "Add Patient to Queue ➡️";
    getCancelEditButton().style.display = isEditing ? "flex" : "none";
}

// The "Cancel Editing" button, created once below the submit button
function getCancelEditButton() {
    let button = document.getElementById("cancelEditBtn");

    if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.id = "cancelEditBtn";
        button.className = "cancel-edit-btn";
        button.textContent = "Cancel Editing";
        button.style.display = "none";
        button.addEventListener("click", function () {
            resetIntakeForm();
            openIntakeSection("queue");
        });
        document.querySelector(".submit-intake-btn").after(button);
    }

    return button;
}

async function handleRemovePatient(patient) {
    let confirmRemove = window.confirm(`Remove ${patient.name} from the queue? Use this when a patient leaves before being seen.`);
    if (!confirmRemove) return;

    try {
        await removeQueuePatient(patient.id);
    } catch (error) {
        alert(error.message);
    }

    // If this patient was open in the form, stop editing them
    if (editingPatientId === patient.id) {
        resetIntakeForm();
    }
    await renderQueue();
}

// Small icon button used on each queue card
function makeQueueButton(icon, label, onClick) {
    let button = document.createElement("button");
    button.type = "button";
    button.className = "mq-action-btn";
    button.textContent = icon;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", onClick);
    return button;
}

async function renderQueue() {
    let container = document.getElementById("queue_container");
    if (!container) return;

    await autoCallNextIfAvailable();

    container.innerHTML = "";
    let queue = await getQueue();

    let nowServingDiv = document.getElementById("now_serving");
    let currentlyServing = await getCurrentlyServing();

    if (nowServingDiv) {
        if (currentlyServing != null) {
            let sScore = currentlyServing.triageScore;
            let sUrgencyText = "Standard";
            if (sScore >= 80) sUrgencyText = "Critical";
            else if (sScore >= 60) sUrgencyText = "Urgent";
            else if (sScore >= 40) sUrgencyText = "Moderate";
            nowServingDiv.innerHTML = `${currentlyServing.name} <br> <span style="font-size:0.9rem; font-weight:500; color:#b91c1c;">(Priority: ${sUrgencyText})</span>`;
        } else {
            nowServingDiv.innerHTML = `No one is currently waiting`;
        }
    }

    if (queue.length === 0) {
        container.innerHTML = "<p class='empty-role-msg' style='text-align:center;'>The queue is empty.</p>";
        return;
    }

    queue.forEach((patient, index) => {
        let patientCard = document.createElement("div");
        let effectiveScore = getEffectiveScore(patient);
        
        let isEmergency = effectiveScore >= 60;
        patientCard.className = isEmergency ? "modern-queue-item emergency-bg" : "modern-queue-item";

        let urgencyText = "Standard";
        if (effectiveScore >= 80) urgencyText = "Critical";
        else if (effectiveScore >= 60) urgencyText = "Urgent";
        else if (effectiveScore >= 40) urgencyText = "Moderate";

        let scoreHTML = effectiveScore > patient.triageScore
            ? `<span class="mq-score ${isEmergency ? 'danger' : ''}">${urgencyText} ⬆️</span>`
            : `<span class="mq-score ${isEmergency ? 'danger' : ''}">${urgencyText}</span>`;

        let waitMinutes = Math.floor((Date.now() - patient.arrivalTime) / 60000);
        let waitText = waitMinutes < 1 ? "Just arrived" : `${waitMinutes} min ago`;

        patientCard.innerHTML = `
            <div class="mq-rank">${index + 1}</div>
            <div class="mq-info">
                <strong>${patient.name}</strong> <span style="font-size:0.85rem; color:var(--text-muted); margin-left: 6px;">${patient.age}${patient.gender ? patient.gender.substring(0,1) : ''}</span>
                <br><span>Waiting: ${waitText}</span>
            </div>
            <div class="mq-side">
                ${scoreHTML}
                <div class="mq-actions"></div>
            </div>
        `;

        let actions = patientCard.querySelector(".mq-actions");
        actions.appendChild(makeQueueButton("✏️", `Edit ${patient.name}`, function () {
            startEditingPatient(patient);
        }));
        actions.appendChild(makeQueueButton("🗑️", `Remove ${patient.name}`, function () {
            handleRemovePatient(patient);
        }));

        container.appendChild(patientCard);
    });
}

// Initial Render
renderQueue();

// Anti-Starvation Heartbeat: every 10 seconds, fetch the queue again.
// The server re-sorts it with the latest wait-time bonus on every request.
setInterval(async () => {
    if (document.getElementById("queue_container")) {
        await renderQueue();
    }
}, 10000);

// Input Slider Listeners
let painSlider = document.getElementById("PainSeverity");
if (painSlider) {
    painSlider.addEventListener("input", function () {
        document.getElementById("painValue").textContent = this.value;
    });
}

let breathingSlider = document.getElementById("BreathingDifficulty");
if (breathingSlider) {
    breathingSlider.addEventListener("input", function () {
        document.getElementById("breathingValue").textContent = this.value;
    });
}
const intakeSectionTitles = {
    'form': 'Patient Registration',
    'queue': 'Live Waiting Queue'
};

function showIntakeSection(sectionId, clickedLink) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + sectionId).style.display = 'block';
    document.getElementById('pageTitle').textContent = intakeSectionTitles[sectionId];
    document.querySelectorAll('.sidebar-nav a:not(.logout-btn)').forEach(a => a.classList.remove('active'));
    clickedLink.classList.add('active');
}

// Opens a section from code (not a click), highlighting its sidebar link
function openIntakeSection(sectionId) {
    let link = document.querySelector(`.sidebar-nav a[onclick*="'${sectionId}'"]`);
    showIntakeSection(sectionId, link);
}