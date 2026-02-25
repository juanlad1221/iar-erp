import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { username, password, dni } = await request.json();
        console.log('username:=======', dni);
        if (dni) {
            const userWhitDni = await prisma.data_personal.findFirst({
                where: { dni, active: true }
            })

            if (userWhitDni) {
                // Consultar la base de datos usando Prisma
                const userActive = await prisma.user.findFirst({
                    where: {
                        IdDataPersonal: userWhitDni.id,
                        active: true
                    },
                    include: {
                        Rol_usuario: {
                            include: {
                                Rol: true
                            }
                        }
                    }
                });

                if (userActive && userWhitDni) {
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
                    // Extraer solo los nombres de roles
                    const roles = userActive?.Rol_usuario.map(ru => ({ id: ru.Rol.id.toString(), rol: ru.Rol.rol })) || [];

                    return NextResponse.json({
                        success: true,
                        tutor: {
                            id: userWhitDni.id.toString(), // id de persona
                            nombre: userWhitDni.name,
                            apellido: userWhitDni.lastName,
                            dni: userWhitDni.dni,
                            movil: userWhitDni.movil,
                            alumnos: alumnosActivos,
                            roles: roles
                        },
                        userId: userActive.id.toString() //id de usuario
                    });
                }
            }
        }

        if (!dni) {
            if (!username || !password) {
                return NextResponse.json(
                    { success: false, error: 'Usuario y contraseña son requeridos' },
                    { status: 400 }
                );
            }

            // Consultar la base de datos usando Prisma
            const user = await prisma.user.findFirst({
                where: {
                    userName: username,
                    password: password,
                    active: true
                },
            });

            if (user) {

                const userWithRoles = await prisma.user.findUnique({
                    where: { userName: username || undefined },
                    include: {
                        Rol_usuario: {
                            include: {
                                Rol: true
                            }
                        }
                    }
                });

                // Extraer solo los nombres de roles
                const roles = userWithRoles?.Rol_usuario.map(ru => ru.Rol.rol) || [];

                return NextResponse.json({
                    success: true,
                    user: {
                        id: user.id.toString(), // BigInt to String for JSON serialization
                        username: user.userName,
                        roles: roles
                    }
                });
            } else {
                return NextResponse.json(
                    { success: false, error: 'Usuario o contraseña incorrectos' },
                    { status: 401 }
                );
            }
        }
    } catch (error: any) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { success: false, error: 'Error en el servidor durante el inicio de sesión' },
            { status: 500 }
        );
    }
}
