/*
  Warnings:

  - You are about to drop the column `board_status` on the `Pc` table. All the data in the column will be lost.
  - You are about to drop the column `time_over` on the `Pc` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Pc` DROP COLUMN `board_status`,
    DROP COLUMN `time_over`;

-- AlterTable
ALTER TABLE `User` MODIFY `authority` INTEGER NOT NULL DEFAULT 1;
