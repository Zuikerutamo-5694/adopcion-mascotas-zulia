-- ============================================================
-- Seed Data: Plataforma de Adopción de Mascotas (Estado Zulia)
-- Contraseña real de todos los usuarios semilla: Password123!
-- ============================================================

INSERT INTO usuarios (nombre, correo, password_hash, telefono, direccion, rol, estado)
VALUES
    ('Carlos Alejandro Pirela', 'admin@adopcionzulia.org', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 424-6001001', 'Av. Bella Vista, Maracaibo, Zulia', 'administrador', 'activo'),
    ('Dr. Carlos Luis Fuenmayor', 'vet.carlos@veterinariazulia.com', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 412-7001001', 'Sector Tierra Negra, Maracaibo, Zulia', 'veterinario', 'activo'),
    ('Dra. Ana Patricia Molero', 'ana.molero@vetluz.com', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 414-7002002', 'Urb. La Coromoto, San Francisco, Zulia', 'veterinario', 'activo'),
    ('María Gabriela Montiel', 'maria.rescatista@fundacionhuellas.org', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 424-8001001', 'Av. 5 de Julio, Maracaibo, Zulia', 'rescatista', 'activo'),
    ('Valentina Beatriz Chávez', 'valentina.chavez@patitas.org', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 412-8002002', 'San Francisco, Estado Zulia', 'rescatista', 'activo'),
    ('Juan Andrés Sánchez', 'juan.adoptante@gmail.com', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 414-9001001', 'Urb. Los Olivos, Maracaibo, Zulia', 'adoptante', 'activo'),
    ('Luisa Fernanda Reyes', 'luisa.reyes@gmail.com', '$2b$10$oAf/jC.A6JyjcGbFxrxWUOb7YB6UnYoNPcPQvj6h/erIaLVSXotdO', '+58 424-9002002', 'Sector La Lago, Maracaibo, Zulia', 'adoptante', 'activo')
ON CONFLICT (correo) DO NOTHING;
