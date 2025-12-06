const BASE_URL = "http://localhost:5000";

// Ambil token dari localStorage
export function getToken() {
    return localStorage.getItem("token");
}

// Membuat header dinamis
function buildHeaders() {
    const token = getToken();
    const headers = { "Content-Type": "application/json" };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}

// =============== GET ===============
export async function apiGet(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: buildHeaders()
    });

    if (!res.ok) {
        console.error(`GET ${endpoint} gagal`);
        throw await res.json();
    }

    return res.json();
}

// =============== POST ===============
export async function apiPost(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        console.error(`POST ${endpoint} gagal`);
        throw await res.json();
    }

    return res.json();
}

// =============== PUT ===============
export async function apiPut(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: buildHeaders(),
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        console.error(`PUT ${endpoint} gagal`);
        throw await res.json();
    }

    return res.json();
}

// =============== DELETE ===============
export async function apiDelete(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: buildHeaders()
    });

    if (!res.ok) {
        console.error(`DELETE ${endpoint} gagal`);
        throw await res.json();
    }

    return res.json();
}
