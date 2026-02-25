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

        // @ts-ignore
        const tutor = await prisma.tutor.findFirst({
            where: {
                active: true,
                persona: {
                    dni: dni.trim(),
                    active: true
                }
            },
            include: {
                persona: true,
                alumnos: {
                    include: {
                        alumno: {
                            include: {
                                persona: true,
                                curso: true
                            }
                        }
                    }
                }
            }
        });

        if (!tutor) {
            return NextResponse.json(
                { success: false, error: 'No se encontró un tutor con ese DNI' },
                { status: 401 }
            );
        }

        // Buscar usuario asociado a la persona para las notificaciones
        const user = await prisma.user.findFirst({
            where: {
                IdDataPersonal: tutor.id_persona,
                active: true
            }
        });

        const serializedTutor = JSON.parse(JSON.stringify(tutor, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Filtrar alumnos dados de baja (solo mostrar activos en portal de tutores)
        const alumnosActivos = serializedTutor.alumnos
            .filter((at: any) => at.alumno.active === true)
            .map((at: any) => ({
                id: at.alumno.id_alumno,
                nombre: at.alumno.persona.name,
                apellido: at.alumno.persona.lastName,
                legajo: at.alumno.legajo,
                estado: at.alumno.estado,
                curso: at.alumno.curso ? `${at.alumno.curso.anio}° ${at.alumno.curso.division}` : 'Sin curso'
            }));

        return NextResponse.json({
            success: true,
            tutor: {
                id: serializedTutor.id_tutor,
                nombre: serializedTutor.persona.name,
                apellido: serializedTutor.persona.lastName,
                dni: serializedTutor.persona.dni,
                movil: serializedTutor.persona.movil,
                alumnos: alumnosActivos
            },
            userId: user ? user.id.toString() : null
        });
    } catch (error: any) {
        console.error('Error en login de tutor:', error);
        return NextResponse.json(
            { success: false, error: 'Error al verificar el DNI' },
            { status: 500 }
        );
    }
}
