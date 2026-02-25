import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { dni } = body;

        if (!dni || dni.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'El DNI es requerido' },
                { status: 400 }
            );
        }

        // Limpiar DNI: quitar puntos, guiones y espacios
        const dniLimpio = dni.trim().replace(/[.\-\s]/g, '');
        
        console.log('Buscando docente con DNI:', dniLimpio);

        // Primero buscar la persona por DNI
        // @ts-ignore
        const persona = await prisma.data_personal.findFirst({
            where: {
                OR: [
                    { dni: dniLimpio },
                    { dni: dni.trim() }
                ],
                NOT: { active: false }
            }
        });

        console.log('Persona encontrada:', persona ? `ID: ${persona.id}, DNI: ${persona.dni}` : 'No encontrada');

        if (!persona) {
            return NextResponse.json(
                { success: false, error: 'No se encontró una persona con ese DNI' },
                { status: 401 }
            );
        }

        // Buscar el docente vinculado a esa persona
        // @ts-ignore
        const docente = await prisma.docente.findFirst({
            where: {
                id_persona: persona.id,
                NOT: { active: false }
            },
            include: {
                persona: true,
                asignaciones: {
                    include: {
                        materia: true,
                        curso: true
                    }
                }
            }
        });

        console.log('Docente encontrado:', docente ? `ID: ${docente.id_docente}` : 'No encontrado');

        if (!docente) {
            return NextResponse.json(
                { success: false, error: 'Esta persona no está registrada como docente' },
                { status: 401 }
            );
        }

        const serializedDocente = JSON.parse(JSON.stringify(docente, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Preparar información de las asignaciones (materias y cursos)
        const asignaciones = serializedDocente.asignaciones.map((asig: any) => ({
            id: asig.id_asignacion,
            materia: asig.materia?.nombre_materia || 'Sin materia',
            curso: asig.curso ? `${asig.curso.anio}° ${asig.curso.division}` : 'Sin curso',
            id_curso: asig.id_curso,
            id_materia: asig.id_materia
        }));

        return NextResponse.json({
            success: true,
            docente: {
                id: serializedDocente.id_docente,
                nombre: serializedDocente.persona.name,
                apellido: serializedDocente.persona.lastName,
                dni: serializedDocente.persona.dni,
                movil: serializedDocente.persona.movil,
                asignaciones
            }
        });
    } catch (error: any) {
        console.error('Error en login de docente:', error);
        return NextResponse.json(
            { success: false, error: 'Error al verificar el DNI' },
            { status: 500 }
        );
    }
}
