import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const valorDeInasistencias = {
    Retiro: 0.5,
    Inasistencia: 1,
    Tardanza: 0.33,
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, lastName, dni, fecha_nacimiento, legajo, tutorIds, id_curso } = body;
        

        // Start a transaction to ensure both records are created or none
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Data_personal record
            // @ts-ignore
            const dataPersonal = await tx.data_personal.create({
                data: {
                    name,
                    lastName,
                    dni,
                    fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                    active: true,
                },
            });

            // 2. Create Alumno record
            // @ts-ignore
            const alumno = await tx.alumno.create({
                data: {
                    id_persona: dataPersonal.id,
                    legajo,
                    estado: 'Regular',
                    id_curso: id_curso ? parseInt(id_curso) : null,
                },
                include: {
                    persona: true,
                    curso: true,
                }
            });

            // 3. Optional: Link to tutors if tutorIds are provided
            if (tutorIds && Array.isArray(tutorIds) && tutorIds.length > 0) {
                // @ts-ignore
                await tx.alumno_Tutor.createMany({
                    data: tutorIds.map((tutorId: any) => ({
                        id_alumno: alumno.id_alumno,
                        id_tutor: parseInt(tutorId),
                    }))
                });
            }

            return alumno;
        });

        // Convert BigInt to string/number for JSON response
        const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedResult, { status: 201 });
    } catch (error: any) {
        console.error('Error creating student:', error);
        return NextResponse.json(
            { error: 'Error al crear el estudiante', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('estado');
        const curso = searchParams.get('curso');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        let whereClause: any = {};
        const orConditions = [];
        const includeBajas = searchParams.get('includeBajas') === 'true';

        if (search) {
            orConditions.push(
                { persona: { name: { contains: search, mode: 'insensitive' } } },
                { persona: { lastName: { contains: search, mode: 'insensitive' } } },
                { persona: { dni: { contains: search, mode: 'insensitive' } } }
            );
        }

        if (orConditions.length > 0) {
            whereClause.OR = orConditions;
        }

        if (status && status !== 'Estado') {
            whereClause.estado = status;
        } else if (!includeBajas) {
            // Por defecto, excluir alumnos dados de baja (active: false)
            whereClause.active = true;
        }

        if (curso && curso !== 'Todos') {
            whereClause.curso = {
                anio: parseInt(curso.split('°')[0]),
                division: curso.split(' ')[1]
            };
        }

        // Get total count for pagination
        const total = await prisma.alumno.count({
            where: whereClause
        });

        const alumnos = await prisma.alumno.findMany({
            where: whereClause,
            include: {
                persona: true,
                curso: true,
                alumnoTutors: {
                    include: {
                        tutor: {
                            include: {
                                persona: true
                            }
                        }
                    }
                },
                asistencias: {
                    where: {
                        fecha: {
                            gte: new Date(new Date().getFullYear(), 0, 1),
                            lte: new Date()
                        }
                    },
                    select: {
                        tipo_evento: true,
                        justificacion: true
                    }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                id_alumno: 'desc' // Newest students first
            }
        });
        const serializedAlumnos = JSON.parse(JSON.stringify(alumnos, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        const resumen = serializedAlumnos.map((al: any) => {
            const inasistenciaSum = Array.isArray(al.asistencias)
                ? al.asistencias.reduce((acc: number, ev: any) => {
                    const tipo = ev?.tipo_evento as keyof typeof valorDeInasistencias;
                    return acc + (valorDeInasistencias[tipo] ?? 0);
                }, 0)
                : 0;
            const justificadasSum = Array.isArray(al.asistencias)
                ? al.asistencias.reduce((acc: number, ev: any) => {
                    const tipo = ev?.tipo_evento as keyof typeof valorDeInasistencias;
                    const val = valorDeInasistencias[tipo] ?? 0;
                    return acc + (ev?.justificacion === 'Justificado' ? val : 0);
                }, 0)
                : 0;
            const inasistenciasJustificadas = Array.isArray(al.asistencias)
                ? al.asistencias.filter((ev: any) => ev?.tipo_evento === 'Inasistencia' && ev?.justificacion === 'Justificado').length
                : 0;
            const tutores = Array.isArray(al.alumnoTutors)
                ? al.alumnoTutors.map((at: any) => `${at.tutor.persona.name} ${at.tutor.persona.lastName}`.trim())
                : [];
            
            const tutorDetails = Array.isArray(al.alumnoTutors)
                ? al.alumnoTutors.map((at: any) => ({
                    nombre: `${at.tutor.persona.name} ${at.tutor.persona.lastName}`.trim(),
                    telefono: at.tutor.persona.movil || 'No registrado'
                }))
                : [];

            return {
                id_alumno: al.id_alumno,
                estudiante: `${al.persona?.name ?? ''} ${al.persona?.lastName ?? ''}`.trim(),
                dni: al.persona?.dni ?? '',
                curso: al.curso ? `${al.curso.anio}° ${al.curso.division}` : 'Sin Asignar',
                estado: al.estado ?? '',
                tutores: tutores,
                tutorDetails: tutorDetails,
                inasistencia: inasistenciaSum,
                justificadas: justificadasSum,
                inasistencias_justificadas: inasistenciasJustificadas
            };
        });

        const serializedResumen = JSON.parse(JSON.stringify(resumen,(key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({
            data: serializedResumen,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error: any) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { error: 'Error al obtener los estudiantes' },
            { status: 500 }
        );
    }
}
