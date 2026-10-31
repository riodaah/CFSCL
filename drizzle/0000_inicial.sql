CREATE TYPE "public"."entidad" AS ENUM('operacion', 'proveedor', 'ferrada');--> statement-breakpoint
CREATE TYPE "public"."origen_pais" AS ENUM('Chile', 'Perú', 'Ecuador');--> statement-breakpoint
CREATE TYPE "public"."paso_ferrada" AS ENUM('Orden de Ferrada', 'Fruta comprada', 'Reserva naviera', 'Embarcada', 'Draft enviado', 'Pago 1 recibido', 'Set oficial enviado', 'En destino', 'Cerrada');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('Europa', 'Medio Oriente', 'Asia');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'operaciones', 'lectura');--> statement-breakpoint
CREATE TYPE "public"."tipo_nota" AS ENUM('Nota', 'Llamada', 'Correo', 'Agente');--> statement-breakpoint
CREATE TABLE "certificados_proveedor" (
	"id" serial PRIMARY KEY NOT NULL,
	"proveedor_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"anio" integer NOT NULL,
	"recibido" date,
	"documento_id" uuid,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cert_proveedor_tipo_anio" UNIQUE("proveedor_id","tipo","anio")
);
--> statement-breakpoint
CREATE TABLE "destinos" (
	"id" serial PRIMARY KEY NOT NULL,
	"puerto" text NOT NULL,
	"pais" text NOT NULL,
	"region" "region" NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidad" "entidad" NOT NULL,
	"entidad_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"nombre_archivo" text NOT NULL,
	"mime" text NOT NULL,
	"tamano_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"sha256" text NOT NULL,
	"subido_por" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notas" (
	"id" serial PRIMARY KEY NOT NULL,
	"entidad" "entidad" NOT NULL,
	"entidad_id" integer,
	"tipo" "tipo_nota" DEFAULT 'Nota' NOT NULL,
	"texto" text NOT NULL,
	"autor" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operaciones_ferrada" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"fecha_orden" date NOT NULL,
	"origen_pais" "origen_pais" NOT NULL,
	"proveedor_id" integer,
	"destino_id" integer NOT NULL,
	"producto" text NOT NULL,
	"variedad" text,
	"calibres" text,
	"contenedores" integer DEFAULT 1 NOT NULL,
	"pallets_por_contenedor" integer DEFAULT 21 NOT NULL,
	"cajas" integer DEFAULT 0 NOT NULL,
	"compra_usd_caja" numeric(12, 2),
	"venta_usd_caja" numeric(12, 2),
	"comision_usd_caja" numeric(12, 2) DEFAULT 0.5 NOT NULL,
	"rebate_usd_contenedor" numeric(12, 2) DEFAULT 0 NOT NULL,
	"paso" "paso_ferrada" DEFAULT 'Orden de Ferrada' NOT NULL,
	"oc_ferrada" text,
	"oc_proveedor" text,
	"naviera" text,
	"booking" text,
	"barco" text,
	"numeros_contenedor" text,
	"etd" date,
	"eta" date,
	"draft_enviado" date,
	"set_oficial_enviado" date,
	"pago1_vence" date,
	"pago1_pagado" date,
	"pago2_pagado" date,
	"notas" text,
	"creado_por" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operaciones_ferrada_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "parametros" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" numeric(14, 4) NOT NULL,
	"etiqueta" text NOT NULL,
	"unidad" text NOT NULL,
	"nota" text,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"pais" "origen_pais" NOT NULL,
	"ciudad" text,
	"id_tributario" text,
	"contacto" text,
	"cargo" text,
	"telefono" text,
	"email" text,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nombre" text,
	"rol" "rol" DEFAULT 'operaciones' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"ultimo_acceso" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ADD CONSTRAINT "certificados_proveedor_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificados_proveedor" ADD CONSTRAINT "certificados_proveedor_documento_id_documentos_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD CONSTRAINT "operaciones_ferrada_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operaciones_ferrada" ADD CONSTRAINT "operaciones_ferrada_destino_id_destinos_id_fk" FOREIGN KEY ("destino_id") REFERENCES "public"."destinos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documentos_entidad_idx" ON "documentos" USING btree ("entidad","entidad_id");--> statement-breakpoint
CREATE INDEX "notas_entidad_idx" ON "notas" USING btree ("entidad","entidad_id");--> statement-breakpoint
CREATE INDEX "op_ferrada_destino_idx" ON "operaciones_ferrada" USING btree ("destino_id");--> statement-breakpoint
CREATE INDEX "op_ferrada_proveedor_idx" ON "operaciones_ferrada" USING btree ("proveedor_id");--> statement-breakpoint
CREATE INDEX "op_ferrada_etd_idx" ON "operaciones_ferrada" USING btree ("etd");