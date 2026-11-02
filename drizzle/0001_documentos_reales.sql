CREATE TYPE "public"."tipo_proveedor" AS ENUM('Exportadora', 'Productor', 'Planta de embalaje');--> statement-breakpoint
ALTER TYPE "public"."region" ADD VALUE 'Norteamérica' BEFORE 'Medio Oriente';--> statement-breakpoint
ALTER TABLE "certificados_proveedor" DROP CONSTRAINT "cert_proveedor_tipo_anio";--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ALTER COLUMN "anio" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ADD COLUMN "numero" text;--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ADD COLUMN "emisor" text;--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ADD COLUMN "vigente_desde" date;--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ADD COLUMN "vigente_hasta" date;--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD COLUMN "planta_id" integer;--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD COLUMN "consignatario" text;--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD COLUMN "anticipo_usd_caja" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD COLUMN "precio_minimo_usd_caja" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD COLUMN "bl" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "tipo" "tipo_proveedor" DEFAULT 'Exportadora' NOT NULL;--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD CONSTRAINT "operaciones_ferrada_planta_id_proveedores_id_fk" FOREIGN KEY ("planta_id") REFERENCES "public"."proveedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cert_proveedor_idx" ON "certificados_proveedor" USING btree ("proveedor_id");