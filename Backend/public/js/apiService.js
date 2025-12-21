const BASE_URL = "/api";

/* ===========================
   TOKEN
=========================== */
export function getToken() {
  return localStorage.getItem("token");
}

function buildHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/* ===========================
   NORMALIZER
=========================== */
function normalizeResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return data;
}

/* ===========================
   REQUEST
=========================== */
async function request(endpoint, options = {}) {
  const res = await fetch(BASE_URL + endpoint, {
    headers: buildHeaders(),
    ...options
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.error(endpoint, json);
    throw json;
  }

  return normalizeResponse(json);
}

export const apiGet = (endpoint) =>
  request(endpoint, { method: "GET" });

export const apiPost = (endpoint, body) =>
  request(endpoint, {
    method: "POST",
    body: JSON.stringify(body)
  });

export const apiPut = (endpoint, body) =>
  request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body)
  });

export const apiDelete = (endpoint) =>
  request(endpoint, { method: "DELETE" });
