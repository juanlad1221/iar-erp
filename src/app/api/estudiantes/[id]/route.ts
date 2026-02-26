import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const student = await prisma.alumno.findUnique({
            where: { id_alumno: id },
            include: {
                persona: true,
                curso: true,
                asistencias: {
                    where: {
                        fecha: {
                            gte: new Date(new Date().getFullYear(), 0, 1),
                            lte: new Date()
                        }
                    },
                    select: {
                        id_evento: true,
                        fecha: true,
                        tipo_evento: true,
                        hora_registro: true,
                        observaciones: true,
                        justificacion: true,
                        motivo_justificacion: true
                    },
                    orderBy: {
                        fecha: 'desc'
                    }
                },
                alumnoTutors: {
                    include: {
                        tutor: {
                            include: {
                                persona: true
                            }
                        }
                    }
                }
            }
        });
       
        if (!student) {
            return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
        }

        
        const serializedStudent = JSON.parse(JSON.stringify(student, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        const registros = (student.asistencias || []).map((a: any) => ({
            fecha: a.fecha.toISOString().split('T')[0],
            evento: a.tipo_evento,
            justificada: a.justificacion === 'Justificado'
        }));
        let total_inasistencia = 0;
        let total_tardanzas = 0;
        let total_retiros = 0;
        (student.asistencias || []).forEach((a: any) => {
            if (a.tipo_evento === 'Inasistencia') total_inasistencia += 1;
            if (a.tipo_evento === 'Tardanza') total_tardanzas += 1;
            if (a.tipo_evento === 'Retiro') total_retiros += 1;
        });
        const output = {
            ...serializedStudent,
            asistencias_resumen: registros,
            total_inasistencia,
            total_tardanzas,
            total_retiros
        };
        console.log('output=============', output);
        return NextResponse.json(output);
    } catch (error: any) {
        return NextResponse.json({ error: 'Error al obtener estudiante', details: error.message }, { status: 500 });
    }
}

// PUT - Dar de baja a un estudiante
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { estado, motivo_baja } = body;

        if (!estado) {
            return NextResponse.json({ error: 'El estado es requerido' }, { status: 400 });
        }

        // Si es una baja, también desactivar el alumno
        const esBaja = estado.startsWith('Baja');

        const updatedAlumno = await prisma.alumno.update({
            where: { id_alumno: id },
            data: { 
                estado,
                active: esBaja ? false : true
            },
            include: { persona: true }
        });

        const serializedResult = JSON.parse(JSON.stringify(updatedAlumno, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedResult);
    } catch (error: any) {
        console.error('Error updating student status:', error);
        return NextResponse.json({ error: 'Error al actualizar estado del estudiante', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { name, lastName, dni, legajo, tutorIds, id_curso } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current student to get persona ID
            const student = await tx.alumno.findUnique({
                where: { id_alumno: id },
                select: { id_persona: true }
            });

            if (!student) throw new Error('Estudiante no encontrado');

            // 2. Update Data_personal
            // @ts-ignore
            await tx.data_personal.update({
                where: { id: student.id_persona },
                data: { name, lastName, dni }
            });

            // 3. Update Alumno
            const updatedAlumno = await tx.alumno.update({
                where: { id_alumno: id },
                data: {
                    legajo,
                    id_curso: id_curso ? parseInt(id_curso) : null,
                },
                include: { persona: true }
            });

            // 4. Update Tutors (Sync)
            if (tutorIds && Array.isArray(tutorIds)) {
                // Delete existing ones
                // @ts-ignore
                await tx.alumno_Tutor.deleteMany({
                    where: { id_alumno: id }
                });

                // Create new ones
                // @ts-ignore
                await tx.alumno_Tutor.createMany({
                    data: tutorIds.map((tId: any) => ({
                        id_alumno: id,
                        id_tutor: parseInt(tId)
                    }))
                });
            }

            return updatedAlumno;
        });

        const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedResult);
    } catch (error: any) {
        console.error('Error updating student:', error);
        return NextResponse.json({ error: 'Error al actualizar estudiante', details: error.message }, { status: 500 });
    }
}
