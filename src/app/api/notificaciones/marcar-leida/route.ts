import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { notificationId, userId } = body;

        if (!notificationId || !userId) {
            return NextResponse.json(
                { success: false, error: 'ID de notificación y usuario son requeridos' },
                { status: 400 }
            );
        }

        console.log(`📝 Marcando notificación ${notificationId} como leída por usuario ${userId}`);

        // Marcar la notificación como leída
        const result = await prisma.notificacion.update({
            where: {
                id: Number(notificationId),
                id_destinatario: BigInt(userId)
            },
            data: {
                leida: true
            }
        });

        console.log(`✅ Notificación ${notificationId} marcada como leída`);

        return NextResponse.json({
            success: true,
            data: {
                id: result.id.toString(),
                leida: result.leida
            }
        });

    } catch (error: any) {
        console.error('❌ Error al marcar notificación como leída:', error);
        return NextResponse.json(
            { success: false, error: 'Error al marcar notificación como leída' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'ID de usuario es requerido' },
                { status: 400 }
            );
        }

        // Contar notificaciones no leídas
        const unreadCount = await prisma.notificacion.count({
            where: {
                id_destinatario: BigInt(userId),
                leida: false,
                activa: true,
                fecha_expiracion: {
                    gt: new Date()
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                unreadCount,
                userId
            }
        });

    } catch (error: any) {
        console.error('❌ Error al contar notificaciones no leídas:', error);
        return NextResponse.json(
            { success: false, error: 'Error al contar notificaciones no leídas' },
            { status: 500 }
        );
    }
}