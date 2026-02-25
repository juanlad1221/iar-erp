import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const historial = searchParams.get('historial');
        const userId = searchParams.get('userId');
        const userRole = searchParams.get('userRole');

        if (historial === 'true') {
            // Para historial, obtener todos los registros según el rol
            let whereClause: any = {};
            
            if (userRole === 'PRECEPTOR' && userId) {
                // Preceptor: solo ver historial de sus cursos asignados
                const preceptorCursos = await prisma.rol_usuario.findMany({
                    where: {
                        idUser: BigInt(userId),
                        idRol: BigInt(4), // PRECEPTOR
                        idCurso: { not: null }
                    },
                    select: { idCurso: true }
                });
                
                const cursoIds = preceptorCursos.map((ru: { idCurso: number | null }) => ru.idCurso).filter(Boolean);
                
                if (cursoIds.length > 0) {
                    // Filtrar por alumnos que pertenecen a los cursos del preceptor
                    whereClause.alumno = {
                        id_curso: { in: cursoIds }
                    };
                } else {
                    // Si no tiene cursos asignados, devolver vacío
                    return NextResponse.json([]);
                }
            }
            // Para otros roles, no filtrar (ver todo)

            const asis = await prisma.asistencia.findMany({
                where: whereClause,
                include: {
                    alumno: {
                        include: {
                            persona: true,
                            curso: true
                        }
                    }
                },
                orderBy: [
                    { fecha: 'desc' },
                    { hora_registro: 'desc' }
                ]
            });

            const uniqueHistory: any[] = [];
            const seen = new Set<string>();

            asis.forEach((item: any) => {
                const curso = item.alumno?.curso;
                const cursoId = curso?.id_curso;
                if (!cursoId) return;
                const dateStr = new Date(item.fecha).toISOString().split('T')[0];
                const key = `${dateStr}_${cursoId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueHistory.push({
                        fecha: dateStr,
                        curso
                    });
                }
            });

            return NextResponse.json(JSON.parse(JSON.stringify(uniqueHistory, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )));
        }

        // Para otros casos, mantener la lógica existente
        return NextResponse.json({ message: 'Use specific parameters' });

    } catch (error: any) {
        console.error('Error fetching asistencias:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al obtener asistencias' },
            { status: 500 }
        );
    }
}
