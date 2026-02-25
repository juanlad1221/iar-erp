import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { fecha, asistencias } = body;

        if (!fecha || !asistencias || !Array.isArray(asistencias)) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        const normalizedDate = new Date(`${fecha}T00:00:00Z`);

        const updatedTotal = await prisma.$transaction(async (tx: any) => {
            let total = 0;
            for (const asig of asistencias) {
                const idAlumno = parseInt(asig.id_alumno);
                const updateData: any = {};
                const createData: any = {
                    id_alumno: idAlumno,
                    fecha: normalizedDate
                };

                if (asig.tipo_evento !== undefined && asig.tipo_evento) {
                    updateData.tipo_evento = asig.tipo_evento as string;
                    createData.tipo_evento = asig.tipo_evento as string;
                }
                if (asig.hora_registro !== undefined) {
                    updateData.hora_registro = asig.hora_registro || null;
                    createData.hora_registro = asig.hora_registro || null;
                }
                if (asig.observaciones !== undefined) {
                    updateData.observaciones = asig.observaciones || null;
                    createData.observaciones = asig.observaciones || null;
                }
                if (asig.justificacion !== undefined) {
                    updateData.justificacion = asig.justificacion || null;
                    createData.justificacion = asig.justificacion || null;
                }
                if (asig.motivo_justificacion !== undefined) {
                    updateData.motivo_justificacion = asig.motivo_justificacion || null;
                    createData.motivo_justificacion = asig.motivo_justificacion || null;
                }

                await tx.asistencia.upsert({
                    where: {
                        id_alumno_fecha: {
                            id_alumno: idAlumno,
                            fecha: normalizedDate
                        }
                    },
                    update: updateData,
                    create: {
                        ...createData,
                        tipo_evento: (createData.tipo_evento || 'Asistencia') as string
                    }
                });
                total += 1;
            }
            return total;
        });

        return NextResponse.json({ message: 'Asistencia actualizada', updated: updatedTotal });
    } catch (error: any) {
        console.error('Error updating attendance:', error);
        return NextResponse.json({ error: 'Error al actualizar asistencia' }, { status: 500 });
    }
}
