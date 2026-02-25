import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Obtener docentes con sus asignaciones (cursos/materias) y conteo de notas
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id_docente = searchParams.get('id_docente');
        const id_curso = searchParams.get('id_curso');
        const id_materia = searchParams.get('id_materia');

        // Si se pide detalle de alumnos con notas
        if (id_docente && id_curso && id_materia) {
            // Obtener todas las instancias evaluativas activas
            const instancias = await prisma.insancia_evaluativa.findMany({
                where: { active: true },
                orderBy: { id_instancia: 'asc' }
            });

            // Obtener alumnos del curso con sus notas para la materia
            const alumnos = await prisma.alumno.findMany({
                where: {
                    id_curso: parseInt(id_curso),
                    active: true
                },
                include: {
                    persona: true,
                    detalles_evaluativos: {
                        where: {
                            id_materia: parseInt(id_materia),
                            id_docente: parseInt(id_docente),
                            active: true
                        },
                        include: {
                            instancia_evaluativa: true
                        }
                    }
                },
                orderBy: {
                    persona: { lastName: 'asc' }
                }
            });

            // Formatear respuesta con notas indexadas por instancia
            const alumnosFormateados = alumnos.map((alumno: any) => {
                // Crear objeto de notas indexado por id_instancia
                const notasPorInstancia: Record<number, number | null> = {};
                alumno.detalles_evaluativos.forEach((d: any) => {
                    notasPorInstancia[d.id_instancia] = d.nota;
                });

                return {
                    id_alumno: alumno.id_alumno,
                    legajo: alumno.legajo,
                    nombre: alumno.persona?.name || '',
                    apellido: alumno.persona?.lastName || '',
                    estado: alumno.estado,
                    notasPorInstancia
                };
            });

            return NextResponse.json({
                instancias: instancias.map((i: any) => ({
                    id_instancia: i.id_instancia,
                    nombre: i.nombre
                })),
                alumnos: alumnosFormateados
            });
        }

        // Si solo se pide detalle de un docente (sus asignaciones)
        if (id_docente) {
            // Obtener todas las instancias evaluativas activas
            const instancias = await prisma.insancia_evaluativa.findMany({
                where: { active: true },
                orderBy: { id_instancia: 'asc' }
            });

            const docente = await prisma.docente.findUnique({
                where: { id_docente: parseInt(id_docente) },
                include: {
                    persona: true,
                    asignaciones: {
                        include: {
                            curso: true,
                            materia: true
                        }
                    }
                }
            });

            if (!docente) {
                return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
            }

            // Contar notas por asignación
            const asignacionesConNotas = await Promise.all(
                docente.asignaciones.map(async (asig: any) => {
                    // Contar alumnos en el curso
                    const cantidadAlumnos = await prisma.alumno.count({
                        where: {
                            id_curso: asig.id_curso,
                            active: true
                        }
                    });

                    // Contar notas usando el nuevo campo id_curso directamente
                    // @ts-ignore
                    const cantidadNotas = await prisma.detalle_insancia_evaluativa.count({
                        where: {
                            id_docente: docente.id_docente,
                            id_materia: asig.id_materia,
                            id_curso: asig.id_curso,
                            active: true
                        }
                    });

                    return {
                        id_asignacion: asig.id_asignacion,
                        curso: `${asig.curso.anio}° ${asig.curso.division}`,
                        id_curso: asig.id_curso,
                        materia: asig.materia.nombre_materia,
                        id_materia: asig.id_materia,
                        cantidadNotas,
                        cantidadAlumnos
                    };
                })
            );

            const resultado = {
                id_docente: docente.id_docente,
                nombre: docente.persona?.name || '',
                apellido: docente.persona?.lastName || '',
                asignaciones: asignacionesConNotas,
                instancias: instancias.map((i: any) => ({
                    id_instancia: i.id_instancia,
                    nombre: i.nombre
                }))
            };

            return NextResponse.json(resultado);
        }

        // Listado de todos los docentes con resumen de asignaciones
        
        // Obtener cantidad de instancias evaluativas activas
        const cantidadInstancias = await prisma.insancia_evaluativa.count({
            where: { active: true }
        });

        const docentes = await prisma.docente.findMany({
            where: { active: true },
            include: {
                persona: true,
                asignaciones: {
                    include: {
                        curso: true,
                        materia: true
                    }
                }
            },
            orderBy: {
                persona: { lastName: 'asc' }
            }
        });

        // Formatear respuesta con conteo de asignaciones
        const resultado = await Promise.all(
            docentes.map(async (docente: any) => {
                // Contar total de notas cargadas por el docente
                // @ts-ignore
                const totalNotas = await prisma.detalle_insancia_evaluativa.count({
                    where: {
                        id_docente: docente.id_docente,
                        active: true
                    }
                });

                // Calcular total de alumnos en los cursos asignados al docente
                let totalAlumnos = 0;
                for (const asig of docente.asignaciones) {
                    const alumnosEnCurso = await prisma.alumno.count({
                        where: {
                            id_curso: asig.id_curso,
                            active: true
                        }
                    });
                    totalAlumnos += alumnosEnCurso;
                }

                // Total de notas esperadas = alumnos * instancias
                const totalNotasEsperadas = totalAlumnos * cantidadInstancias;
                const porcentajeCarga = totalNotasEsperadas > 0 
                    ? Math.round((totalNotas / totalNotasEsperadas) * 100) 
                    : 0;

                return {
                    id_docente: docente.id_docente,
                    nombre: docente.persona?.name || '',
                    apellido: docente.persona?.lastName || '',
                    dni: docente.persona?.dni || '',
                    cantidadAsignaciones: docente.asignaciones.length,
                    cursos: [...new Set(docente.asignaciones.map((a: any) => `${a.curso.anio}° ${a.curso.division}`))],
                    totalNotas,
                    porcentajeCarga
                };
            })
        );

        return NextResponse.json(resultado);
    } catch (error: any) {
        console.error('Error en ver-carga:', error);
        return NextResponse.json(
            { error: 'Error al obtener datos: ' + error.message },
            { status: 500 }
        );
    }
}
