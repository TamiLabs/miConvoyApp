-- AlterTable
ALTER TABLE `Coche` ADD COLUMN `precio` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `tipoCombustible` VARCHAR(191) NOT NULL DEFAULT 'gasolina';
