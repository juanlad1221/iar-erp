import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // Obtener parámetros de la URL
        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');
        const userRole = searchParams.get('userRole');

        if (!userIdParam || !userRole) {
            return NextResponse.json(
                { success: false, error: 'Se requieren userId y userRole' },
                { status: 400 }
            );
        }

        const userId = BigInt(userIdParam);

        let cursos;

        if (userRole === 'PRECEPTOR') {
            // PARA PRECEPTORES: Obtener solo los cursos asignados en rol_usuario
            const preceptorRolUsuario = await prisma.rol_usuario.findMany({
                where: {
                    idUser: userId,
                    idRol: 4, // Rol PRECEPTOR
                    idCurso: { not: null }
                },
                include: {
                    Curso: {
                        include: {
                            alumnos: {
                                where: {
                                    active: true
                                },
                                include: {
                                    persona: true
                                }
                            }
                        }
                    }
                }
            });

            // Extraer los cursos de las relaciones
            cursos = preceptorRolUsuario
                .filter((ru: any) => ru.Curso)
                .map((ru: any) => ru.Curso!);

        } else {
            // PARA OTROS ROLES: Obtener todos los cursos
            cursos = await prisma.curso.findMany({
                include: {
                    alumnos: {
                        where: {
                            active: true
                        },
                        include: {
                            persona: true
                        }
                    }
                },
                orderBy: [
                    { anio: 'asc' },
                    { division: 'asc' }
                ]
            });
        }

        // Formatear los datos de manera consistente
        const cursosFormateados = cursos.map((curso: any) => ({
            id_curso: curso.id_curso,
            anio: curso.anio,
            division: curso.division,
            cantidad_alumnos: curso.alumnos.length,
            alumnos: curso.alumnos.map((alumno: any) => ({
                id_alumno: alumno.id_alumno,
                legajo: alumno.legajo,
                nombre: alumno.persona.name,
                apellido: alumno.persona.lastName,
                dni: alumno.persona.dni
            }))
        }));

        return NextResponse.json({
            success: true,
            data: cursosFormateados,
            meta: {
                userRole,
                totalCursos: cursosFormateados.length,
                filteredByRole: userRole === 'PRECEPTOR'
            }
        });

    } catch (error: any) {
        console.error('Error fetching courses by role:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al obtener los cursos' },
            { status: 500 }
        );
    }
}