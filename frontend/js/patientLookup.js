// Patient lookup shared by the doctor (Patient Lookup) and admin (Patient History) pages.
// Step 1: one card per patient on the phone number (a family can share a number).
// Step 2: clicking a card shows that patient's visits, earliest first.

const DURATION_LABELS = {
    "acute": "Under 24 hours",
    "short_term": "1-3 days",
    "medium_term": "4-7 days",
    "chronic": "More than a week"
};

// Names and notes are typed by users, so escape them before putting them in HTML
function escapeHtml(text) {
    let div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
}

function formatVisitDate(timestamp) {
    return new Date(timestamp).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function ageGenderText(patient) {
    return `${escapeHtml(patient.age)} ${patient.gender ? "(" + escapeHtml(patient.gender) + ")" : ""}`;
}

async function renderPatientLookup(phone, resultsDiv) {
    resultsDiv.innerHTML = "<p class='empty-role-msg'>Searching...</p>";

    let patients;
    try {
        patients = await getPatientsByPhone(phone);
    } catch (error) {
        resultsDiv.innerHTML = `<p class='empty-role-msg'>${escapeHtml(error.message)}</p>`;
        return;
    }

    resultsDiv.innerHTML = "";

    if (patients.length === 0) {
        resultsDiv.innerHTML = "<p class='empty-role-msg'>No records found for this phone number.</p>";
        return;
    }

    patients.forEach(function (patient) {
        let card = document.createElement("div");
        card.className = "patientCard lookup-card";
        card.tabIndex = 0;
        card.innerHTML = `
            <h3>${escapeHtml(patient.name)}</h3>
            <p><strong>Age/Gender:</strong> ${ageGenderText(patient)}</p>
            <p><strong>Visits:</strong> ${patient.visitCount}</p>
            <p><strong>First visit:</strong> ${formatVisitDate(patient.firstVisit)}</p>
            <p><strong>Last visit:</strong> ${formatVisitDate(patient.lastVisit)}</p>
            <p class="lookup-hint">View history →</p>`;

        card.addEventListener("click", function () {
            renderPatientHistory(patient, phone, resultsDiv);
        });
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter") renderPatientHistory(patient, phone, resultsDiv);
        });

        resultsDiv.appendChild(card);
    });
}

async function renderPatientHistory(patient, phone, resultsDiv) {
    resultsDiv.innerHTML = "<p class='empty-role-msg'>Loading history...</p>";

    let visits;
    try {
        visits = await getPatientHistory(phone, patient.name);
    } catch (error) {
        resultsDiv.innerHTML = `<p class='empty-role-msg'>${escapeHtml(error.message)}</p>`;
        return;
    }

    let wrapper = document.createElement("div");
    wrapper.className = "lookup-history";

    let backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "lookup-back-btn";
    backButton.textContent = "← Back to patients";
    backButton.addEventListener("click", function () {
        renderPatientLookup(phone, resultsDiv);
    });
    wrapper.appendChild(backButton);

    let header = document.createElement("div");
    header.className = "lookup-history-header";
    header.innerHTML = `
        <h3>${escapeHtml(patient.name)}</h3>
        <p>${ageGenderText(patient)} · ${escapeHtml(phone)} · ${visits.length} visit(s), earliest first</p>`;
    wrapper.appendChild(header);

    visits.forEach(function (visit, index) {
        let symptomsText = (visit.symptoms && visit.symptoms.length > 0)
            ? visit.symptoms.join(", ")
            : "None reported";
        let durationText = visit.duration ? DURATION_LABELS[visit.duration] : "Unknown";

        let item = document.createElement("div");
        item.className = "lookup-visit";
        item.innerHTML = `
            <div class="lookup-visit-date">Visit ${index + 1} · ${new Date(visit.servedTime).toLocaleString()}</div>
            <p><strong>Symptoms:</strong> ${escapeHtml(symptomsText)} <span class="lookup-muted">(Duration: ${durationText})</span></p>
            <p><strong>Triage score:</strong> ${visit.triageScore}</p>
            <p><strong>Treatment/Notes:</strong> ${visit.doctorNotes ? escapeHtml(visit.doctorNotes) : "—"}</p>`;
        wrapper.appendChild(item);
    });

    resultsDiv.innerHTML = "";
    resultsDiv.appendChild(wrapper);
}