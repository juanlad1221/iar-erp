import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { dni } = await request.json();

        if (!dni) {
            return NextResponse.json(
                { success: false, error: 'DNI es requerido' },
                { status: 400 }
            );
        }

        // Buscar usuario por DNI a través de Data_personal
        const userWithPersonalData = await prisma.user.findFirst({
            where: {
                Data_personal: {
                    dni: dni
                },
                active: true
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

        let preceptorRoleId: string | null = null;
        if (userWithPersonalData) {
            //console.log('userWithPersonalData:----++++++++++', userWithPersonalData);
            const preceptorRole = userWithPersonalData.Rol_usuario.find(ru => ru.Rol?.rol === 'PRECEPTOR');
            if (preceptorRole) {
                preceptorRoleId = preceptorRole.idRol?.toString?.() ?? String(preceptorRole.idRol);
            }
        }

        

        if (!userWithPersonalData) {
            return NextResponse.json(
                { success: false, error: 'DNI no encontrado o usuario inactivo' },
                { status: 401 }
            );
        }

        

        // Extraer roles
        const roles = userWithPersonalData.Rol_usuario.map((ru: any) => ru.Rol.rol);

        // Verificar que tenga rol de preceptor
        if (!roles.includes('PRECEPTOR')) {
            return NextResponse.json(
                { success: false, error: 'Acceso denegado. El usuario no tiene rol de preceptor.' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: userWithPersonalData.id.toString(),
                username: userWithPersonalData.userName,
                dni: userWithPersonalData.Data_personal?.dni,
                name: userWithPersonalData.Data_personal?.name,
                lastName: userWithPersonalData.Data_personal?.lastName,
                roles: roles,
                preceptorRoleId
            }
        });

    } catch (error: any) {
        console.error('Preceptor DNI Login API error:', error);
        return NextResponse.json(
            { success: false, error: 'Error en el servidor durante el inicio de sesión' },
            { status: 500 }
        );
    }
}
