/*
  Warnings:

  - A unique constraint covering the columns `[serial_number]` on the table `Pc` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Pc_serial_number_key` ON `Pc`(`serial_number`);
