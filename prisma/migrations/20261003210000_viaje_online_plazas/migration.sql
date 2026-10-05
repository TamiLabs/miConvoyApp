-- AlterTable
ALTER TABLE `CocheDelViaje` ADD COLUMN `consumo` DOUBLE NULL,
    ADD COLUMN `plazas` INTEGER NULL,
    ADD COLUMN `precio` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Viaje` ADD COLUMN `tokenEdicion` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Ocupante` (`id` VARCHAR(191) NOT NULL, `viajeId` VARCHAR(191) NOT NULL, `cocheDelViajeId` VARCHAR(191) NOT NULL, `plaza` INTEGER NOT NULL, `nombre` VARCHAR(191) NOT NULL, UNIQUE INDEX `Ocupante_cocheDelViajeId_plaza_key`(`cocheDelViajeId`, `plaza`), UNIQUE INDEX `Ocupante_viajeId_nombre_key`(`viajeId`, `nombre`), PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Viaje_tokenEdicion_key` ON `Viaje`(`tokenEdicion`);

-- AddForeignKey
ALTER TABLE `Ocupante` ADD CONSTRAINT `Ocupante_viajeId_fkey` FOREIGN KEY (`viajeId`) REFERENCES `Viaje`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ocupante` ADD CONSTRAINT `Ocupante_cocheDelViajeId_fkey` FOREIGN KEY (`cocheDelViajeId`) REFERENCES `CocheDelViaje`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

