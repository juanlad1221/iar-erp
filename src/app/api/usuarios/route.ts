import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    try {
        const where = search ? {
            OR: [
                { userName: { contains: search, mode: 'insensitive' as const } },
                { Data_personal: { name: { contains: search, mode: 'insensitive' as const } } },
                { Data_personal: { lastName: { contains: search, mode: 'insensitive' as const } } },
                { Data_personal: { dni: { contains: search, mode: 'insensitive' as const } } }
            ]
        } : {};

        const [usuarios, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    Data_personal: true,
                    Rol_usuario: {
                        include: {
                            Rol: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            }),
            prisma.user.count({ where })
        ]);

        const serializedUsuarios = usuarios.map((u) => {
            return {
                id: u.id.toString(),
                created_at: u.created_at?.toISOString(),
                IdDataPersonal: u.IdDataPersonal?.toString(),
                active: u.active,
                userName: u.userName,
                Data_personal: u.Data_personal ? {
                    id: u.Data_personal.id.toString(),
                    name: u.Data_personal.name,
                    lastName: u.Data_personal.lastName,
                    dni: u.Data_personal.dni,
                    movil: u.Data_personal.movil,
                    active: u.Data_personal.active,
                    created_at: u.Data_personal.created_at?.toISOString(),
                    adress: u.Data_personal.adress,
                    fecha_nacimiento: u.Data_personal.fecha_nacimiento?.toISOString()
                } : null,
                roles: u.Rol_usuario.map((ru) => ({
                    idRol: ru.idRol.toString(),
                    idUser: ru.idUser.toString(),
                    rol: ru.Rol.rol
                }))
            };
        });

        return NextResponse.json({
            data: serializedUsuarios,
            meta: {
                total: Number(total),
                page,
                pageSize,
                totalPages: Math.ceil(Number(total) / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching usuarios:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuarios' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { userName, password, idDataPersonal, roles, active } = await request.json();

        if (!userName || !password) {
            return NextResponse.json(
                { error: 'Usuario y contraseña son requeridos' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { userName }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'El nombre de usuario ya existe' },
                { status: 400 }
            );
        }

        const user = await prisma.user.create({
            data: {
                userName,
                password,
                active: active ?? true,
                IdDataPersonal: idDataPersonal ? BigInt(idDataPersonal) : null
            },
            include: {
                Data_personal: true,
                Rol_usuario: {
                    include: {
                        Rol: true
                    }
                }
            }
        });

        if (roles && roles.length > 0) {
            await prisma.rol_usuario.createMany({
                data: roles.map((roleId: string) => ({
                    idRol: BigInt(roleId),
                    idUser: user.id
                }))
            });
        }

        const userWithRoles = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                Data_personal: true,
                Rol_usuario: {
                    include: {
                        Rol: true
                    }
                }
            }
        });

        const serializedUser = {
            id: userWithRoles!.id.toString(),
            created_at: userWithRoles!.created_at?.toISOString(),
            IdDataPersonal: userWithRoles!.IdDataPersonal?.toString(),
            active: userWithRoles!.active,
            userName: userWithRoles!.userName,
            Data_personal: userWithRoles!.Data_personal ? {
                id: userWithRoles!.Data_personal.id.toString(),
                name: userWithRoles!.Data_personal.name,
                lastName: userWithRoles!.Data_personal.lastName,
                dni: userWithRoles!.Data_personal.dni,
                movil: userWithRoles!.Data_personal.movil
            } : null,
            roles: userWithRoles!.Rol_usuario.map((ru) => ({
                idRol: ru.idRol.toString(),
                idUser: ru.idUser.toString(),
                rol: ru.Rol.rol
            }))
        };

        return NextResponse.json(serializedUser, { status: 201 });
    } catch (error) {
        console.error('Error creating usuario:', error);
        return NextResponse.json(
            { error: 'Error al crear usuario' },
            { status: 500 }
        );
    }
}
