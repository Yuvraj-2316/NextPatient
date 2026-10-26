async function handleLogin() {
    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value;

    // The server checks the password and returns the user (without any password)
    let matchedUser;
    try {
        matchedUser = await loginUser(username, password);
    } catch (error) {
        if (error.status === 400 || error.status === 401) {
            document.getElementById("loginError").style.display = "block";
        } else {
            alert("Could not reach the server. Please try again.");
        }
        return;
    }

    let rememberMe = document.getElementById("rememberMe").checked;

    if (rememberMe) {
        localStorage.setItem("loggedInUser", JSON.stringify(matchedUser));
    } else {
        sessionStorage.setItem("loggedInUser", JSON.stringify(matchedUser));
    }

    if (matchedUser.role === "admin") {
        window.location.href = "admin.html";
    }
    else if (matchedUser.role === "doctor") {
        window.location.href = "doctor.html";
    }
    else if (matchedUser.role === "receptionist") {
        window.location.href = "intake.html";
    }
}