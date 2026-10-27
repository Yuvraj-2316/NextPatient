function getLoggedInUser() {
    let user = sessionStorage.getItem("loggedInUser");
    if (!user) {
        user = localStorage.getItem("loggedInUser");
    }
    return user ? JSON.parse(user) : null;
}

function handleLogout() {
    sessionStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

// Decides which page the browser shows. The real protection is on the server,
// which checks the token's signature and role on every API request.
function requireRole(allowedRole) {
    let loggedInUser = getLoggedInUser();

    // No login, or an old login saved before tokens were added: log in again
    if (!loggedInUser || !loggedInUser.token) {
        window.location.href = "login.html";
        return;
    }

    if (loggedInUser.role !== allowedRole) {
        alert("You don't have access to this page.");
        window.location.href = "login.html";
        return;
    }
}