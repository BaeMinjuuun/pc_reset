-- CreateTable
CREATE TABLE `User` (
    `user_id` VARCHAR(100) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `authority` INTEGER NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `User_user_id_key`(`user_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
