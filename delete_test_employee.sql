-- Script SQL para eliminar empleado "Test User" con email test@example.com

-- 1. Verificar si existe el empleado
SELECT id, full_name, email, position, status 
FROM employees 
WHERE email = 'test@example.com' AND full_name = 'Test User';

-- 2. Eliminar registros relacionados en employee_folders
DELETE FROM employee_folders 
WHERE employee_email = 'test@example.com';

-- 3. Eliminar registros relacionados en communication_logs
DELETE FROM communication_logs 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE email = 'test@example.com'
);

-- 4. Eliminar el empleado
DELETE FROM employees 
WHERE email = 'test@example.com' AND full_name = 'Test User';

-- 5. Verificar que se eliminó
SELECT COUNT(*) as empleados_restantes 
FROM employees 
WHERE email = 'test@example.com';