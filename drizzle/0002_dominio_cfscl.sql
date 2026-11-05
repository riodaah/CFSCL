-- El correo de Francisco es del dominio cfscl.cl, no cfs.cl
UPDATE "usuarios" SET "email" = 'francisco@cfscl.cl'
WHERE "email" = 'francisco@cfs.cl'
  AND NOT EXISTS (SELECT 1 FROM "usuarios" WHERE "email" = 'francisco@cfscl.cl');--> statement-breakpoint
UPDATE "usuarios" SET "activo" = false WHERE "email" LIKE '%@cfs.cl';
