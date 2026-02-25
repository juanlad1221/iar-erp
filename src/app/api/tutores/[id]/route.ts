import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        // @ts-ignore
        const tutor = await prisma.tutor.findUnique({
            where: { id_tutor: id },
            include: {
                persona: true
            }
        });

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor no encontrado' }, { status: 404 });
        }

        const serializedTutor = JSON.parse(JSON.stringify(tutor, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedTutor);
    } catch (error: any) {
        console.error('Error fetching tutor:', error);
        return NextResponse.json(
            { error: 'Error al obtener el tutor' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { name, lastName, dni, adress, movil } = body;

        // @ts-ignore
        const tutor = await prisma.tutor.findUnique({
            where: { id_tutor: id },
            select: { id_persona: true }
        });

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor no encontrado' }, { status: 404 });
        }

        // Update the associated Data_personal record
        // @ts-ignore
        const updatedPersona = await prisma.data_personal.update({
            where: { id: tutor.id_persona },
            data: {
                name,
                lastName,
                dni,
                adress,
                movil
            }
        });

        const serializedResult = JSON.parse(JSON.stringify(updatedPersona, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedResult);
    } catch (error: any) {
        console.error('Error updating tutor:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el tutor', details: error.message },
            { status: 500 }
        );
    }
}
