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

//**********************************************************************
// /companies tests:

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
      name: "Tesla Motors",
      description: "Electric vehicle manufacturer",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "teslamotors",
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

//**********************************************************************
// /invoices tests:

describe("GET /invoices", () => {
  test("Get a list of all invoices", async () => {
    const res = await request(app).get(`/invoices`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          id: testInvoice.id,
          comp_code: testInvoice.comp_code,
          amt: testInvoice.amt,
          paid: testInvoice.paid,
          add_date: testInvoice.add_date.toJSON(),
          paid_date: testInvoice.paid_date,
        },
      ],
    });
  });
});

describe("GET /invoices/:id", () => {
  test("Get a specific invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: testInvoice.amt,
        paid: testInvoice.paid,
        add_date: testInvoice.add_date.toJSON(),
        paid_date: testInvoice.paid_date,
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Cannot find invoice with the id of 0",
        status: 404,
      },
    });
  });
});

describe("POST /invoices", () => {
  test("Creates a single invoice", async () => {
    const res = await request(app).post("/invoices").send({
      comp_code: "testco",
      amt: 99.99,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id + 1,
        comp_code: "testco",
        amt: 99.99,
        paid: false,
        add_date: testInvoice.add_date.toJSON(),
        paid_date: null,
      },
    });
  });
});

describe("PUT /invoices/:id", () => {
  test("Updates a single invoice without changing 'paid' property (no change in paid date)", async () => {
    const res = await request(app).put(`/invoices/${testInvoice.id}`).send({
      amt: 2222,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: 2222,
        paid: testInvoice.paid,
        add_date: testInvoice.add_date.toJSON(),
        paid_date: testInvoice.paid_date,
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).put(`/invoices/0`).send({
      amt: 9999,
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Cannot find invoice with the id of 0",
        status: 404,
      },
    });
  });
});

describe("PUT /invoices/:id - setting paid property to true", () => {
  test("Updates a single invoice, changing 'paid' property to true (adds a date to the 'paid_date' property)", async () => {
    const res = await request(app).put(`/invoices/${testInvoice.id}`).send({
      amt: 2222,
      paid: true,
    });
    const updatedRes = await db.query(`SELECT * FROM invoices WHERE id=$1`, [
      testInvoice.id,
    ]);
    const updatedInvoice = updatedRes.rows[0];

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: 2222,
        paid: true,
        add_date: testInvoice.add_date.toJSON(),
        paid_date: updatedInvoice.paid_date.toJSON(),
      },
    });
  });
});

describe("PUT /invoices/:id = setting paid property to false", () => {
  test("Updates a single invoice, changing 'paid' property to true at first, then back to false (sets 'paid_date' property to null)", async () => {
    // Update paid property to true then check resulting database entry
    const trueRes = await request(app).put(`/invoices/${testInvoice.id}`).send({
      amt: 2222,
      paid: true,
    });
    const updatedResTrue = await db.query(
      `SELECT * FROM invoices WHERE id=$1`,
      [testInvoice.id]
    );
    const updatedInvoiceTrue = updatedResTrue.rows[0];
    expect(trueRes.statusCode).toBe(200);
    expect(testInvoice.id).toEqual(updatedInvoiceTrue.id);
    expect(trueRes.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: 2222,
        paid: true,
        add_date: testInvoice.add_date.toJSON(),
        paid_date: updatedInvoiceTrue.paid_date.toJSON(),
      },
    });

    // Update paid property back to false then check resulting database entry
    const falseRes = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({
        amt: 3333,
        paid: false,
      });
    const updatedResFalse = await db.query(
      `SELECT * FROM invoices WHERE id=$1`,
      [testInvoice.id]
    );
    const updatedInvoiceFalse = updatedResFalse.rows[0];
    expect(falseRes.statusCode).toBe(200);
    expect(testInvoice.id).toEqual(updatedInvoiceFalse.id);
    expect(falseRes.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: 3333,
        paid: false,
        add_date: testInvoice.add_date.toJSON(),
        paid_date: null,
      },
    });
  });
});

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: `Deleted invoice ${testInvoice.id}` });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).delete(`/invoices/0`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Cannot find invoice with the id of 0",
        status: 404,
      },
    });
  });
});
