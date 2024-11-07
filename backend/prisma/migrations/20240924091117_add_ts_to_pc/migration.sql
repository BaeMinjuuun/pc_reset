/*
  Warnings:

  - Added the required column `ts` to the `Pc` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Pc` ADD COLUMN `ts` DATETIME(3) NOT NULL;
