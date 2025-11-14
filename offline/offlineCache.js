// Simple Offline Cache for Notes, GPA Calculator History and Daily Tasks

export function saveOfflineData(key, data) {
    try {
        const jsonData = JSON.stringify(data);
        localStorage.setItem(key, jsonData);
        return true;
    } catch (error) {
        console.error("Error saving offline data:", error);
        return false;
    }
}

export function loadOfflineData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error loading offline data:", error);
        return null;
    }
}

export function isOffline() {
    return !navigator.onLine;
}

// Listen to network changes
window.addEventListener("online", () => {
    console.log("Back Online");
});

window.addEventListener("offline", () => {
    console.log("You are Offline — using cached data");
});

