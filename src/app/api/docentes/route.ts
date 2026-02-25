import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * pageSize;

    try {
        console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('$')));
        const where = search ? {
            OR: [
                { persona: { name: { contains: search, mode: 'insensitive' as any } } },
                { persona: { lastName: { contains: search, mode: 'insensitive' as any } } },
                { persona: { dni: { contains: search } } }
            ]
        } : {};

        const [docentes, total] = await Promise.all([
            prisma.docente.findMany({
                where,
                skip,
                take: pageSize,
                include: {
                    persona: true
                },
                orderBy: {
                    persona: { lastName: 'asc' }
                }
            }),
            prisma.docente.count({ where })
        ]);

        const serializedDocentes = JSON.parse(JSON.stringify(docentes, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({
            data: serializedDocentes,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching docentes:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, lastName, dni, adress, movil } = body;

        if (!name || !lastName) {
            return NextResponse.json({ error: 'Nombre y Apellido son obligatorios' }, { status: 400 });
        }

        // Create or find personal data
        const docente = await prisma.docente.create({
            data: {
                persona: {
                    create: {
                        name,
                        lastName,
                        dni,
                        adress,
                        movil,
                        active: true
                    }
                },
                active: true
            },
            include: {
                persona: true
            }
        });

        const serializedDocente = JSON.parse(JSON.stringify(docente, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedDocente, { status: 201 });
    } catch (error) {
        console.error('Error creating docente:', error);
        return NextResponse.json({ error: 'Error al crear el docente' }, { status: 500 });
    }
}
