import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request) {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // Eliminar notificaciones expiradas
        const expiradas = await prisma.notificacion.deleteMany({
            where: {
                OR: [
                    {
                        fecha_expiracion: {
                            lt: now
                        }
                    },
                    {
                        fecha_creacion: {
                            lt: thirtyDaysAgo
                        },
                        activa: false
                    }
                ]
            }
        });

        // Desactivar notificaciones muy antiguas (30 días) pero no eliminarlas aún
        const antiguas = await prisma.notificacion.updateMany({
            where: {
                fecha_creacion: {
                    lt: thirtyDaysAgo
                },
                activa: true,
                fecha_expiracion: {
                    gt: now
                }
            },
            data: {
                activa: false
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Limpieza de notificaciones completada',
            eliminadas: expiradas.count,
            desactivadas: antiguas.count
        });

    } catch (error: any) {
        console.error('Error al limpiar notificaciones expiradas:', error);
        return NextResponse.json(
            { success: false, error: 'Error al limpiar notificaciones expiradas' },
            { status: 500 }
        );
    }
}