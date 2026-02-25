import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const curso = await prisma.curso.findUnique({
            where: { id_curso: id }
        });

        if (!curso) {
            return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
        }

        return NextResponse.json(curso);
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
        const { anio, division } = body;

        const updatedCurso = await prisma.curso.update({
            where: { id_curso: id },
            data: {
                anio: anio ? parseInt(anio) : undefined,
                division: division ? division.toUpperCase() : undefined,
            }
        });

        return NextResponse.json(updatedCurso);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        await prisma.curso.delete({
            where: { id_curso: id }
        });

        return NextResponse.json({ message: 'Curso eliminado' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar curso' }, { status: 500 });
    }
}
