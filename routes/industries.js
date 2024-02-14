const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.industry, ARRAY_AGG(c.code) AS company_codes
         FROM industries AS i
         LEFT JOIN company_industries AS ci ON i.code = ci.ind_code
         LEFT JOIN companies AS c ON ci.comp_code = c.code
         GROUP BY i.industry`
    );

    const industries = results.rows.map((row) => ({
      [row.industry]: row.company_codes,
    }));

    return res.json({ industries });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const results = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`,
      [code, industry]
    );

    return res.status(201).json({ industry: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/:ind_code", async (req, res, next) => {
  try {
    const { ind_code } = req.params;
    const { comp_code } = req.body;

    const results = await db.query(
      `INSERT INTO company_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING *`,
      [comp_code, ind_code]
    );

    return res.status(201).json({ association: results.rows[0] }); // Assuming you want to return the inserted row
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
