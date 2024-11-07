/*
  Warnings:

  - You are about to drop the column `discription` on the `ChangesLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ChangesLog` DROP COLUMN `discription`,
    ADD COLUMN `description` VARCHAR(100) NULL;
