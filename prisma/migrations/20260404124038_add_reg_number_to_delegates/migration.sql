/*
  Warnings:

  - A unique constraint covering the columns `[reg_number]` on the table `delegates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "delegates" ADD COLUMN     "reg_number" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "delegates_reg_number_key" ON "delegates"("reg_number");
