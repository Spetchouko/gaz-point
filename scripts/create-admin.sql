-- Création du premier administrateur GasPoint
-- À exécuter dans la console SQL de Neon (https://console.neon.tech)

-- Option 1 : Promouvoir un utilisateur existant
UPDATE "user" SET role = 'admin', "updatedAt" = NOW() WHERE email = 'ton@email.com';

-- Option 2 : Créer un nouvel admin (si pas de compte)
-- INSERT INTO "user" (id, name, email, role, "emailVerified", "phoneVerified", "createdAt", "updatedAt")
-- VALUES (gen_random_uuid(), 'Admin GasPoint', 'admin@gazpoint.cm', 'admin', true, false, NOW(), NOW());

-- Vérification
SELECT id, name, email, role, "createdAt" FROM "user" WHERE role = 'admin';