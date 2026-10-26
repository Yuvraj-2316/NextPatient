async function handleAdminSignup() {
    let adminExists = await checkAdminExists();

    if (adminExists) {
        document.getElementById("signupBlockedMessage").style.display = "block";
        return;
    }

    let username = document.getElementById("signupUsername").value.trim();
    let password = document.getElementById("signupPassword").value;

    if (username === "") {
        alert("Please enter a username");
        return;
    }
    if (password === "") {
        alert("Please enter a password");
        return;
    }

    // The server hashes the password and blocks signup if an admin already exists
    try {
        await registerAdmin(username, password);
    } catch (error) {
        if (error.status === 403) {
            document.getElementById("signupBlockedMessage").style.display = "block";
        } else {
            alert(error.message);
        }
        return;
    }

    alert("Admin account created! Redirecting to login.");
    window.location.href = "login.html";
}