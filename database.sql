-- ====================================
-- Total App Solution
-- ====================================
-- It is only an initialization script for multiple apps of the same type
-- Run it once and connect other apps of the same type to this DB

BEGIN;

CREATE SCHEMA db;

CREATE TABLE "public"."cl_config" (
	"id" text NOT NULL,
	"value" text,
	"type" text,
	"dtupdated" timestamp DEFAULT timezone('utc'::text, now()),
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_app" (
	"id" text NOT NULL,
	"url" text,
	"name" text,
	"isflow" bool DEFAULT true,
	"dtping" timestamp,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_file" (
	"uid" serial,
	"id" text NOT NULL,
	"appid" text,
	"name" text,
	"url" text,
	"ext" text,
	"size" int4 DEFAULT 0,
	"width" int2 DEFAULT 0,
	"height" int2 DEFAULT 0,
	"isremoved" bool DEFAULT false,
	"dtremoved" timestamp,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "tbl_file_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY ("uid")
);

CREATE TABLE "public"."tbl_db" (
	"uid" serial,
	"id" text NOT NULL,
	"appid" text,
	"name" text,
	"icon" text,
	"color" text,
	"category" text,
	"columns" jsonb,
	"isremoved" bool DEFAULT false,
	"dtremoved" timestamp,
	"dtupdated" timestamp,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "tbl_db_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY ("uid")
);

CREATE TABLE "public"."tbl_view" (
	"uid" serial,
	"id" text NOT NULL,
	"appid" text,
	"flowid" text,
	"name" text,
	"icon" text,
	"color" text,
	"url" text,
	"isremoved" bool DEFAULT false,
	"dtremoved" timestamp,
	"dtupdated" timestamp,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "tbl_view_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("uid")
);

CREATE TABLE "public"."tbl_ui" (
	"uid" serial,
	"id" text NOT NULL,
	"appid" text,
	"type" text,
	"name" text,
	"icon" text,
	"color" text,
	"group" text,
	"editor" json,
	"data" json,
	"inputs" json,
	"outputs" json,
	"isremoved" bool DEFAULT false,
	"dtupdated" timestamp,
	"dtremoved" timestamp,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "tbl_ui_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY ("uid")
);

CREATE TABLE "public"."tbl_template" (
    "id" text NOT NULL,
    "uid" serial,
    "appid" text,
    "name" text,
    "icon" text,
    "data" json,
    "dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
    "dtupdated" timestamp,
    CONSTRAINT "tbl_template_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_flow" (
	"uid" serial,
	"id" text NOT NULL,
	"appid" text,
	"name" text,
	"icon" text,
	"color" text,
	"group" text,
	"proxy" text,
	"origin" text,
	"data" json,
	"size" int4 DEFAULT 0,
	"isremoved" bool DEFAULT false,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	"dtupdated" timestamp,
	"dtremoved" timestamp,
	CONSTRAINT "tbl_flow_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY ("uid")
);

CREATE TABLE "public"."tbl_nav" (
	"id" text NOT NULL,
	"uid" serial,
	"appid" text,
	"name" text,
	"icon" text,
	"color" text,
	"sortindex" int2 DEFAULT 0,
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "tbl_nav_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- REMOVE UNUSED database:
-- SELECT "table_name" AS name FROM information_schema.tables WHERE table_schema='db' AND NOT EXISTS(SELECT 1 FROM tbl_db WHERE id=SUBSTRING("table_name", 3));

INSERT INTO cl_config (id, value, type) VALUES
	('floweditor', 'https://flow.totaljs.com', 'string'),
	('uibuilder', 'https://uibuilder.totaljs.com', 'string'),
	('cdn', 'https://cdn.componentator.com', 'string'),
	('uicomponents', '', 'string');

COMMIT;