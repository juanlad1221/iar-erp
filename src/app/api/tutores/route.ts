import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, lastName, dni, adress, movil } = body;

        const result = await prisma.$transaction(async (tx) => {
            // @ts-ignore
            const dataPersonal = await tx.data_personal.create({
                data: {
                    name,
                    lastName,
                    dni,
                    adress,
                    movil,
                    active: true,
                },
            });

            // @ts-ignore
            const tutor = await tx.tutor.create({
                data: {
                    id_persona: dataPersonal.id,
                },
                include: {
                    persona: true
                }
            });

            return tutor;
        });

        const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedResult, { status: 201 });
    } catch (error: any) {
        console.error('Error creating tutor:', error);
        return NextResponse.json(
            { error: 'Error al crear el tutor', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        const where = search ? {
            persona: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { dni: { contains: search } }
                ]
            }
        } : {};

        const total = await prisma.tutor.count({ where: where as any });

        const tutores = await prisma.tutor.findMany({
            where: where as any,
            include: {
                persona: true,
                alumnos: {
                    include: {
                        alumno: {
                            include: {
                                persona: true
                            }
                        }
                    }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                id_tutor: 'desc'
            }
        });

        const serializedTutores = JSON.parse(JSON.stringify(tutores, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({
            data: serializedTutores,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error: any) {
        console.error('Error fetching tutores:', error);
        return NextResponse.json(
            { error: 'Error al obtener los tutores' },
            { status: 500 }
        );
    }
}
