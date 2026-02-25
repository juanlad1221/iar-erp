import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const docente = await prisma.docente.findUnique({
            where: { id_docente: id },
            include: {
                persona: true
            }
        });

        const serializedDocente = JSON.parse(JSON.stringify(docente, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedDocente);
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
        const { name, lastName, dni, adress, movil, active } = body;

        const updatedDocente = await prisma.docente.update({
            where: { id_docente: id },
            data: {
                active: active !== undefined ? active : undefined,
                persona: {
                    update: {
                        name,
                        lastName,
                        dni,
                        adress,
                        movil
                    }
                }
            },
            include: {
                persona: true
            }
        });

        const serializedDocente = JSON.parse(JSON.stringify(updatedDocente, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedDocente);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar docente' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const currentDocente = await prisma.docente.findUnique({
            where: { id_docente: id },
            select: { active: true }
        });

        if (!currentDocente) {
            return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
        }

        const newStatus = !currentDocente.active;

        await prisma.docente.update({
            where: { id_docente: id },
            data: { active: newStatus }
        });

        return NextResponse.json({
            message: newStatus ? 'Docente dado de alta' : 'Docente dado de baja',
            active: newStatus
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error al dar de baja' }, { status: 500 });
    }
}
