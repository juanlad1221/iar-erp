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
            OR: [
                { anio: isNaN(parseInt(search)) ? undefined : parseInt(search) },
                { division: { contains: search, mode: 'insensitive' as any } }
            ].filter(condition => condition !== undefined)
        } : {};

        const [cursos, total] = await Promise.all([
            prisma.curso.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: [
                    { anio: 'asc' },
                    { division: 'asc' }
                ]
            }),
            prisma.curso.count({ where })
        ]);

        return NextResponse.json({
            data: cursos,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching cursos:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { anio, division } = body;

        if (!anio || !division) {
            return NextResponse.json({ error: 'Año y división son obligatorios' }, { status: 400 });
        }

        const curso = await prisma.curso.create({
            data: {
                anio: parseInt(anio),
                division: division.toUpperCase(),
            }
        });

        return NextResponse.json(curso, { status: 201 });
    } catch (error) {
        console.error('Error creating curso:', error);
        return NextResponse.json({ error: 'Error al crear el curso' }, { status: 500 });
    }
}
