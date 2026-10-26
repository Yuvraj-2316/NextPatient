// ===== Doctor page rendering =====

function updateDoctorName() {
    let loggedInUser = getLoggedInUser();
    if (loggedInUser && loggedInUser.username) {
        let nameDisplay = document.getElementById("doctorNameDisplay");
        if (nameDisplay) {
            nameDisplay.textContent = `Dr. ${loggedInUser.username.charAt(0).toUpperCase() + loggedInUser.username.slice(1)}`;
        }
    }
}
updateDoctorName();

async function renderDoctorView() {
    let workspaceContent = document.getElementById("doctorWorkspaceContent");
    if (!workspaceContent) return;

    let currentlyServing = await getCurrentlyServing();

    if (currentlyServing == null) {
        let stats = await getTodaysStats();

        workspaceContent.innerHTML = `
            <div class="doctor-empty" style="height: auto; margin-top: 4rem;">
                <div class="doctor-empty-icon" style="font-size: 3rem; margin-bottom: 0;">🏥</div>
                <h2 style="margin-bottom: 2rem;">No Patients Waiting</h2>
                
                <div class="dashboard-card" style="width: 100%; max-width: 600px; text-align: left;">
                    <div class="workspace-card-header" style="justify-content: center;">
                        <span>📊 Today's Clinic Summary</span>
                    </div>
                    <div class="workspace-card-body">
                        <div class="patient-meta-grid" style="grid-template-columns: 1fr 1fr 1fr; margin-bottom: 0;">
                            <div class="meta-item" style="text-align: center;">
                                <span>Total Served</span>
                                <strong style="font-size: 1.5rem;">${stats.totalServedToday}</strong>
                            </div>
                            <div class="meta-item" style="text-align: center;">
                                <span>In Queue</span>
                                <strong style="font-size: 1.5rem;">${stats.currentlyWaiting}</strong>
                            </div>
                            <div class="meta-item" style="text-align: center;">
                                <span>Emergencies</span>
                                <strong style="font-size: 1.5rem; color: var(--danger);">${stats.emergencyCount}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // If there is a patient, fetch their history first
    // Only this patient's visits, not other family members on the same phone
    let pastVisits = await getPatientHistory(currentlyServing.phone, currentlyServing.name);
    pastVisits.sort((a, b) => b.servedTime - a.servedTime);

    // Build Symptoms tags
    let todaysSymptoms = (currentlyServing.symptoms && currentlyServing.symptoms.length > 0)
        ? currentlyServing.symptoms.map(s => `<span class="symptom-tag">${s}</span>`).join("")
        : "<span class='symptom-tag' style='background:#e5e7eb; color:#374151;'>None reported</span>";

    // Build History HTML
    let historyHTML = "";
    if (pastVisits.length === 0) {
        historyHTML = "<p class='empty-role-msg' style='padding:1rem;'>No previous visits found.</p>";
    } else {
        historyHTML = pastVisits.map(visit => {
            let symptomsText = (visit.symptoms && visit.symptoms.length > 0)
                ? visit.symptoms.join(", ")
                : "None reported";
            return `
            <div class="history-item">
                <div class="date">${new Date(visit.servedTime).toLocaleString()}</div>
                <div class="details">
                    <p><strong>Symptoms:</strong> ${symptomsText}</p>
                    <p><strong>Treatment:</strong> ${visit.doctorNotes ? visit.doctorNotes : "—"}</p>
                </div>
            </div>`;
        }).join("");
    }

    // Render Dual-Column Layout
    workspaceContent.innerHTML = `
        <div class="workspace-grid">
            <!-- Left Column: Active Patient -->
            <div class="workspace-card">
                <div class="workspace-card-header">
                    <span>🔴 Currently Serving</span>
                </div>
                <div class="workspace-card-body">
                    <h3>${currentlyServing.name}</h3>
                    <div class="patient-meta-grid">
                        <div class="meta-item">
                            <span>Age / Gender</span>
                            <strong>${currentlyServing.age} ${currentlyServing.gender ? currentlyServing.gender.substring(0, 1) : ''}</strong>
                        </div>
                        <div class="meta-item">
                            <span>Phone Number</span>
                            <strong>${currentlyServing.phone}</strong>
                        </div>
                        <div class="meta-item">
                            <span>Arrival Time</span>
                            <strong>${new Date(currentlyServing.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </div>
                        <div class="meta-item">
                            <span>Triage Score</span>
                            <strong style="color:var(--danger);">${currentlyServing.triageScore}</strong>
                        </div>
                    </div>
                    
                    <h4 style="margin-top:0; color:var(--text); font-size:0.9rem; text-transform:uppercase;">Reported Symptoms</h4>
                    <div class="symptoms-tags">
                        ${todaysSymptoms}
                    </div>

                    <h4 style="margin-top:0; color:var(--text); font-size:0.9rem; text-transform:uppercase;">Treatment & Notes</h4>
                    <textarea id="doctorNotes" class="treatment-textarea" placeholder="Enter treatment given, medicines prescribed, or clinical notes here..."></textarea>
                    
                    <button onclick="handleServePatient()" style="width:100%; font-size:1.1rem;">✅ Mark as Treated & Call Next</button>
                </div>
            </div>

            <!-- Right Column: Patient History -->
            <div class="workspace-card">
                <div class="workspace-card-header">
                    <span>📋 Patient History</span>
                </div>
                <div class="workspace-card-body">
                    <div class="history-timeline">
                        ${historyHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}
renderDoctorView();


async function handleServePatient() {
    let notesBox = document.getElementById("doctorNotes");
    let doctorNotes = notesBox ? notesBox.value.trim() : "";

    // One request: the server saves notes, sets servedTime and moves the patient to history
    try {
        await completeCurrentVisit(doctorNotes);
    } catch (error) {
        alert(error.message);
    }

    await autoCallNextIfAvailable();
    await renderDoctorView();
}

// ===== Sidebar Navigation =====
const doctorSectionTitles = {
    workstation: 'Workstation',
    history: 'Patient Lookup'
};

function showDoctorSection(sectionId, clickedLink) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    let titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = doctorSectionTitles[sectionId];

    document.querySelectorAll('.sidebar-nav a:not(.logout-btn)').forEach(a => a.classList.remove('active'));
    if (clickedLink) clickedLink.classList.add('active');

    return false;
}

// ===== Patient Lookup (Doctor Search) =====
async function handleDoctorSearch() {
    let searchPhoneInput = document.getElementById("searchPhoneDoctor");
    if (!searchPhoneInput) return;

    let searchPhone = searchPhoneInput.value.trim();
    if (searchPhone.length !== 10) {
        alert("Please enter a valid 10-digit phone number");
        return;
    }

    // Patient cards first; clicking one opens that patient's history (patientLookup.js)
    await renderPatientLookup(searchPhone, document.getElementById("searchResultsDoctor"));
}