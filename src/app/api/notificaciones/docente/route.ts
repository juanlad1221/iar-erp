import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const userRole = searchParams.get('userRole');
        console.log('4444444', userId, userRole)
        if (!userId || !userRole) {
            return NextResponse.json(
                { success: false, error: 'ID de usuario es requerido' },
                { status: 400 }
            );
        }

        const now = new Date();
        let whereClause: any = {
            id_rol_destino: userRole,
            activa: true,
            fecha_expiracion: { gt: now }
        };

        // Obtener notificaciones
        const notifications = await prisma.notificacion.findMany({
            where: whereClause,
            orderBy: {
                fecha_creacion: 'desc'
            },
            include: {
                rol_destino: true,
                destinatario: {
                    select: {
                        id: true,
                        userName: true,
                        Data_personal: {
                            select: {
                                name: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: JSON.parse(JSON.stringify(notifications, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ))
        });

    } catch (error: any) {
        console.error('Error al obtener notificaciones:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al obtener notificaciones' },
            { status: 500 }
        );
    }
}
