import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id_curso = searchParams.get('id_curso');

        if (!id_curso) {
            const allCourses = await prisma.curso.findMany({
                orderBy: [
                    { anio: 'asc' },
                    { division: 'asc' }
                ]
            });
            const serializedCourses = JSON.parse(JSON.stringify(allCourses, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));
            return NextResponse.json({ courses: serializedCourses });
        }

        const cursoId = parseInt(id_curso);

        const [alumnos, inasistenciasData, instanciasActivas] = await Promise.all([
            prisma.alumno.findMany({
                where: { id_curso: cursoId, active: true },
                include: { persona: true }
            }),
            prisma.asistencia.findMany({
                where: {
                    id_alumno: { in: (await prisma.alumno.findMany({
                        where: { id_curso: cursoId, active: true },
                        select: { id_alumno: true }
                    })).map(a => a.id_alumno) },
                    tipo_evento: 'Inasistencia',
                    fecha: {
                        gte: new Date(new Date().getFullYear(), 0, 1),
                        lte: new Date()
                    }
                },
                select: {
                    tipo_evento: true,
                    justificacion: true
                }
            }),
            prisma.insancia_evaluativa.findMany({
                where: { active: true },
                orderBy: { id_instancia: 'desc' },
                take: 10
            })
        ]);

        let inasistenciasTotal = 0;
        let inasistenciasJustificadas = 0;
        let inasistenciasSinJustificar = 0;

        inasistenciasData.forEach((a: any) => {
            inasistenciasTotal++;
            if (a.justificacion === 'Justificado') {
                inasistenciasJustificadas++;
            } else {
                inasistenciasSinJustificar++;
            }
        });

        const instanciaIds = instanciasActivas.map(i => i.id_instancia);
        
        let notasPorInstancia: any[] = [];
        
        if (instanciaIds.length > 0) {
            const detallesNotas = await prisma.detalle_insancia_evaluativa.findMany({
                where: {
                    id_instancia: { in: instanciaIds },
                    id_curso: cursoId,
                    active: true
                },
                include: {
                    materia: true,
                    alumno: {
                        include: { persona: true }
                    }
                }
            });

            const notasAgrupadas: { [key: number]: { instancia: any, notas: any[], promedio: number, total: number } } = {};

            instanciasActivas.forEach(instancia => {
                notasAgrupadas[instancia.id_instancia] = {
                    instancia: {
                        id_instancia: instancia.id_instancia,
                        nombre: instancia.nombre
                    },
                    notas: [],
                    promedio: 0,
                    total: 0
                };
            });

            let sumaPromedio = 0;
            let countConNotas = 0;

            detallesNotas.forEach((d: any) => {
                if (d.nota !== null) {
                    if (!notasAgrupadas[d.id_instancia]) {
                        notasAgrupadas[d.id_instancia] = {
                            instancia: { id_instancia: d.id_instancia, nombre: 'Sin instancia' },
                            notas: [],
                            promedio: 0,
                            total: 0
                        };
                    }
                    notasAgrupadas[d.id_instancia].notas.push({
                        id_alumno: d.id_alumno,
                        nombre: d.alumno?.persona?.name,
                        apellido: d.alumno?.persona?.lastName,
                        nota: d.nota,
                        materia: d.materia?.nombre_materia
                    });
                    notasAgrupadas[d.id_instancia].total++;
                    sumaPromedio += d.nota;
                    countConNotas++;
                }
            });

            Object.keys(notasAgrupadas).forEach(key => {
                const instId = parseInt(key);
                const data = notasAgrupadas[instId];
                if (data.total > 0) {
                    data.promedio = Math.round((sumaPromedio / countConNotas) * 10) / 10;
                }
            });

            notasPorInstancia = Object.values(notasAgrupadas);
        }

        const serializedAlumnos = JSON.parse(JSON.stringify(alumnos, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        
        const serializedInasistencias = JSON.parse(JSON.stringify(inasistenciasData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        
        const serializedInstancias = JSON.parse(JSON.stringify(instanciasActivas, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({
            curso: {
                id_curso: cursoId,
                anio: (await prisma.curso.findUnique({ where: { id_curso: cursoId } }))?.anio,
                division: (await prisma.curso.findUnique({ where: { id_curso: cursoId } }))?.division
            },
            estadisticas: {
                totalAlumnos: serializedAlumnos.length,
                inasistenciasTotal,
                inasistenciasJustificadas,
                inasistenciasSinJustificar,
                tasaAsistencia: serializedAlumnos.length > 0 
                    ? Math.round(((serializedAlumnos.length * 200 - inasistenciasTotal) / (serializedAlumnos.length * 200)) * 100 * 10) / 10
                    : 100
            },
            inasistencias: serializedInasistencias,
            instanciasActivas: serializedInstancias,
            notas: notasPorInstancia
        });

    } catch (error: any) {
        console.error('Error fetching veedor data:', error);
        return NextResponse.json(
            { error: 'Error al obtener datos del veedor: ' + error.message },
            { status: 500 }
        );
    }
}
