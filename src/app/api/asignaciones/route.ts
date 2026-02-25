import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        const skip = (page - 1) * pageSize;

        const [asignaciones, total] = await Promise.all([
            prisma.asignacion.findMany({
                skip,
                take: pageSize,
                include: {
                    materia: true,
                    curso: true,
                    docente: {
                        include: {
                            persona: true
                        }
                    }
                },
                orderBy: {
                    id_asignacion: 'desc'
                }
            }),
            prisma.asignacion.count()
        ]);

        const serializedAsignaciones = JSON.parse(JSON.stringify(asignaciones, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({
            data: serializedAsignaciones,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching asignaciones:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id_materia, id_curso, id_docente } = body;

        if (!id_materia || !id_curso || !id_docente) {
            return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
        }

        const asignacion = await prisma.asignacion.create({
            data: {
                id_materia: parseInt(id_materia),
                id_curso: parseInt(id_curso),
                id_docente: parseInt(id_docente),
            },
            include: {
                materia: true,
                curso: true,
                docente: {
                    include: {
                        persona: true
                    }
                }
            }
        });

        const serializedAsignacion = JSON.parse(JSON.stringify(asignacion, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedAsignacion, { status: 201 });
    } catch (error) {
        console.error('Error creating asignacion:', error);
        return NextResponse.json({ error: 'Error al crear la asignación' }, { status: 500 });
    }
}
