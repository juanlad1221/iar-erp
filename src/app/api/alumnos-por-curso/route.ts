import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id_curso = searchParams.get('id_curso');

        if (!id_curso) {
            return NextResponse.json(
                { error: 'Se requiere id_curso' },
                { status: 400 }
            );
        }

        // @ts-ignore
        const alumnos = await prisma.alumno.findMany({
            where: {
                id_curso: parseInt(id_curso),
                active: true
            },
            include: {
                persona: {
                    select: {
                        name: true,
                        lastName: true,
                        dni: true
                    }
                }
            },
            orderBy: {
                persona: {
                    lastName: 'asc'
                }
            }
        });

        const resultado = alumnos.map((alumno: any) => ({
            id_alumno: alumno.id_alumno,
            legajo: alumno.legajo,
            nombre: alumno.persona?.name || '',
            apellido: alumno.persona?.lastName || '',
            dni: alumno.persona?.dni || ''
        }));

        return NextResponse.json(resultado);
    } catch (error: any) {
        console.error('Error al obtener alumnos:', error);
        return NextResponse.json(
            { error: 'Error al obtener alumnos' },
            { status: 500 }
        );
    }
}
