const express = require("express");
const request = require("supertest");

// Mock db + auth middleware so we can hit every branch in meroutes.js deterministically.
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

  test("baseUser rowCount=0 -> 404", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes("FROM users")) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "admin")
      .set("x-id-users", "999");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User tidak ditemukan");
  });

  test("role=santri, santri query rowCount=0 -> 404", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes("FROM users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id_users: 1,
              email: "santri@example.com",
              username: "santri1",
              role: "santri",
              status_user: "aktif"
            }
          ]
        };
      }
      if (String(sql).includes("FROM santri")) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "santri")
      .set("x-id-users", "1");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Data santri tidak ditemukan");
  });

  test("role=santri, status != aktif -> 403", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes("FROM users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id_users: 1,
              email: "santri@example.com",
              username: "santri1",
              role: "santri",
              status_user: "aktif"
            }
          ]
        };
      }
      if (String(sql).includes("FROM santri")) {
        return {
          rowCount: 1,
          rows: [{ status: "nonaktif" }]
        };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "santri")
      .set("x-id-users", "1");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Akun santri tidak aktif");
  });

  test("role=santri, status=aktif -> 200 + profile includes santri fields", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes("FROM users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id_users: 1,
              email: "santri@example.com",
              username: "santri1",
              role: "santri",
              status_user: "aktif"
            }
          ]
        };
      }
      if (String(sql).includes("FROM santri")) {
        return {
          rowCount: 1,
          rows: [
            {
              id_santri: 10,
              nis: "NIS001",
              nama: "Santri A",
              kategori: "Tahfidz",
              no_wa: "0812",
              email: "santri@example.com",
              tempat_lahir: "Bogor",
              tanggal_lahir: "2001-01-01",
              status: "aktif"
            }
          ]
        };
      }
      return { rowCount: 0, rows: [] };
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
        id_users: 1,
        role: "santri",
        id_santri: 10,
        nis: "NIS001",
        status: "aktif"
      })
    );
  });

  test("role=pengajar, pengajar query rowCount=0 -> 200 with profile roleData empty", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes("FROM users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id_users: 2,
              email: "pengajar@example.com",
              username: "pengajar1",
              role: "pengajar",
              status_user: "aktif"
            }
          ]
        };
      }
      if (String(sql).includes("FROM pengajar")) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "pengajar")
      .set("x-id-users", "2");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("pengajar");
    expect(res.body.profile).toEqual(
      expect.objectContaining({
        id_users: 2,
        role: "pengajar"
      })
    );
    // roleData should be {} so pengajar-specific fields won't exist
    expect(res.body.profile).not.toHaveProperty("id_pengajar");
  });

  test("role=admin, admin query rowCount=0 -> 200 with profile roleData empty", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes("FROM users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id_users: 3,
              email: "admin@example.com",
              username: "admin1",
              role: "admin",
              status_user: "aktif"
            }
          ]
        };
      }
      if (String(sql).includes("FROM admin")) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "admin")
      .set("x-id-users", "3");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("admin");
    expect(res.body.profile).toEqual(
      expect.objectContaining({
        id_users: 3,
        role: "admin"
      })
    );
    expect(res.body.profile).not.toHaveProperty("id_admin");
  });

  test("catch error -> 500", async () => {
    pool.query.mockRejectedValueOnce(new Error("db fail"));

    const res = await request(app)
      .get("/api/me")
      .set("x-role", "admin")
      .set("x-id-users", "1");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Server error");
  });
});
