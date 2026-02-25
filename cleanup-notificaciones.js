#!/usr/bin/env node

/**
 * SCRIPT DE CLEANUP Y OPTIMIZACIÓN - SISTEMA DE NOTIFICACIONES
 * Fase 3: Limpieza y optimización final
 * 
 * Ejecutar: node cleanup-notificaciones.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`🔧 ${title}`, 'cyan');
    log('='.repeat(60), 'cyan');
}

async function cleanupNotificaciones() {
    logSection('INICIANDO LIMPIEZA Y OPTIMIZACIÓN DE NOTIFICACIONES');
    
    const startTime = Date.now();
    
    try {
        // 1. Eliminar notificaciones expiradas
        log('🗑️  Eliminando notificaciones expiradas...', 'yellow');
        
        const now = new Date();
        const expiradasResult = await prisma.notificacion.deleteMany({
            where: {
                fecha_expiracion: {
                    lt: now
                }
            }
        });
        
        log(`✅ Notificaciones expiradas eliminadas: ${expiradasResult.count}`, 'green');
        
        // 2. Desactivar notificaciones antiguas (más de 30 días)
        log('📅 Desactivando notificaciones antiguas (más de 30 días)...', 'yellow');
        
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const antiguasResult = await prisma.notificacion.updateMany({
            where: {
                fecha_creacion: {
                    lt: thirtyDaysAgo
                },
                activa: true
            },
            data: {
                activa: false
            }
        });
        
        log(`✅ Notificaciones antiguas desactivadas: ${antiguasResult.count}`, 'green');
        
        // 3. Limpiar notificaciones sin destinatario válido
        log('🧹 Limpiando notificaciones huérfanas...', 'yellow');
        
        const huerfanasResult = await prisma.notificacion.deleteMany({
            where: {
                OR: [
                    { id_destinatario: null },
                    { id_remitente: null }
                ],
                id_rol_destino: null // Solo las que no tienen rol destino
            }
        });
        
        log(`✅ Notificaciones huérfanas eliminadas: ${huerfanasResult.count}`, 'green');
        
        // 4. Optimizar índices (PostgreSQL)
        log('📊 Analizando y optimizando índices...', 'yellow');
        
        try {
            await prisma.$executeRaw`ANALYZE notificacion;`;
            log('✅ Análisis de tabla completado', 'green');
        } catch (error) {
            log(`⚠️  No se pudo ejecutar ANALYZE: ${error.message}`, 'yellow');
        }
        
        // 5. Estadísticas finales
        logSection('ESTADÍSTICAS FINALES DE LA BASE DE DATOS');
        
        const stats = await prisma.notificacion.groupBy({
            by: ['importancia', 'tipo'],
            where: {
                activa: true
            },
            _count: {
                id: true
            }
        });
        
        log('📊 Notificaciones activas por importancia y tipo:', 'blue');
        
        stats.forEach(stat => {
            log(`   ${stat.importancia} - ${stat.tipo}: ${stat._count.id}`, 'blue');
        });
        
        const totalActivas = await prisma.notificacion.count({
            where: { activa: true }
        });
        
        const totalLeidas = await prisma.notificacion.count({
            where: { 
                activa: true,
                leida: true 
            }
        });
        
        const totalNoLeidas = await prisma.notificacion.count({
            where: { 
                activa: true,
                leida: false 
            }
        });
        
        log('\n📈 Resumen general:', 'cyan');
        log(`   Total activas: ${totalActivas}`, 'blue');
        log(`   Leídas: ${totalLeidas}`, 'green');
        log(`   No leídas: ${totalNoLeidas}`, 'yellow');
        log(`   Tasa de lectura: ${Math.round((totalLeidas / totalActivas) * 100)}%`, 'blue');
        
        // 6. Verificar usuarios por rol
        logSection('VERIFICANDO USUARIOS POR ROL');
        
        const roles = ['tutores', 'docentes', 'preceptores'];
        const roleIds = { 'tutores': 2, 'docentes': 3, 'preceptores': 4 };
        
        for (const roleName of roles) {
            const usuariosConRol = await prisma.user.count({
                where: {
                    active: true,
                    Rol_usuario: {
                        some: {
                            idRol: roleIds[roleName]
                        }
                    }
                }
            });
            
            log(`👥 ${roleName}: ${usuariosConRol} usuarios activos`, 'blue');
        }
        
        // 7. Verificar performance de consultas
        logSection('VERIFICANDO PERFORMANCE DE CONSULTAS');
        
        const queryStartTime = Date.now();
        
        const testQuery = await prisma.notificacion.findMany({
            where: {
                activa: true,
                fecha_expiracion: {
                    gt: new Date()
                }
            },
            take: 10,
            orderBy: {
                fecha_creacion: 'desc'
            }
        });
        
        const queryEndTime = Date.now();
        const queryTime = queryEndTime - queryStartTime;
        
        log(`⚡ Query test (10 notificaciones): ${queryTime}ms`, queryTime < 100 ? 'green' : 'yellow');
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        logSection('CLEANUP COMPLETADO');
        log(`⏱️  Tiempo total de ejecución: ${totalTime}ms`, 'cyan');
        log(`✅ Proceso completado exitosamente`, 'green');
        
        log('\n🎯 Sugerencias de optimización:', 'magenta');
        log('1. Considerar crear índices compuestos para consultas frecuentes', 'magenta');
        log('2. Implementar particionamiento por fecha si la tabla crece mucho', 'magenta');
        log('3. Configurar un job programado para limpieza automática', 'magenta');
        log('4. Monitorear el tamaño de la tabla regularmente', 'magenta');
        
    } catch (error) {
        log(`💥 Error durante el cleanup: ${error.message}`, 'red');
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar cleanup
if (require.main === module) {
    cleanupNotificaciones()
        .then(() => {
            log('\n🎉 Cleanup y optimización completados exitosamente', 'green');
            process.exit(0);
        })
        .catch((error) => {
            log(`\n💥 Error fatal en el cleanup: ${error.message}`, 'red');
            process.exit(1);
        });
}

module.exports = { cleanupNotificaciones };