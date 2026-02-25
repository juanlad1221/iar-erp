import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * pageSize;

        const where = search ? {
            nombre_materia: { contains: search, mode: 'insensitive' as any }
        } : {};

        const [materias, total] = await Promise.all([
            prisma.materia.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    nombre_materia: 'asc'
                }
            }),
            prisma.materia.count({ where })
        ]);

        return NextResponse.json({
            data: materias,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching materias:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre_materia } = body;

        if (!nombre_materia) {
            return NextResponse.json({ error: 'El nombre de la materia es obligatorio' }, { status: 400 });
        }

        const materia = await prisma.materia.create({
            data: {
                nombre_materia,
            }
        });

        return NextResponse.json(materia, { status: 201 });
    } catch (error) {
        console.error('Error creating materia:', error);
        return NextResponse.json({ error: 'Error al crear la materia' }, { status: 500 });
    }
}
