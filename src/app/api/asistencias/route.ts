import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id_alumno = searchParams.get('id_alumno');
        const id_curso = searchParams.get('id_curso');
        const fecha = searchParams.get('fecha');
        const historial = searchParams.get('historial');
        const acumulado = searchParams.get('acumulado');

        // Handle attendance accumulation
        if (acumulado === 'true' && id_alumno) {
            const asistencias = await prisma.asistencia.findMany({
                where: {
                    id_alumno: parseInt(id_alumno),
                    fecha: {
                        gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
                        lte: new Date()
                    }
                },
                select: {
                    tipo_evento: true,
                    fecha: true,
                    justificacion: true
                }
            });

            let acumuladoSinJustificar = 0;
            let acumuladoJustificadas = 0;
            let inasistenciasTotal = 0;
            let tardanzasTotal = 0;
            let retirosTotal = 0;
            
            
            asistencias.forEach((item: any) => {
                const isJustified = item.justificacion === 'Justificado';
                
                switch (item.tipo_evento) {
                    case 'Inasistencia':
                        inasistenciasTotal += 1;
                        if (isJustified) {
                            acumuladoJustificadas += 1;
                        } 
                        break;
                    case 'Tardanza':
                        tardanzasTotal += 1;
                        if (isJustified) {
                            acumuladoJustificadas += 1;
                        } 
                        break;
                    case 'Retiro':
                        retirosTotal += 1;
                        if (isJustified) {
                            acumuladoJustificadas += 1;
                        } 
                        break;
                    case 'Asistencia':
                        // No accumulation for attendance
                        break;
                }
            });
            //console.log(inasistenciasTotal, tardanzasTotal, retirosTotal);
            return NextResponse.json({ 
                acumulado: acumuladoSinJustificar, 
                justificadas: acumuladoJustificadas,
                totalRegistros: asistencias.length,
                inasistencias_total: inasistenciasTotal,
                tardanzas_total: tardanzasTotal,
                retiros_total: retirosTotal
            });
        }

        // Handle attendance history
        if (historial === 'true') {
            const history = await prisma.asistencia.findMany({
                distinct: ['fecha', 'id_alumno'], // We can't do distinct on curso directly because it's a relation
                select: {
                    fecha: true,
                    alumno: {
                        select: {
                            id_curso: true,
                            curso: {
                                select: {
                                    id_curso: true,
                                    anio: true,
                                    division: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            // Group by fecha and curso in JS to filter unique combinations
            const uniqueHistory: any[] = [];
            const seen = new Set();

            history.forEach((item: any) => {
                const cursoId = item.alumno.curso?.id_curso;
                if (!cursoId) return;

                const key = `${item.fecha.toISOString().split('T')[0]}_${cursoId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueHistory.push({
                        fecha: item.fecha.toISOString().split('T')[0],
                        curso: item.alumno.curso
                    });
                }
            });

            return NextResponse.json(uniqueHistory);
        }

        // Handle specific student attendance
        if (id_alumno) {
            const asistencias = await prisma.asistencia.findMany({
                where: {
                    id_alumno: parseInt(id_alumno),
                    fecha: {
                        gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
                        lte: new Date()
                    }
                },
                select: {
                    id_evento: true,
                    id_alumno: true,
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
            });

            const serializedAsistencias = JSON.parse(JSON.stringify(asistencias, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

            return NextResponse.json(serializedAsistencias);
        }

        // Handle course attendance for specific date
        if (!id_curso || !fecha) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        // Normalizar fecha a medianoche en UTC para alinearla con escrituras
        const normalizedDate = new Date(fecha + 'T00:00:00Z');

        const alumnos = await prisma.alumno.findMany({
            where: { 
                id_curso: parseInt(id_curso),
                // Solo alumnos activos (excluir dados de baja)
                active: true
            },
            include: {
                persona: true,
                asistencias: {
                    where: { fecha: normalizedDate },
                    orderBy: { id_evento: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                persona: {
                    lastName: 'asc'
                }
            }
        });

        const serializedAlumnos = JSON.parse(JSON.stringify(alumnos, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
       
        return NextResponse.json(serializedAlumnos);
    } catch (error: any) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json({ error: 'Error al obtener alumnos' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id_alumno, fecha, justificacion, motivo_justificacion } = body;

        if (!id_alumno || !fecha) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        const date = new Date(fecha + 'T00:00:00Z');

        const result = await prisma.asistencia.upsert({
            where: {
                id_alumno_fecha: {
                    id_alumno: parseInt(id_alumno),
                    fecha: date
                }
            },
            update: {
                justificacion: justificacion || null,
                motivo_justificacion: motivo_justificacion || null
            },
            create: {
                id_alumno: parseInt(id_alumno),
                fecha: date,
                tipo_evento: 'Inasistencia',
                justificacion: justificacion || null,
                motivo_justificacion: motivo_justificacion || null
            }
        });

        return NextResponse.json({ message: 'Justificación actualizada', result });
    } catch (error: any) {
        console.error('Error updating justification:', error);
        return NextResponse.json({ error: 'Error al actualizar justificación' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fecha, asistencias, curso_id } = body;
        
        if (!fecha || !asistencias || !curso_id || !Array.isArray(asistencias)) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        const date = new Date(fecha + 'T00:00:00Z');

        const cursoIdNum = parseInt(curso_id);
        const idsSolicitados = asistencias.map((asig: any) => parseInt(asig.id_alumno));
        const existentes = await prisma.asistencia.findMany({
            where: {
                fecha: date,
                id_alumno: { in: idsSolicitados }
            },
            select: { id_alumno: true }
        });
        const existentesSet = new Set(existentes.map((e: any) => e.id_alumno));
        const yaTomadaParaCurso = await prisma.asistencia.count({
            where: {
                fecha: date,
                alumno: { id_curso: cursoIdNum }
            }
        });

        const operaciones = asistencias.flatMap((asig: any) => {
            const idAlumno = parseInt(asig.id_alumno);
            if (yaTomadaParaCurso > 0 && !existentesSet.has(idAlumno)) {
                return [];
            }
            return prisma.asistencia.upsert({
                where: {
                    id_alumno_fecha: {
                        id_alumno: idAlumno,
                        fecha: date
                    }
                },
                update: {
                    tipo_evento: asig.tipo_evento,
                    hora_registro: asig.hora_registro || null,
                    observaciones: asig.observaciones || null,
                    justificacion: asig.justificacion || null,
                    motivo_justificacion: asig.motivo_justificacion || null
                },
                create: {
                    id_alumno: idAlumno,
                    fecha: date,
                    tipo_evento: asig.tipo_evento,
                    hora_registro: asig.hora_registro || null,
                    observaciones: asig.observaciones || null,
                    justificacion: asig.justificacion || null,
                    motivo_justificacion: asig.motivo_justificacion || null
                }
            });
        });

        if (operaciones.length === 0 && yaTomadaParaCurso > 0) {
            return NextResponse.json(
                { error: 'No puede tomarse asistencia porque ya existe para este curso y fecha' },
                { status: 409 }
            );
        }

        const results = await prisma.$transaction(operaciones);

        return NextResponse.json({ message: 'Asistencia guardada', results });
    } catch (error: any) {
        console.error('Error saving attendance:', error);
        return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
    }
}
