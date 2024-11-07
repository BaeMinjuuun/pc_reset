-- CreateTable
CREATE TABLE `ChangesLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `discription` VARCHAR(100) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
