import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rol = searchParams.get('rol');

        if (!rol) {
            // Si no se especifica rol, devolver conteo de todos los roles
            const roles = ['tutores', 'docentes', 'preceptores'];
            const roleIds = {
                'tutores': 6,
                'docentes': 7,
                'preceptores': 4
            };

            const counts: Record<string, number> = {};

            for (const roleName of roles) {
                const usuariosConRol = await prisma.user.count({
                    where: {
                        active: true,
                        Rol_usuario: {
                            some: {
                                idRol: roleIds[roleName as keyof typeof roleIds]
                            }
                        }
                    }
                });
                counts[roleName] = usuariosConRol;
            }

            return NextResponse.json({
                success: true,
                data: counts
            });
        }

        // Mapeo de roles a IDs
        const roleIds = {
            'tutores': 6,
            'docentes': 7,
            'preceptores': 4
        };

        const roleId = roleIds[rol as keyof typeof roleIds];
        if (!roleId) {
            return NextResponse.json(
                { success: false, error: 'Rol no válido' },
                { status: 400 }
            );
        }

        const usuariosConRol = await prisma.user.count({
            where: {
                active: true,
                Rol_usuario: {
                    some: {
                        idRol: roleId
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            count: usuariosConRol,
            rol: rol
        });

    } catch (error) {
        console.error('Error contando usuarios por rol:', error);
        return NextResponse.json(
            { success: false, error: 'Error al contar usuarios por rol' },
            { status: 500 }
        );
    }
}
