const BASE_URL = "http://localhost:5000";

// Ambil token
export function getToken() {
    return localStorage.getItem("token");
}

// Header otomatis
function buildHeaders() {
    const token = getToken();
    const headers = { "Content-Type": "application/json" };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    return headers;
}

/* ===========================
   GET
=========================== */
export async function apiGet(endpoint) {
    const res = await fetch(BASE_URL + endpoint, {
        method: "GET",
        headers: buildHeaders()
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        console.error(`GET ${endpoint} gagal:`, data);
        throw data;
    }

    return data;
}

/* ===========================
   POST
=========================== */
export async function apiPost(endpoint, body) {
    const res = await fetch(BASE_URL + endpoint, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        console.error(`POST ${endpoint} gagal:`, data);
        throw data;
    }

    return data;
}

/* ===========================
   PUT
=========================== */
export async function apiPut(endpoint, body) {
    const res = await fetch(BASE_URL + endpoint, {
        method: "PUT",
        headers: buildHeaders(),
        body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        console.error(`PUT ${endpoint} gagal:`, data);
        throw data;
    }

    return data;
}

/* ===========================
   DELETE
=========================== */
export async function apiDelete(endpoint) {
    const res = await fetch(BASE_URL + endpoint, {
        method: "DELETE",
        headers: buildHeaders()
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        console.error(`DELETE ${endpoint} gagal:`, data);
        throw data;
    }

    return data;
}
