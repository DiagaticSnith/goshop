-- AlterTable: add optional address and phoneNumber to user
ALTER TABLE `user`
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL;
