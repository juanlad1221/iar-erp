import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const materia = await prisma.materia.findUnique({
            where: { id_materia: id }
        });

        if (!materia) {
            return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 });
        }

        return NextResponse.json(materia);
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
        const { nombre_materia, active } = body;

        const updatedMateria = await prisma.materia.update({
            where: { id_materia: id },
            data: {
                nombre_materia: nombre_materia || undefined,
                active: active !== undefined ? active : undefined,
            }
        });

        return NextResponse.json(updatedMateria);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar materia' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const currentMateria = await prisma.materia.findUnique({
            where: { id_materia: id },
            select: { active: true }
        });

        if (!currentMateria) {
            return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 });
        }

        const newStatus = !currentMateria.active;

        await prisma.materia.update({
            where: { id_materia: id },
            data: { active: newStatus }
        });

        return NextResponse.json({
            message: newStatus ? 'Materia dada de alta' : 'Materia dada de baja',
            active: newStatus
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error al cambiar estado de la materia' }, { status: 500 });
    }
}
