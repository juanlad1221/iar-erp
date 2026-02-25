import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const where: any = {
            active: true
        };

        if (search) {
            where.nombre = {
                contains: search,
                mode: 'insensitive'
            };
        }

        const instancias = await prisma.insancia_evaluativa.findMany({
            where,
            orderBy: {
                id_instancia: 'desc'
            }
        });

        const serialized = JSON.parse(JSON.stringify(instancias, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (error: any) {
        console.error('Error fetching instancias evaluativas:', error);
        return NextResponse.json(
            { error: 'Error al obtener las instancias evaluativas' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre } = body;

        if (!nombre || nombre.trim() === '') {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        const instancia = await prisma.insancia_evaluativa.create({
            data: {
                nombre: nombre.trim(),
                active: true
            }
        });

        const serialized = JSON.parse(JSON.stringify(instancia, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized, { status: 201 });
    } catch (error: any) {
        console.error('Error creating instancia evaluativa:', error);
        return NextResponse.json(
            { error: 'Error al crear la instancia evaluativa', details: error.message },
            { status: 500 }
        );
    }
}
