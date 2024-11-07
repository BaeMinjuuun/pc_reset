-- CreateTable
CREATE TABLE `Notice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(300) NOT NULL,
    `content` VARCHAR(300) NOT NULL,
    `time_stamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `view_cnt` INTEGER NOT NULL DEFAULT 0,
    `user_id` VARCHAR(191) NOT NULL,

    INDEX `Notice_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notice` ADD CONSTRAINT `Notice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
