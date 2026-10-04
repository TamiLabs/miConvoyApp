-- AlterTable
ALTER TABLE `User` ADD COLUMN `password` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Viaje` ADD COLUMN `origenClienteId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Viaje_origenClienteId_key` ON `Viaje`(`origenClienteId`);

