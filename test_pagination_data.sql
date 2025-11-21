-- Datos de prueba para paginación de carpetas de empleados

-- Insertar empresas de prueba
INSERT INTO companies (id, name, created_at, updated_at) VALUES
(gen_random_uuid(), 'Empresa A', NOW(), NOW()),
(gen_random_uuid(), 'Empresa B', NOW(), NOW()),
(gen_random_uuid(), 'Empresa C', NOW(), NOW()),
(gen_random_uuid(), 'Empresa D', NOW(), NOW()),
(gen_random_uuid(), 'Empresa E', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insertar empleados de prueba
INSERT INTO employees (id, email, employee_name, company_id, employee_department, employee_position, employee_phone, employee_level, created_at, updated_at) VALUES
(gen_random_uuid(), 'test1@empresa.com', 'Juan Pérez', (SELECT id FROM companies WHERE name = 'Empresa A' LIMIT 1), 'IT', 'Developer', '+56912345678', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test2@empresa.com', 'María González', (SELECT id FROM companies WHERE name = 'Empresa A' LIMIT 1), 'HR', 'Manager', '+56912345679', 'Manager', NOW(), NOW()),
(gen_random_uuid(), 'test3@empresa.com', 'Carlos López', (SELECT id FROM companies WHERE name = 'Empresa A' LIMIT 1), 'Sales', 'Sales Rep', '+56912345680', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test4@empresa.com', 'Ana Martín', (SELECT id FROM companies WHERE name = 'Empresa A' LIMIT 1), 'Marketing', 'Designer', '+56912345681', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test5@empresa.com', 'Pedro Sánchez', (SELECT id FROM companies WHERE name = 'Empresa A' LIMIT 1), 'Finance', 'Analyst', '+56912345682', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test6@empresa.com', 'Laura Rodríguez', (SELECT id FROM companies WHERE name = 'Empresa B' LIMIT 1), 'IT', 'Developer', '+56912345683', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test7@empresa.com', 'Miguel Torres', (SELECT id FROM companies WHERE name = 'Empresa B' LIMIT 1), 'Operations', 'Coordinator', '+56912345684', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test8@empresa.com', 'Carmen Jiménez', (SELECT id FROM companies WHERE name = 'Empresa B' LIMIT 1), 'Legal', 'Lawyer', '+56912345685', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test9@empresa.com', 'José Moreno', (SELECT id FROM companies WHERE name = 'Empresa B' LIMIT 1), 'IT', 'DevOps', '+56912345686', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test10@empresa.com', 'Isabel Vargas', (SELECT id FROM companies WHERE name = 'Empresa B' LIMIT 1), 'Customer Service', 'Agent', '+56912345687', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test11@empresa.com', 'Francisco Ruiz', (SELECT id FROM companies WHERE name = 'Empresa C' LIMIT 1), 'Sales', 'Manager', '+56912345688', 'Manager', NOW(), NOW()),
(gen_random_uuid(), 'test12@empresa.com', 'Elena Castro', (SELECT id FROM companies WHERE name = 'Empresa C' LIMIT 1), 'HR', 'Recruiter', '+56912345689', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test13@empresa.com', 'Roberto Díaz', (SELECT id FROM companies WHERE name = 'Empresa C' LIMIT 1), 'IT', 'Architect', '+56912345690', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test14@empresa.com', 'Patricia Herrera', (SELECT id FROM companies WHERE name = 'Empresa C' LIMIT 1), 'Marketing', 'Manager', '+56912345691', 'Manager', NOW(), NOW()),
(gen_random_uuid(), 'test15@empresa.com', 'Fernando Aguilar', (SELECT id FROM companies WHERE name = 'Empresa C' LIMIT 1), 'Finance', 'Controller', '+56912345692', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test16@empresa.com', 'Sandra Mendoza', (SELECT id FROM companies WHERE name = 'Empresa D' LIMIT 1), 'Operations', 'Director', '+56912345693', 'Director', NOW(), NOW()),
(gen_random_uuid(), 'test17@empresa.com', 'Ricardo Ortega', (SELECT id FROM companies WHERE name = 'Empresa D' LIMIT 1), 'Legal', 'Director', '+56912345694', 'Director', NOW(), NOW()),
(gen_random_uuid(), 'test18@empresa.com', 'Lucía Peña', (SELECT id FROM companies WHERE name = 'Empresa D' LIMIT 1), 'IT', 'Developer', '+56912345695', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test19@empresa.com', 'Andrés Navarro', (SELECT id FROM companies WHERE name = 'Empresa D' LIMIT 1), 'Sales', 'Rep', '+56912345696', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test20@empresa.com', 'Beatriz Cordero', (SELECT id FROM companies WHERE name = 'Empresa D' LIMIT 1), 'Customer Service', 'Supervisor', '+56912345697', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test21@empresa.com', 'Gabriel Silva', (SELECT id FROM companies WHERE name = 'Empresa E' LIMIT 1), 'Marketing', 'Coordinator', '+56912345698', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test22@empresa.com', 'Valentina Ríos', (SELECT id FROM companies WHERE name = 'Empresa E' LIMIT 1), 'HR', 'Specialist', '+56912345699', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test23@empresa.com', 'Sebastián Vega', (SELECT id FROM companies WHERE name = 'Empresa E' LIMIT 1), 'IT', 'Senior Dev', '+56912345700', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test24@empresa.com', 'Camila Flores', (SELECT id FROM companies WHERE name = 'Empresa E' LIMIT 1), 'Finance', 'Analyst', '+56912345701', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test25@empresa.com', 'Diego Salinas', (SELECT id FROM companies WHERE name = 'Empresa E' LIMIT 1), 'Operations', 'Manager', '+56912345702', 'Manager', NOW(), NOW());

-- Insertar carpetas de empleados de prueba
INSERT INTO employee_folders (id, employee_email, employee_name, company_name, employee_department, employee_position, employee_phone, employee_level, created_at, updated_at) VALUES
(gen_random_uuid(), 'test1@empresa.com', 'Juan Pérez', 'Empresa A', 'IT', 'Developer', '+56912345678', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test2@empresa.com', 'María González', 'Empresa A', 'HR', 'Manager', '+56912345679', 'Manager', NOW(), NOW()),
(gen_random_uuid(), 'test3@empresa.com', 'Carlos López', 'Empresa A', 'Sales', 'Sales Rep', '+56912345680', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test4@empresa.com', 'Ana Martín', 'Empresa A', 'Marketing', 'Designer', '+56912345681', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test5@empresa.com', 'Pedro Sánchez', 'Empresa A', 'Finance', 'Analyst', '+56912345682', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test6@empresa.com', 'Laura Rodríguez', 'Empresa B', 'IT', 'Developer', '+56912345683', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test7@empresa.com', 'Miguel Torres', 'Empresa B', 'Operations', 'Coordinator', '+56912345684', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test8@empresa.com', 'Carmen Jiménez', 'Empresa B', 'Legal', 'Lawyer', '+56912345685', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test9@empresa.com', 'José Moreno', 'Empresa B', 'IT', 'DevOps', '+56912345686', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test10@empresa.com', 'Isabel Vargas', 'Empresa B', 'Customer Service', 'Agent', '+56912345687', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test11@empresa.com', 'Francisco Ruiz', 'Empresa C', 'Sales', 'Manager', '+56912345688', 'Manager', NOW(), NOW()),
(gen_random_uuid(), 'test12@empresa.com', 'Elena Castro', 'Empresa C', 'HR', 'Recruiter', '+56912345689', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test13@empresa.com', 'Roberto Díaz', 'Empresa C', 'IT', 'Architect', '+56912345690', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test14@empresa.com', 'Patricia Herrera', 'Empresa C', 'Marketing', 'Manager', '+56912345691', 'Manager', NOW(), NOW()),
(gen_random_uuid(), 'test15@empresa.com', 'Fernando Aguilar', 'Empresa C', 'Finance', 'Controller', '+56912345692', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test16@empresa.com', 'Sandra Mendoza', 'Empresa D', 'Operations', 'Director', '+56912345693', 'Director', NOW(), NOW()),
(gen_random_uuid(), 'test17@empresa.com', 'Ricardo Ortega', 'Empresa D', 'Legal', 'Director', '+56912345694', 'Director', NOW(), NOW()),
(gen_random_uuid(), 'test18@empresa.com', 'Lucía Peña', 'Empresa D', 'IT', 'Developer', '+56912345695', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test19@empresa.com', 'Andrés Navarro', 'Empresa D', 'Sales', 'Rep', '+56912345696', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test20@empresa.com', 'Beatriz Cordero', 'Empresa D', 'Customer Service', 'Supervisor', '+56912345697', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test21@empresa.com', 'Gabriel Silva', 'Empresa E', 'Marketing', 'Coordinator', '+56912345698', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test22@empresa.com', 'Valentina Ríos', 'Empresa E', 'HR', 'Specialist', '+56912345699', 'Mid', NOW(), NOW()),
(gen_random_uuid(), 'test23@empresa.com', 'Sebastián Vega', 'Empresa E', 'IT', 'Senior Dev', '+56912345700', 'Senior', NOW(), NOW()),
(gen_random_uuid(), 'test24@empresa.com', 'Camila Flores', 'Empresa E', 'Finance', 'Analyst', '+56912345701', 'Junior', NOW(), NOW()),
(gen_random_uuid(), 'test25@empresa.com', 'Diego Salinas', 'Empresa E', 'Operations', 'Manager', '+56912345702', 'Manager', NOW(), NOW());

-- Insertar documentos de prueba para algunas carpetas
INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test1@empresa.com' LIMIT 1), 'Manual de Developer', 'manual', 'Manual del puesto de Developer', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test2@empresa.com' LIMIT 1), 'Manual de Manager', 'manual', 'Manual del puesto de Manager', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test3@empresa.com' LIMIT 1), 'Manual de Sales Rep', 'manual', 'Manual del puesto de Sales Rep', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test4@empresa.com' LIMIT 1), 'Manual de Designer', 'manual', 'Manual del puesto de Designer', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test5@empresa.com' LIMIT 1), 'Manual de Analyst', 'manual', 'Manual del puesto de Analyst', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test6@empresa.com' LIMIT 1), 'Manual de Developer', 'manual', 'Manual del puesto de Developer', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test7@empresa.com' LIMIT 1), 'Manual de Coordinator', 'manual', 'Manual del puesto de Coordinator', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test8@empresa.com' LIMIT 1), 'Manual de Lawyer', 'manual', 'Manual del puesto de Lawyer', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test9@empresa.com' LIMIT 1), 'Manual de DevOps', 'manual', 'Manual del puesto de DevOps', 'active', NOW(), NOW());

INSERT INTO employee_documents (id, employee_folder_id, document_name, document_type, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test10@empresa.com' LIMIT 1), 'Manual de Agent', 'manual', 'Manual del puesto de Agent', 'active', NOW(), NOW());

-- Insertar FAQs de prueba para algunas carpetas
INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test1@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test2@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test3@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test4@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test5@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test6@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test7@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

INSERT INTO employee_faqs (id, employee_folder_id, question, answer, category, status, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employee_folders WHERE employee_email = 'test8@empresa.com' LIMIT 1), '¿Cómo accedo al sistema?', 'Contacta al departamento de IT para obtener tus credenciales.', 'sistema', 'active', NOW(), NOW());

