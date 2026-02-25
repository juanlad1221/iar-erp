import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper para manejar BigInt en JSON
const replacer = (key: any, value: any) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const userRole = searchParams.get('userRole');

        if (!userId || !userRole) {
            return NextResponse.json(
                { success: false, error: 'ID de usuario es requerido' },
                { status: 400 }
            );
        }

        const now = new Date();
        let whereClause: any = {
            activa: true,
            fecha_expiracion: {
                gt: now
            }
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
            data: JSON.parse(JSON.stringify(notifications, replacer))
        });

    } catch (error: any) {
        console.error('Error al obtener notificaciones:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al obtener notificaciones' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            titulo,
            mensaje,
            destino,
            duracion_minutos,
            usuario_id_remitente,
            importancia,
            tipo
        } = body;

        // Extraer datos del objeto destino
        const usuario_id_destino = destino?.tipo === 'usuario' ? destino.valor : null;
        let rol_destino = destino?.tipo === 'rol' ? destino.valor.toUpperCase() : null;


        const idRol = await prisma.rol.findFirst({
            where: {
                rol: rol_destino
            }
        })

        rol_destino = idRol?.id

        // Validación de campos requeridos
        if (!titulo || !mensaje || !duracion_minutos) {
            return NextResponse.json(
                { success: false, error: 'Título, mensaje y duración son requeridos' },
                { status: 400 }
            );
        }

        // Validar que al menos un destino esté especificado
        if (!rol_destino) {
            return NextResponse.json(
                { success: false, error: 'Debe especificar un usuario destino o un rol destino' },
                { status: 400 }
            );
        }

        /*const roleIds = {
            'tutores': BigInt(6),
            'docentes': BigInt(7),
            'preceptores': BigInt(4)
        };*/

        // Calcular fecha de expiración
        const fecha_creacion = new Date();
        const fecha_expiracion = new Date(fecha_creacion.getTime() + (duracion_minutos * 60 * 1000));

        // Si es envío a rol específico (nueva lógica masiva)
        /*if (rol_destino && typeof rol_destino === 'string' && roleIds[rol_destino as keyof typeof roleIds]) {
            const startTime = performance.now();

            // Logging para debugging
            console.log(`🚀 Iniciando envío masivo a rol: ${rol_destino}`);

            // 1. Rate limiting: Verificar envíos recientes del mismo remitente
            if (usuario_id_remitente) {
                const userRecentNotifications = await prisma.notificacion.count({
                    where: {
                        id_remitente: BigInt(usuario_id_remitente),
                        fecha_creacion: {
                            gte: new Date(Date.now() - 60000) // último minuto
                        }
                    }
                });

                if (userRecentNotifications > 10) {
                    return NextResponse.json({
                        success: false,
                        error: 'Límite de envío excedido. Espere antes de enviar más notificaciones.'
                    }, { status: 429 });
                }
            }

            // 2. Obtener todos los usuarios activos con ese rol
            const usuariosConRol = await prisma.user.findMany({
                where: {
                    active: true,
                    Rol_usuario: {
                        some: {
                            idRol: roleIds[rol_destino as keyof typeof roleIds]
                        }
                    }
                },
                include: {
                    Data_personal: true
                }
            });

            console.log(`📊 Usuarios encontrados con rol "${rol_destino}": ${usuariosConRol.length}`);

            if (usuariosConRol.length === 0) {
                const notificationByRole = await prisma.notificacion.create({
                    data: {
                        titulo,
                        mensaje,
                        importancia: importancia || 'BAJA',
                        tipo: tipo || 'GENERAL',
                        id_rol_destino: roleIds[rol_destino as keyof typeof roleIds],
                        id_remitente: usuario_id_remitente ? BigInt(usuario_id_remitente) : BigInt(1),
                        fecha_creacion,
                        fecha_expiracion,
                        activa: true
                    }
                });
                return NextResponse.json({
                    success: true,
                    data: {
                        destinatarios: 0,
                        notificaciones: 1,
                        rol: rol_destino,
                        usuarios: []
                    }
                });
            }

            // 4. Generar IDs únicos para cada notificación
            const notificacionesData = usuariosConRol.map((usuario, index) => ({
                titulo,
                mensaje,
                importancia: importancia || 'BAJA',
                tipo: tipo || 'GENERAL',
                id_destinatario: usuario.id,
                fecha_expiracion,
                id_remitente: usuario_id_remitente ? BigInt(usuario_id_remitente) : BigInt(1),
                fecha_creacion: new Date(Date.now() + index), // Pequeña variación para evitar duplicados exactos
                activa: true
            }));

            // 5. Enviar masivamente con transacción
            const resultado = await prisma.$transaction(async (tx) => {
                const created = await tx.notificacion.createMany({
                    data: notificacionesData
                });

                // Verificar que se crearon todas
                if (created.count !== usuariosConRol.length) {
                    throw new Error(`No se crearon todas las notificaciones: ${created.count}/${usuariosConRol.length}`);
                }

                return created;
            });

            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            console.log(`✅ Envío masivo completado: ${resultado.count} notificaciones en ${responseTime}ms`);
            console.log(`📈 Performance: ${Math.round(resultado.count / (responseTime / 1000))} notificaciones/segundo`);

            return NextResponse.json({
                success: true,
                data: {
                    destinatarios: usuariosConRol.length,
                    notificaciones: resultado.count,
                    rol: rol_destino,
                    responseTimeMs: responseTime,
                    usuarios: usuariosConRol.map(u => ({
                        id: u.id.toString(),
                        nombre: u.Data_personal?.name,
                        apellido: u.Data_personal?.lastName
                    }))
                }
            });
        }

        // Mantener lógica existente para envío a usuario específico o rol por ID numérico
        // Validar roles permitidos (para compatibilidad con código anterior)
        const rolesPermitidos = [2, 3, 4]; // 2=tutores, 3=docentes, 4=preceptores
        if (rol_destino && typeof rol_destino === 'number' && !rolesPermitidos.includes(rol_destino)) {
            return NextResponse.json(
                { success: false, error: 'Rol destino no válido' },
                { status: 400 }
            );
        }*/

        // Crear notificación individual (lógica existente)
        const notification = await prisma.notificacion.create({
            data: {
                titulo,
                mensaje,
                importancia: importancia || 'BAJA',
                id_destinatario: usuario_id_destino ? BigInt(usuario_id_destino) : null,
                id_rol_destino: rol_destino ? BigInt(rol_destino) : null,
                id_remitente: usuario_id_remitente ? BigInt(usuario_id_remitente) : BigInt(1),
                fecha_creacion,
                fecha_expiracion,
                activa: true
            },
            include: {
                remitente: {
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
            data: JSON.parse(JSON.stringify(notification, replacer))
        });

    } catch (error: any) {
        console.error('Error al crear notificación:', error);
        return NextResponse.json(
            { success: false, error: 'Error al crear notificación' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const {
            id,
            titulo,
            mensaje,
            importancia,
            duracion_minutos,
            usuario_id_remitente,
            destino
        } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID de notificación es requerido' },
                { status: 400 }
            );
        }

        const existing = await prisma.notificacion.findUnique({
            where: { id: Number(id) }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Notificación no encontrada' },
                { status: 404 }
            );
        }

        if (usuario_id_remitente && existing.id_remitente && BigInt(usuario_id_remitente) !== existing.id_remitente) {
            return NextResponse.json(
                { success: false, error: 'No autorizado para editar esta notificación' },
                { status: 403 }
            );
        }

        let fecha_expiracion_update = existing.fecha_expiracion;
        if (duracion_minutos && typeof duracion_minutos === 'number' && duracion_minutos > 0) {
            const base = existing.fecha_creacion || new Date();
            fecha_expiracion_update = new Date(base.getTime() + (duracion_minutos * 60 * 1000));
        }

        let id_destinatario_update = existing.id_destinatario ?? null;
        let id_rol_destino_update = existing.id_rol_destino ?? null;

        if (destino && destino.tipo) {
            const roleIds = {
                tutores: BigInt(6),
                docentes: BigInt(7),
                preceptores: BigInt(4)
            } as const;

            if (destino.tipo === 'usuario') {
                id_destinatario_update = destino.valor ? BigInt(destino.valor) : null;
                id_rol_destino_update = null;
            } else if (destino.tipo === 'rol') {
                if (typeof destino.valor === 'string' && roleIds[destino.valor as keyof typeof roleIds]) {
                    id_rol_destino_update = roleIds[destino.valor as keyof typeof roleIds];
                } else if (typeof destino.valor === 'number') {
                    const allowed = [2, 3, 4];
                    id_rol_destino_update = allowed.includes(destino.valor) ? BigInt(destino.valor) : null;
                }
                id_destinatario_update = null;
            }
        }

        const updated = await prisma.notificacion.update({
            where: { id: Number(id) },
            data: {
                titulo: titulo ?? existing.titulo,
                mensaje: mensaje ?? existing.mensaje,
                importancia: importancia ?? existing.importancia,
                fecha_expiracion: fecha_expiracion_update,
                id_destinatario: id_destinatario_update,
                id_rol_destino: id_rol_destino_update
            },
            include: {
                remitente: {
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
                },
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
            data: JSON.parse(JSON.stringify(updated, replacer))
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Error al editar notificación' },
            { status: 500 }
        );
    }
}
