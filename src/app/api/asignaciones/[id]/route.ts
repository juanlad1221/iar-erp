import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const asignacion = await prisma.asignacion.findUnique({
            where: { id_asignacion: id },
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

        if (!asignacion) {
            return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
        }

        const serializedAsignacion = JSON.parse(JSON.stringify(asignacion, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedAsignacion);
    } catch (error) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
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
        const { id_materia, id_curso, id_docente } = body;

        const updatedAsignacion = await prisma.asignacion.update({
            where: { id_asignacion: id },
            data: {
                id_materia: id_materia ? parseInt(id_materia) : undefined,
                id_curso: id_curso ? parseInt(id_curso) : undefined,
                id_docente: id_docente ? parseInt(id_docente) : undefined,
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

        const serializedAsignacion = JSON.parse(JSON.stringify(updatedAsignacion, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedAsignacion);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar asignación' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        await prisma.asignacion.delete({
            where: { id_asignacion: id }
        });

        return NextResponse.json({ message: 'Asignación eliminada con éxito' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar asignación' }, { status: 500 });
    }
}
