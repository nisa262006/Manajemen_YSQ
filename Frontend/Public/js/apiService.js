// =======================================================
// apiService.js - LAYER API GLOBAL UNTUK SEMUA HALAMAN
// Fungsi ini otomatis menambahkan token dan mempermudah
// pemanggilan endpoint backend.
// =======================================================

const BASE_URL = "http://localhost:5000";

// Ambil token dari localStorage
export function getToken() {
    return localStorage.getItem("token");
}

// =============== GET ===============
export async function apiGet(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        console.error(`GET ${endpoint} Gagal`);
        throw new Error(`GET ${endpoint} gagal`);
    }

    return res.json();
}

// =============== POST ===============
export async function apiPost(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`POST ${endpoint} gagal`);
    return res.json();
}

// =============== PUT ===============
export async function apiPut(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`PUT ${endpoint} gagal`);
    return res.json();
}

// =============== DELETE ===============
export async function apiDelete(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!res.ok) throw new Error(`DELETE ${endpoint} gagal`);
    return res.json();
}
