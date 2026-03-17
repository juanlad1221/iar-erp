import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    try {
        if (username) {
            const user = await prisma.user.findUnique({
                where: { userName: username },
                include: {
                    Data_personal: true,
                    Rol_usuario: {
                        include: {
                            Rol: true
                        }
                    }
                }
            });
            
            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const serializedUser = {
                id: user.id.toString(),
                userName: user.userName,
                password: user.password,
                active: user.active,
                Data_personal: user.Data_personal ? {
                    id: user.Data_personal.id.toString(),
                    name: user.Data_personal.name,
                    lastName: user.Data_personal.lastName,
                    dni: user.Data_personal.dni
                } : null,
                roles: user.Rol_usuario.map((ru) => ({
                    idRol: ru.idRol.toString(),
                    rol: ru.Rol.rol
                }))
            };

            return NextResponse.json({
                success: true,
                user: serializedUser
            });
        }

        const result: any[] = await prisma.$queryRaw`SELECT NOW() as now, version() as version;`;
        return NextResponse.json({
            success: true,
            data: result[0],
        });
    } catch (error: any) {
        console.error('Test DB Connection Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error connecting to the database',
            },
            { status: 500 }
        );
    }
}
