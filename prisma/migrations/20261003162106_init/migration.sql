-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coche` (
    `id` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `matricula` VARCHAR(191) NOT NULL,
    `consumo` DOUBLE NOT NULL,
    `propietarioId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Viaje` (
    `id` VARCHAR(191) NOT NULL,
    `origen` VARCHAR(191) NOT NULL,
    `destino` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NULL,
    `idaYVuelta` BOOLEAN NOT NULL DEFAULT true,
    `distanciaKm` DOUBLE NOT NULL,
    `precioCombustible` DOUBLE NOT NULL,
    `modoOrigen` VARCHAR(191) NOT NULL DEFAULT 'online',
    `enlaceInvitacion` VARCHAR(191) NULL,
    `organizadorId` VARCHAR(191) NOT NULL,
    `resultado` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Viaje_enlaceInvitacion_key`(`enlaceInvitacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CocheDelViaje` (
    `id` VARCHAR(191) NOT NULL,
    `viajeId` VARCHAR(191) NOT NULL,
    `cocheId` VARCHAR(191) NULL,
    `conductorNombre` VARCHAR(191) NOT NULL,
    `incluirConductorEnReparto` BOOLEAN NOT NULL DEFAULT true,
    `numeroPasajerosLibre` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pasajero` (
    `id` VARCHAR(191) NOT NULL,
    `cocheDelViajeId` VARCHAR(191) NOT NULL,
    `personaId` VARCHAR(191) NOT NULL,
    `viajeId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Pasajero_viajeId_personaId_key`(`viajeId`, `personaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoAdicional` (
    `id` VARCHAR(191) NOT NULL,
    `viajeId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `importe` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coche` ADD CONSTRAINT `Coche_propietarioId_fkey` FOREIGN KEY (`propietarioId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Viaje` ADD CONSTRAINT `Viaje_organizadorId_fkey` FOREIGN KEY (`organizadorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CocheDelViaje` ADD CONSTRAINT `CocheDelViaje_viajeId_fkey` FOREIGN KEY (`viajeId`) REFERENCES `Viaje`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CocheDelViaje` ADD CONSTRAINT `CocheDelViaje_cocheId_fkey` FOREIGN KEY (`cocheId`) REFERENCES `Coche`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pasajero` ADD CONSTRAINT `Pasajero_cocheDelViajeId_fkey` FOREIGN KEY (`cocheDelViajeId`) REFERENCES `CocheDelViaje`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pasajero` ADD CONSTRAINT `Pasajero_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoAdicional` ADD CONSTRAINT `GastoAdicional_viajeId_fkey` FOREIGN KEY (`viajeId`) REFERENCES `Viaje`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
