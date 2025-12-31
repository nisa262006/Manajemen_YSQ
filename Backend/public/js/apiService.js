const BASE_URL = "/api";

/* ===========================
   TOKEN
=========================== */
export function getToken() {
  return localStorage.getItem("token");
}

/* ===========================
   HEADER BUILDER
=========================== */
function buildHeaders(isFormData = false) {
  const token = getToken();
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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
  const res = await fetch(BASE_URL + endpoint, options);

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.error(endpoint, json);
    throw json;
  }

  return normalizeResponse(json);
}

/* ===========================
   API METHODS
=========================== */
export const apiGet = (endpoint) =>
  request(endpoint, {
    method: "GET",
    headers: buildHeaders()
  });

export const apiPost = (endpoint, body, isFormData = false) =>
  request(endpoint, {
    method: "POST",
    headers: buildHeaders(isFormData),
    body: isFormData ? body : JSON.stringify(body)
  });

export const apiPut = (endpoint, body) =>
  request(endpoint, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });

export const apiDelete = (endpoint) =>
  request(endpoint, {
    method: "DELETE",
    headers: buildHeaders()
  });

/*===============================================================*/

export async function apiPostForm(endpoint, formData) {
  const token = getToken();

  const res = await fetch(BASE_URL + endpoint, {
    method: "POST", // Tadi salah di sini (ada backslash)
    headers: { 
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw json;
  return normalizeResponse(json);
}