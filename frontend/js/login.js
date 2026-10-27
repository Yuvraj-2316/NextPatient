async function handleLogin() {
    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value;

    // The server checks the password and returns { token, user } (never the password)
    let result;
    try {
        result = await loginUser(username, password);
    } catch (error) {
        if (error.status === 400 || error.status === 401) {
            document.getElementById("loginError").style.display = "block";
        } else {
            alert("Could not reach the server. Please try again.");
        }
        return;
    }

    // Saved together so every page knows who is logged in,
    // and api.js can send the token with each request
    let loggedInUser = { ...result.user, token: result.token };

    let rememberMe = document.getElementById("rememberMe").checked;

    if (rememberMe) {
        localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
    } else {
        sessionStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
    }

    if (loggedInUser.role === "admin") {
        window.location.href = "admin.html";
    }
    else if (loggedInUser.role === "doctor") {
        window.location.href = "doctor.html";
    }
    else if (loggedInUser.role === "receptionist") {
        window.location.href = "intake.html";
    }
}