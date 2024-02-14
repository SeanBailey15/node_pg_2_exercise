DROP DATABASE IF EXISTS biztime_test;
CREATE DATABASE biztime_test;
\c biztime_test;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE industries (
  code text PRIMARY KEY,
  industry text NOT NULL UNIQUE
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies (code) ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK (amt > (0)::double precision)
);

CREATE TABLE company_industries (
  comp_code text NOT NULL REFERENCES companies (code) ON DELETE CASCADE,
  ind_code text NOT NULL REFERENCES industries (code) ON DELETE CASCADE,
  PRIMARY KEY(comp_code, ind_code)
);