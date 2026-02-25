import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper para manejar BigInt en JSON
const replacer = (key: any, value: any) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
};

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { titulo, mensaje, importancia, duracion_minutos } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID de notificación es requerido' },
                { status: 400 }
            );
        }

        // Validar campos requeridos
        if (!titulo || !mensaje) {
            return NextResponse.json(
                { success: false, error: 'Título y mensaje son requeridos' },
                { status: 400 }
            );
        }

        const idNumerico = parseInt(id);
        
        // Verificar que la notificación existe
        const notificacion = await prisma.notificacion.findUnique({
            where: { id: idNumerico }
        });

        if (!notificacion) {
            return NextResponse.json(
                { success: false, error: 'Notificación no encontrada' },
                { status: 404 }
            );
        }

        // Calcular nueva fecha de expiración si se proporciona duración
        let fecha_expiracion = notificacion.fecha_expiracion;
        if (duracion_minutos) {
            const fecha_creacion = new Date(notificacion.fecha_creacion);
            fecha_expiracion = new Date(fecha_creacion.getTime() + (duracion_minutos * 60 * 1000));
        }

        // Actualizar la notificación
        const updatedNotification = await prisma.notificacion.update({
            where: { id: idNumerico },
            data: {
                titulo,
                mensaje,
                importancia: importancia || 'BAJA',
                ...(duracion_minutos && { fecha_expiracion })
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

        console.log(`✏️ Notificación actualizada: ID ${idNumerico}`);

        return NextResponse.json({
            success: true,
            data: JSON.parse(JSON.stringify(updatedNotification, replacer))
        });

    } catch (error: any) {
        console.error('Error al actualizar notificación:', error);
        
        // Manejar error de BigInt
        if (error.message?.includes('Invalid BigInt')) {
            return NextResponse.json(
                { success: false, error: 'ID de notificación inválido' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Error al actualizar notificación' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;



        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID de notificación es requerido' },
                { status: 400 }
            );
        }

        const idNumerico = parseInt(id);
        
        // Verificar que la notificación existe
        const notificacion = await prisma.notificacion.findUnique({
            where: { id: idNumerico }
        });

        if (!notificacion) {
            return NextResponse.json(
                { success: false, error: 'Notificación no encontrada' },
                { status: 404 }
            );
        }

        // Eliminar la notificación
        await prisma.notificacion.delete({
            where: { id: idNumerico }
        });

        console.log(`🗑️ Notificación eliminada: ID ${idNumerico}`);

        return NextResponse.json({
            success: true,
            message: 'Notificación eliminada correctamente'
        });

    } catch (error: any) {
        console.error('Error al eliminar notificación:', error);
        
        // Manejar error de BigInt
        if (error.message?.includes('Invalid BigInt')) {
            return NextResponse.json(
                { success: false, error: 'ID de notificación inválido' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Error al eliminar notificación' },
            { status: 500 }
        );
    }
}