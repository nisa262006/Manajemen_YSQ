const express = require("express");
const request = require("supertest");

// Mock db + auth middleware so we can hit every branch in mecontrollers.js deterministically.
jest.mock("../../src/config/db", () => ({
  query: jest.fn()
}));

jest.mock("../../src/middleware/auth", () => ({
  verifyToken: (req, res, next) => {
    req.user = {
      id_users: Number(req.headers["x-id-users"] || "1"),
      role: String(req.headers["x-role"] || "admin")
    };
    next();
  }
}));

const pool = require("../../src/config/db");
const meroutes = require("../../src/routes/meroutes");

describe("GET /api/me (meroutes) unit coverage", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use("/api/me", meroutes);
  });

  beforeEach(() => {
    pool.query.mockReset();
  });

  test("Profil tidak ditemukan -> 404", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "admin")
      .set("x-id-users", "999");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Profil tidak ditemukan");
  });

  test("role=santri, status != aktif -> 403", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id_santri: 10,
          status: "nonaktif",
          username: "santri1",
          role: "santri"
        }
      ]
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "santri")
      .set("x-id-users", "1");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Akun santri tidak aktif. Hubungi admin.");
  });

  test("role=santri, status=aktif -> 200", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id_santri: 10,
          nis: "NIS001",
          nama: "Santri A",
          status: "aktif",
          username: "santri1",
          role: "santri"
        }
      ]
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "santri")
      .set("x-id-users", "1");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("santri");
    expect(res.body.profile).toEqual(
      expect.objectContaining({
        id_santri: 10,
        nis: "NIS001",
        status: "aktif",
        role: "santri"
      })
    );
  });

  test("role=pengajar success -> 200", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id_pengajar: 1,
          nama: "Pengajar Test",
          username: "pengajar1",
          role: "pengajar"
        }
      ]
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "pengajar")
      .set("x-id-users", "2");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("pengajar");
    expect(res.body.profile.nama).toBe("Pengajar Test");
  });

  test("role=admin success -> 200", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id_admin: 1,
          nama: "Admin Test",
          username: "admin1",
          role: "admin"
        }
      ]
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "admin")
      .set("x-id-users", "3");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("admin");
    expect(res.body.profile.nama).toBe("Admin Test");
  });

  test("catch error -> 500", async () => {
    pool.query.mockRejectedValueOnce(new Error("db fail"));

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "admin")
      .set("x-id-users", "1");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Gagal mengambil data user");
  });
});
