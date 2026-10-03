-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Coche" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "consumo" DOUBLE PRECISION NOT NULL,
    "propietarioId" TEXT NOT NULL,

    CONSTRAINT "Coche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "id" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fecha" TIMESTAMP(3),
    "idaYVuelta" BOOLEAN NOT NULL DEFAULT true,
    "distanciaKm" DOUBLE PRECISION NOT NULL,
    "precioCombustible" DOUBLE PRECISION NOT NULL,
    "modoOrigen" TEXT NOT NULL DEFAULT 'online',
    "enlaceInvitacion" TEXT,
    "organizadorId" TEXT NOT NULL,
    "resultado" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CocheDelViaje" (
    "id" TEXT NOT NULL,
    "viajeId" TEXT NOT NULL,
    "cocheId" TEXT,
    "conductorNombre" TEXT NOT NULL,
    "incluirConductorEnReparto" BOOLEAN NOT NULL DEFAULT true,
    "numeroPasajerosLibre" INTEGER,

    CONSTRAINT "CocheDelViaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasajero" (
    "id" TEXT NOT NULL,
    "cocheDelViajeId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "Pasajero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoAdicional" (
    "id" TEXT NOT NULL,
    "viajeId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GastoAdicional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Viaje_enlaceInvitacion_key" ON "Viaje"("enlaceInvitacion");

-- CreateIndex
CREATE UNIQUE INDEX "Pasajero_viajeId_personaId_key" ON "Pasajero"("viajeId", "personaId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coche" ADD CONSTRAINT "Coche_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CocheDelViaje" ADD CONSTRAINT "CocheDelViaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CocheDelViaje" ADD CONSTRAINT "CocheDelViaje_cocheId_fkey" FOREIGN KEY ("cocheId") REFERENCES "Coche"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasajero" ADD CONSTRAINT "Pasajero_cocheDelViajeId_fkey" FOREIGN KEY ("cocheDelViajeId") REFERENCES "CocheDelViaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasajero" ADD CONSTRAINT "Pasajero_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoAdicional" ADD CONSTRAINT "GastoAdicional_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
