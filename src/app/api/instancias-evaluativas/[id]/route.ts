import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Obtener una instancia específica
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const instancia = await prisma.insancia_evaluativa.findUnique({
            where: { id_instancia: id }
        });

        if (!instancia) {
            return NextResponse.json({ error: 'Instancia no encontrada' }, { status: 404 });
        }

        return NextResponse.json(instancia);
    } catch (error: any) {
        console.error('Error fetching instancia:', error);
        return NextResponse.json({ error: 'Error al obtener la instancia' }, { status: 500 });
    }
}

// PATCH - Editar una instancia
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { nombre } = body;

        if (!nombre || nombre.trim() === '') {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const instancia = await prisma.insancia_evaluativa.update({
            where: { id_instancia: id },
            data: { nombre: nombre.trim() }
        });

        return NextResponse.json(instancia);
    } catch (error: any) {
        console.error('Error updating instancia:', error);
        return NextResponse.json({ error: 'Error al actualizar la instancia' }, { status: 500 });
    }
}

// PUT - Dar de baja (cambiar active a false)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { active } = body;

        const instancia = await prisma.insancia_evaluativa.update({
            where: { id_instancia: id },
            data: { active: active }
        });

        return NextResponse.json(instancia);
    } catch (error: any) {
        console.error('Error updating instancia status:', error);
        return NextResponse.json({ error: 'Error al cambiar estado de la instancia' }, { status: 500 });
    }
}
