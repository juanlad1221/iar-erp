import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Obtener notas por instancia, materia y curso
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id_instancia = searchParams.get('id_instancia');
        const id_materia = searchParams.get('id_materia');
        const id_curso = searchParams.get('id_curso');
        const id_docente = searchParams.get('id_docente');

        if (!id_instancia) {
            return NextResponse.json(
                { error: 'Se requiere id_instancia' },
                { status: 400 }
            );
        }

        // Construir el where clause
        const whereClause: any = {
            id_instancia: parseInt(id_instancia),
            active: true
        };

        if (id_materia) {
            whereClause.id_materia = parseInt(id_materia);
        }

        if (id_docente) {
            whereClause.id_docente = parseInt(id_docente);
        }

        // Si se proporciona id_curso, filtrar directamente por id_curso
        if (id_curso) {
            whereClause.id_curso = parseInt(id_curso);
        }

        // @ts-ignore
        const detalles = await prisma.detalle_insancia_evaluativa.findMany({
            where: whereClause,
            include: {
                alumno: {
                    include: {
                        persona: true
                    }
                },
                materia: true,
                docente: {
                    include: {
                        persona: true
                    }
                }
            }
        });

        // Formatear la respuesta
        const resultado = detalles.map((d: any) => ({
            id_detalle_instancia: d.id_detalle_instancia,
            id_alumno: d.id_alumno,
            id_materia: d.id_materia,
            id_docente: d.id_docente,
            id_instancia: d.id_instancia,
            id_curso: d.id_curso,
            nota: d.nota,
            alumno: d.alumno ? {
                id_alumno: d.alumno.id_alumno,
                nombre: d.alumno.persona?.name,
                apellido: d.alumno.persona?.lastName,
                legajo: d.alumno.legajo
            } : null,
            materia: d.materia?.nombre_materia || null
        }));

        return NextResponse.json(resultado);
    } catch (error: any) {
        console.error('Error al obtener notas:', error);
        return NextResponse.json(
            { error: 'Error al obtener notas' },
            { status: 500 }
        );
    }
}

// Guardar o actualizar notas
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { notas, id_instancia, id_materia, id_docente, id_curso } = body;

        // notas es un array de { id_alumno, nota }
        if (!notas || !Array.isArray(notas) || !id_instancia) {
            return NextResponse.json(
                { error: 'Datos inválidos. Se requiere notas (array) e id_instancia' },
                { status: 400 }
            );
        }

        console.log('Guardando notas:', { id_instancia, id_materia, id_docente, id_curso, cantidadNotas: notas.length });

        const resultados = [];
        let notasGuardadas = 0;
        let notasActualizadas = 0;

        for (const notaData of notas) {
            // Solo procesar si hay una nota válida
            if (notaData.nota !== null && notaData.nota !== undefined && notaData.nota !== '') {
                const notaInt = parseInt(notaData.nota);
                
                // Validar que la nota esté en rango válido (1-10)
                if (isNaN(notaInt) || notaInt < 1 || notaInt > 10) {
                    continue;
                }

                // Buscar si ya existe un registro para este alumno en esta instancia y materia
                // @ts-ignore
                const existente = await prisma.detalle_insancia_evaluativa.findFirst({
                    where: {
                        id_instancia: parseInt(id_instancia),
                        id_alumno: notaData.id_alumno,
                        id_materia: id_materia ? parseInt(id_materia) : null
                    }
                });

                if (existente) {
                    // Actualizar nota existente
                    // @ts-ignore
                    const updated = await prisma.detalle_insancia_evaluativa.update({
                        where: { id_detalle_instancia: existente.id_detalle_instancia },
                        data: {
                            nota: notaInt,
                            id_docente: id_docente ? parseInt(id_docente) : existente.id_docente,
                            id_curso: id_curso ? parseInt(id_curso) : existente.id_curso
                        }
                    });
                    resultados.push(updated);
                    notasActualizadas++;
                } else {
                    // Crear nuevo registro de nota
                    // @ts-ignore
                    const nuevo = await prisma.detalle_insancia_evaluativa.create({
                        data: {
                            id_instancia: parseInt(id_instancia),
                            id_alumno: notaData.id_alumno,
                            id_materia: id_materia ? parseInt(id_materia) : null,
                            id_docente: id_docente ? parseInt(id_docente) : null,
                            id_curso: id_curso ? parseInt(id_curso) : null,
                            nota: notaInt,
                            active: true
                        }
                    });
                    resultados.push(nuevo);
                    notasGuardadas++;
                }
            }
        }

        console.log(`Notas procesadas: ${notasGuardadas} nuevas, ${notasActualizadas} actualizadas`);

        return NextResponse.json({
            success: true,
            mensaje: `Se guardaron ${notasGuardadas} notas nuevas y se actualizaron ${notasActualizadas}`,
            total: resultados.length,
            nuevas: notasGuardadas,
            actualizadas: notasActualizadas
        });
    } catch (error: any) {
        console.error('Error al guardar notas:', error);
        return NextResponse.json(
            { error: 'Error al guardar notas: ' + error.message },
            { status: 500 }
        );
    }
}

// Actualizar una nota individual (para Admin/Secretario)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id_alumno, id_instancia, id_materia, id_curso, id_docente, nota } = body;

        if (!id_alumno || !id_instancia) {
            return NextResponse.json(
                { error: 'Se requiere id_alumno e id_instancia' },
                { status: 400 }
            );
        }

        // Validar que la nota esté en rango válido (1-10) o sea null para borrar
        if (nota !== null && nota !== undefined && nota !== '') {
            const notaInt = parseInt(nota);
            if (isNaN(notaInt) || notaInt < 1 || notaInt > 10) {
                return NextResponse.json(
                    { error: 'La nota debe estar entre 1 y 10' },
                    { status: 400 }
                );
            }
        }

        // Buscar si ya existe un registro
        // @ts-ignore
        const existente = await prisma.detalle_insancia_evaluativa.findFirst({
            where: {
                id_instancia: parseInt(id_instancia),
                id_alumno: parseInt(id_alumno),
                id_materia: id_materia ? parseInt(id_materia) : undefined,
                id_curso: id_curso ? parseInt(id_curso) : undefined
            }
        });

        const notaFinal = (nota === null || nota === undefined || nota === '') ? null : parseInt(nota);

        if (existente) {
            // Actualizar nota existente
            // @ts-ignore
            const updated = await prisma.detalle_insancia_evaluativa.update({
                where: { id_detalle_instancia: existente.id_detalle_instancia },
                data: { nota: notaFinal }
            });
            return NextResponse.json({
                success: true,
                mensaje: 'Nota actualizada correctamente',
                data: updated
            });
        } else if (notaFinal !== null) {
            // Crear nuevo registro solo si hay nota
            // @ts-ignore
            const nuevo = await prisma.detalle_insancia_evaluativa.create({
                data: {
                    id_instancia: parseInt(id_instancia),
                    id_alumno: parseInt(id_alumno),
                    id_materia: id_materia ? parseInt(id_materia) : null,
                    id_docente: id_docente ? parseInt(id_docente) : null,
                    id_curso: id_curso ? parseInt(id_curso) : null,
                    nota: notaFinal,
                    active: true
                }
            });
            return NextResponse.json({
                success: true,
                mensaje: 'Nota creada correctamente',
                data: nuevo
            });
        } else {
            return NextResponse.json({
                success: true,
                mensaje: 'No se realizaron cambios'
            });
        }
    } catch (error: any) {
        console.error('Error al actualizar nota:', error);
        return NextResponse.json(
            { error: 'Error al actualizar nota: ' + error.message },
            { status: 500 }
        );
    }
}
