-- CreateEnum
CREATE TYPE "TipoAsistencia" AS ENUM ('Asistencia', 'Tardanza', 'Retiro', 'Inasistencia');

-- CreateEnum
CREATE TYPE "Importancia" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('GENERAL', 'INASISTENCIA', 'CALIFICACION', 'COMUNICADO', 'RECORDATORIO');

-- CreateTable
CREATE TABLE "Users" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IdDataPersonal" BIGINT,
    "password" TEXT,
    "active" BOOLEAN DEFAULT true,
    "userName" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumnos" (
    "id_alumno" SERIAL NOT NULL,
    "id_persona" BIGINT NOT NULL,
    "legajo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "id_curso" INTEGER,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Alumnos_pkey" PRIMARY KEY ("id_alumno")
);

-- CreateTable
CREATE TABLE "Data personal" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "lastName" TEXT,
    "dni" TEXT,
    "fecha_nacimiento" DATE,
    "adress" TEXT,
    "movil" TEXT,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Data personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutores" (
    "id_tutor" SERIAL NOT NULL,
    "id_persona" BIGINT NOT NULL,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Tutores_pkey" PRIMARY KEY ("id_tutor")
);

-- CreateTable
CREATE TABLE "Alumno_Tutor" (
    "id_alumno" INTEGER NOT NULL,
    "id_tutor" INTEGER NOT NULL,

    CONSTRAINT "Alumno_Tutor_pkey" PRIMARY KEY ("id_alumno","id_tutor")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol" TEXT,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol-usuario" (
    "idRol" BIGINT NOT NULL,
    "idUser" BIGINT NOT NULL,
    "id_curso" INTEGER,

    CONSTRAINT "Rol-usuario_pkey" PRIMARY KEY ("idRol","idUser")
);

-- CreateTable
CREATE TABLE "Materias" (
    "id_materia" SERIAL NOT NULL,
    "nombre_materia" TEXT NOT NULL,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Materias_pkey" PRIMARY KEY ("id_materia")
);

-- CreateTable
CREATE TABLE "Cursos" (
    "id_curso" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "division" TEXT NOT NULL,

    CONSTRAINT "Cursos_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "Docentes" (
    "id_docente" SERIAL NOT NULL,
    "id_persona" BIGINT NOT NULL,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Docentes_pkey" PRIMARY KEY ("id_docente")
);

-- CreateTable
CREATE TABLE "Asignaciones" (
    "id_asignacion" SERIAL NOT NULL,
    "id_materia" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,

    CONSTRAINT "Asignaciones_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id_evento" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo_evento" "TipoAsistencia" NOT NULL,
    "hora_registro" TEXT,
    "observaciones" TEXT,
    "justificacion" TEXT,
    "motivo_justificacion" TEXT,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "Detalle_instancia_evaluativa" (
    "id_detalle_instancia" SERIAL NOT NULL,
    "nota" INTEGER,
    "id_alumno" INTEGER,
    "id_materia" INTEGER,
    "id_docente" INTEGER,
    "id_instancia" INTEGER NOT NULL,
    "id_curso" INTEGER,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Detalle_instancia_evaluativa_pkey" PRIMARY KEY ("id_detalle_instancia")
);

-- CreateTable
CREATE TABLE "Insancia_evaluativa" (
    "id_instancia" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "Insancia_evaluativa_pkey" PRIMARY KEY ("id_instancia")
);

-- CreateTable
CREATE TABLE "Notificaciones" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMPTZ(6),
    "importancia" "Importancia" NOT NULL DEFAULT 'BAJA',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "id_remitente" BIGINT,
    "id_rol_destino" BIGINT,
    "id_destinatario" BIGINT,

    CONSTRAINT "Notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_userName_key" ON "Users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_id_alumno_fecha_key" ON "Asistencia"("id_alumno", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Detalle_instancia_evaluativa_id_instancia_id_alumno_id_mate_key" ON "Detalle_instancia_evaluativa"("id_instancia", "id_alumno", "id_materia");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_IdDataPersonal_fkey" FOREIGN KEY ("IdDataPersonal") REFERENCES "Data personal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Alumnos" ADD CONSTRAINT "Alumnos_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Data personal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Alumnos" ADD CONSTRAINT "Alumnos_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Cursos"("id_curso") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutores" ADD CONSTRAINT "Tutores_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Data personal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Alumno_Tutor" ADD CONSTRAINT "Alumno_Tutor_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "Alumnos"("id_alumno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumno_Tutor" ADD CONSTRAINT "Alumno_Tutor_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "Tutores"("id_tutor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rol-usuario" ADD CONSTRAINT "Rol-usuario_idRol_fkey" FOREIGN KEY ("idRol") REFERENCES "Rol"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Rol-usuario" ADD CONSTRAINT "Rol-usuario_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Rol-usuario" ADD CONSTRAINT "Rol-usuario_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Cursos"("id_curso") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Docentes" ADD CONSTRAINT "Docentes_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Data personal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "Materias"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Cursos"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docentes"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "Alumnos"("id_alumno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_instancia_evaluativa" ADD CONSTRAINT "Detalle_instancia_evaluativa_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "Alumnos"("id_alumno") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_instancia_evaluativa" ADD CONSTRAINT "Detalle_instancia_evaluativa_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "Materias"("id_materia") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_instancia_evaluativa" ADD CONSTRAINT "Detalle_instancia_evaluativa_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docentes"("id_docente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_instancia_evaluativa" ADD CONSTRAINT "Detalle_instancia_evaluativa_id_instancia_fkey" FOREIGN KEY ("id_instancia") REFERENCES "Insancia_evaluativa"("id_instancia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_instancia_evaluativa" ADD CONSTRAINT "Detalle_instancia_evaluativa_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Cursos"("id_curso") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificaciones" ADD CONSTRAINT "Notificaciones_id_remitente_fkey" FOREIGN KEY ("id_remitente") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificaciones" ADD CONSTRAINT "Notificaciones_id_destinatario_fkey" FOREIGN KEY ("id_destinatario") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificaciones" ADD CONSTRAINT "Notificaciones_id_rol_destino_fkey" FOREIGN KEY ("id_rol_destino") REFERENCES "Rol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
