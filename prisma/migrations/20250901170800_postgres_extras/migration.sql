-- Postgres extras: constraints and indexes aligned with schema migration notes

-- 1) CHECK constraints for HEX color columns
DO $$ BEGIN
  ALTER TABLE "public"."Tag"
    ADD CONSTRAINT "tag_color_hex_check" CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."ProjectState"
    ADD CONSTRAINT "projectstate_color_hex_check" CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."TaskState"
    ADD CONSTRAINT "taskstate_color_hex_check" CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."Priority"
    ADD CONSTRAINT "priority_color_hex_check" CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) CHECK constraint for Role: mainRoleTitleId must be set iff isMainRole true
DO $$ BEGIN
  ALTER TABLE "public"."Role"
    ADD CONSTRAINT "role_main_title_consistency"
      CHECK (("isMainRole" AND "mainRoleTitleId" IS NOT NULL) OR (NOT "isMainRole" AND "mainRoleTitleId" IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) CHECK constraint for SegmentGroupCircle: not both internal and project mgmt
DO $$ BEGIN
  ALTER TABLE "public"."SegmentGroupCircle"
    ADD CONSTRAINT "sgc_internal_vs_pm_check"
      CHECK (NOT ("isInternal" AND "isProjectManagementCircle"));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Full-text GIN indexes for search
-- Note: Not using CONCURRENTLY inside transaction; acceptable for migrations.
DO $$ BEGIN
  CREATE INDEX "idx_project_fulltext" ON "public"."Project"
  USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX "idx_task_fulltext" ON "public"."Task"
  USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX "idx_solution_explanation_fulltext" ON "public"."Solution"
  USING gin (to_tsvector('english', coalesce(explanation,'')));
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX "idx_impediment_fulltext" ON "public"."Impediment"
  USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX "idx_impediment_median_fulltext" ON "public"."ImpedimentMedian"
  USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;