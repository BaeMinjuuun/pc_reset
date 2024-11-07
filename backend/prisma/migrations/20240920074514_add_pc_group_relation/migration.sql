-- CreateTable
CREATE TABLE `Pc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,
    `ip` VARCHAR(100) NULL,
    `mac` VARCHAR(100) NULL,
    `period` INTEGER NOT NULL DEFAULT 5,
    `status` VARCHAR(50) NULL,
    `board_status` VARCHAR(50) NULL,
    `group_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pc` ADD CONSTRAINT `Pc_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `Group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
