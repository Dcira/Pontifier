INSERT INTO colleges (name, code) VALUES
  ('College of Health Sciences', 'COHES'),
  ('College of Engineering and Technology', 'COETEC'),
  ('College of Pure and Applied Sciences', 'COPAS'),
  ('College of Agriculture and Natural Resources', 'COANRE'),
  ('College of Humanities and Social Sciences', 'COHRED');

INSERT INTO users (name, email, password, role, college_id, is_first_login, is_active, created_by)
VALUES (
  'Javaas Abich',
  'admin@campaign.com',
  '$2b$12$A2XmAo6/LKr8F4AECjLEg.3wEM5iypYkxm4ISW8e2e0VXA6L.H47q',
  'admin',
  NULL,
  FALSE,
  TRUE,
  NULL
);
