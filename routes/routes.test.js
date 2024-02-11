process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('testco', 'Test Co.', 'Software testing services') RETURNING code, name, description`
  );
  testCompany = compResult.rows[0];
  const invResult = await db.query(
    ` INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('testco', 600.50, false, null) RETURNING *`
  );
  testInvoice = invResult.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of all companies", async () => {
    const res = await request(app).get(`/companies`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("Get a specific company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        invoices: [testInvoice.id],
      },
    });
    expect(res.body.company.invoices[0]).toEqual(testInvoice.id);
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/nothere`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Cannot find company with the code of nothere",
        status: 404,
      },
    });
  });
});

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const res = await request(app).post("/companies").send({
      code: "tesla",
      name: "Tesla Motors",
      description: "Electric vehicle manufacturer",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "tesla",
        name: "Tesla Motors",
        description: "Electric vehicle manufacturer",
      },
    });
  });
});

describe("PUT /companies/:code", () => {
  test("Updates a single company", async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({
      name: "Test Co. Inc.",
      description: "Same Test Co., now incorporated!",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: "Test Co. Inc.",
        description: "Same Test Co., now incorporated!",
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).put(`/companies/nothere`).send({
      name: "Test Co. Inc.",
      description: "Same Test Co., now incorporated!",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Cannot find company with the code of nothere",
        status: 404,
      },
    });
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: `Deleted ${testCompany.code}` });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).delete(`/companies/nothere`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Cannot find company with the code of nothere",
        status: 404,
      },
    });
  });
});
