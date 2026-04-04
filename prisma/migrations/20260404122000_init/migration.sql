-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'college_manager', 'team_member');

-- CreateEnum
CREATE TYPE "delegate_status" AS ENUM ('confirmed', 'soft_yes', 'cold', 'lost');

-- CreateEnum
CREATE TYPE "register_outcome" AS ENUM ('confirmed', 'soft_yes', 'no_response', 'rejected');

-- CreateTable
CREATE TABLE "colleges" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL,
    "college_id" INTEGER,
    "is_first_login" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "college_id" INTEGER NOT NULL,
    "contact" VARCHAR(20),
    "notes" TEXT,
    "status" "delegate_status" NOT NULL DEFAULT 'soft_yes',
    "added_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegate_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delegate_id" UUID NOT NULL,
    "team_member_id" UUID NOT NULL,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegate_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_register" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delegate_id" UUID NOT NULL,
    "contacted_by" UUID,
    "contact_date" DATE NOT NULL,
    "was_contacted" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "register_outcome",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delegate_id" UUID NOT NULL,
    "old_status" VARCHAR(50),
    "new_status" VARCHAR(50) NOT NULL,
    "changed_by" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD CONSTRAINT "users_college_manager_college_chk" CHECK (
  (role = 'college_manager'::user_role AND college_id IS NOT NULL)
  OR (role <> 'college_manager'::user_role AND college_id IS NULL)
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_name_key" ON "colleges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "delegates_college_id_idx" ON "delegates"("college_id");

-- CreateIndex
CREATE INDEX "delegates_status_idx" ON "delegates"("status");

-- CreateIndex
CREATE INDEX "delegate_assignments_team_member_id_idx" ON "delegate_assignments"("team_member_id");

-- CreateIndex
CREATE INDEX "delegate_assignments_delegate_id_idx" ON "delegate_assignments"("delegate_id");

-- CreateIndex
CREATE UNIQUE INDEX "delegate_assignments_delegate_id_team_member_id_key" ON "delegate_assignments"("delegate_id", "team_member_id");

-- CreateIndex
CREATE INDEX "daily_register_delegate_id_contact_date_idx" ON "daily_register"("delegate_id", "contact_date");

-- CreateIndex
CREATE INDEX "daily_register_contacted_by_idx" ON "daily_register"("contacted_by");

-- CreateIndex
CREATE UNIQUE INDEX "daily_register_delegate_id_contact_date_contacted_by_key" ON "daily_register"("delegate_id", "contact_date", "contacted_by");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegates" ADD CONSTRAINT "delegates_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegates" ADD CONSTRAINT "delegates_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegate_assignments" ADD CONSTRAINT "delegate_assignments_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "delegates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegate_assignments" ADD CONSTRAINT "delegate_assignments_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegate_assignments" ADD CONSTRAINT "delegate_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_register" ADD CONSTRAINT "daily_register_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "delegates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_register" ADD CONSTRAINT "daily_register_contacted_by_fkey" FOREIGN KEY ("contacted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "delegates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
