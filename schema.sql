-- Global Shapers website — D1 schema
-- Each content table keeps an explicit position column so the admin can
-- reorder records, plus a `data` JSON blob holding the full record so the
-- API can return the exact shape the frontend already expects (lossless).

DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS submissions;

CREATE TABLE projects (
  id        TEXT PRIMARY KEY,
  position  INTEGER NOT NULL,
  data      TEXT NOT NULL          -- JSON: full project record
);

CREATE TABLE members (
  id        TEXT PRIMARY KEY,
  position  INTEGER NOT NULL,
  data      TEXT NOT NULL          -- JSON: full member record
);

CREATE TABLE events (
  id        TEXT PRIMARY KEY,
  position  INTEGER NOT NULL,
  data      TEXT NOT NULL          -- JSON: full event record
);

CREATE TABLE submissions (
  id         TEXT PRIMARY KEY,
  timestamp  TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'general',
  message    TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_submissions_timestamp ON submissions(timestamp DESC);
