import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const startTime = performance.now();
    
    try {
        // 1. Verificar conexión a base de datos
        const dbCheck = await prisma.$queryRaw`SELECT 1 as connected`;
        
        // 2. Verificar tabla de notificaciones
        const notificacionesCount = await prisma.notificacion.count({
            where: { activa: true }
        });
        
        // 3. Verificar usuarios activos
        const usuariosActivos = await prisma.user.count({
            where: { active: true }
        });
        
        // 4. Verificar última notificación creada
        const ultimaNotificacion = await prisma.notificacion.findFirst({
            orderBy: { fecha_creacion: 'desc' },
            select: {
                id: true,
                titulo: true,
                fecha_creacion: true
            }
        });
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            database: {
                connected: Array.isArray(dbCheck) && dbCheck.length > 0,
                notificacionesActivas: notificacionesCount,
                usuariosActivos: usuariosActivos
            },
            system: {
                ultimaNotificacion: ultimaNotificacion ? {
                    id: ultimaNotificacion.id.toString(),
                    titulo: ultimaNotificacion.titulo,
                    fecha: ultimaNotificacion.fecha_creacion
                } : null,
                uptime: process.uptime()
            },
            features: {
                envioMasivo: true,
                badgesActualizados: true,
                marcadoLeidas: true,
                limpiadoAutomatico: true
            }
        };
        
        return NextResponse.json(healthStatus);
        
    } catch (error: any) {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            error: error.message,
            database: {
                connected: false
            }
        }, { status: 500 });
    }
}