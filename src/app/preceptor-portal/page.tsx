'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import './preceptor-portal.css';

interface PreceptorData {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    movil: string;
}

interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    fecha: string;
    tipo: 'urgente' | 'importante' | 'informativo';
    leida: boolean;
}

export default function PreceptorPortalPage() {
    const router = useRouter();
    const [preceptorData, setPreceptorData] = useState<PreceptorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cursosCount, setCursosCount] = useState(0);
    const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);

    // Mejorar experiencia móvil: detectar orientación y ajustar vista
    useEffect(() => {
        const handleOrientationChange = () => {
            // Pequeña demora para que el browser ajuste el layout
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    const fetchCursosCount = async (userId: string) => {
        try {
            const response = await fetch(`/api/cursos-por-rol?userId=${userId}&userRole=PRECEPTOR`);
            if (response.ok) {
                const data = await response.json();
                setCursosCount(data.meta?.totalCursos || 0);
            }
        } catch (error) {
            console.error('Error fetching cursos count:', error);
            setCursosCount(0);
        }
    };

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const activeRole = localStorage.getItem('activeRole');
        const username = localStorage.getItem('username');
        const dni = localStorage.getItem('dni');
        const userId = localStorage.getItem('userId');

        if (!isAuthenticated || activeRole !== 'PRECEPTOR') {
            router.push('/preceptor-login');
            return;
        }

        if (username && dni) {
            const nameParts = username.split(' ');
            setPreceptorData({
                id: userId ? parseInt(userId, 10) || 0 : 0,
                nombre: nameParts[0] || 'Preceptor',
                apellido: nameParts[1] || '',
                dni: dni,
                movil: ''
            });
        }

        if (userId) {
            fetchCursosCount(userId);
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        const fetchNotificacionesCount = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const userRole = localStorage.getItem('activeRole');

                if (!userId || !userRole) {
                    console.log('🔍 Preceptor Portal: No hay userId o userRole en localStorage');
                    return;
                }

                const response = await fetch(`/api/notificaciones/preceptor?userId=${userId}&userRole=${userRole}`);
                const data = await response.json();

                if (data.success) {
                    const unreadCount = data.data.filter((n: any) => !n.leida).length;
                    const totalCount = data.data.length;

                    console.log(`📊 Preceptor Portal: ${unreadCount}/${totalCount} notificaciones no leídas`);
                    setNotificacionesPendientes(unreadCount);

                    // Actualizar notificaciones si hay datos reales
                    if (data.data.length > 0) {
                        const realNotifications = data.data.slice(0, 5).map((n: any) => ({
                            id: n.id,
                            titulo: n.titulo,
                            mensaje: n.mensaje,
                            fecha: new Date(n.fecha_creacion).toISOString().split('T')[0],
                            tipo: n.importancia === 'ALTA' ? 'urgente' :
                                n.importancia === 'MEDIA' ? 'importante' : 'informativo' as Notificacion['tipo'],
                            leida: n.leida
                        }));

                        setNotificaciones(realNotifications);
                    }
                } else {
                    console.error('❌ Error en API de notificaciones (Preceptor):', data.error);
                }
            } catch (error) {
                console.error('💥 Error fetching notifications count (Preceptor):', error);
            }
        };

        // Fetch inicial
        fetchNotificacionesCount();

        // Configurar interval para actualizaciones automáticas
        const interval = setInterval(fetchNotificacionesCount, 30000); // Cada 30 segundos

        // Cleanup
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('inicial');
        localStorage.removeItem('username');
        localStorage.removeItem('dni');
        localStorage.removeItem('roles');
        localStorage.removeItem('activeRole');
        router.push('/preceptor-login');
    };

    const handleAsistenciaClick = () => {
        router.push('/estudiantes/asistencia');
    };


    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'urgente':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'importante':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="preceptor-portal-loading">
                <div className="preceptor-portal-spinner"></div>
                <p>Cargando información...</p>
            </div>
        );
    }

    if (!preceptorData) {
        return null;
    }

    const noLeidasCount = notificaciones.filter(n => !n.leida).length;

    return (
        <div className="preceptor-portal-container">
            {/* Header */}
            <header className="preceptor-portal-header">
                <div className="preceptor-portal-header-left">
                    <div className="preceptor-portal-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 13H13M7 17H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="preceptor-portal-title">
                        <h1>Portal Preceptores</h1>
                        <p>Bienvenido/a, {preceptorData.nombre} {preceptorData.apellido}</p>
                    </div>
                </div>
                <div className="preceptor-portal-header-right">
                    <ThemeToggle />
                    <div className="notification-indicator">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {notificacionesPendientes > 0 && (
                            <span className="notification-badge">{notificacionesPendientes}</span>
                        )}
                    </div>
                    <button onClick={handleLogout} className="preceptor-logout-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Salir</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="preceptor-portal-main">
                {/* Hero Section */}
                <div className="preceptor-hero-section animate-fade-in">
                    <div className="preceptor-hero-content">
                        <div className="preceptor-hero-avatar">
                            {preceptorData.nombre[0]}{preceptorData.apellido[0]}
                        </div>
                        <div className="preceptor-hero-info">
                            <h2>{preceptorData.nombre} {preceptorData.apellido}</h2>
                            <p>DNI: {preceptorData.dni}</p>
                            <div className="preceptor-hero-badge">
                                Preceptor
                            </div>
                        </div>
                    </div>
                    <div className="preceptor-hero-stats">
                        <div className="preceptor-stat-card">
                            <div className="preceptor-stat-value">{noLeidasCount}</div>
                            <div className="preceptor-stat-label">Notificaciones</div>
                        </div>
                        <div className="preceptor-stat-card">
                            <div className="preceptor-stat-value">{cursosCount}</div>
                            <div className="preceptor-stat-label">Cursos</div>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <section className="preceptor-notifications-section animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="preceptor-notifications-header">
                        <h3 className="preceptor-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            Notificaciones ({notificaciones.length})
                        </h3>
                        {noLeidasCount > 0 && (
                            <span className="preceptor-notifications-count">
                                {noLeidasCount} no leídas
                            </span>
                        )}
                    </div>

                    <div className="preceptor-notifications-list">
                        {notificaciones.map((notificacion, index) => (
                            <div
                                key={notificacion.id}
                                className={`preceptor-notification-card preceptor-notification-${notificacion.tipo} ${!notificacion.leida ? 'preceptor-notification-unread' : ''} animate-fade-in`}
                                style={{ animationDelay: `${(index + 3) * 50}ms` }}
                            >
                                <div className={`preceptor-notification-icon preceptor-notification-icon-${notificacion.tipo}`}>
                                    {getTipoIcon(notificacion.tipo)}
                                </div>
                                <div className="preceptor-notification-content">
                                    <div className="preceptor-notification-header">
                                        <h4>{notificacion.titulo}</h4>
                                        <div className="preceptor-notification-meta">
                                            <span className={`preceptor-badge preceptor-badge-${notificacion.tipo}`}>
                                                {notificacion.tipo === 'urgente' ? 'Urgente' : notificacion.tipo === 'importante' ? 'Importante' : 'Info'}
                                            </span>
                                            <span className="preceptor-notification-date">
                                                {formatDate(notificacion.fecha)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="preceptor-notification-message">{notificacion.mensaje}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="preceptor-quick-actions animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <h3 className="preceptor-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Acciones Rápidas
                    </h3>
                    <div className="preceptor-actions-grid">
                        <button
                            className="preceptor-action-btn preceptor-action-primary"
                            onClick={handleAsistenciaClick}
                        >
                            <div className="preceptor-action-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
                                    <circle cx="9" cy="7" r="4" />
                                </svg>
                            </div>
                            <div className="preceptor-action-content">
                                <h4>Editar Asistencia</h4>
                                <p>Registro diario de asistencia</p>
                            </div>
                            <div className="preceptor-action-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        <button className="preceptor-action-btn preceptor-action-secondary">
                            <div className="preceptor-action-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
                                    <circle cx="9" cy="7" r="4" />
                                </svg>
                            </div>
                            <div className="preceptor-action-content">
                                <h4>Gestión de Alumnos</h4>
                                <p>Ver información y seguimiento</p>
                            </div>
                            <div className="preceptor-action-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="preceptor-portal-footer">
                <p>© 2026 EscuelaApp - Portal Preceptores</p>
            </footer>
        </div>
    );
}
