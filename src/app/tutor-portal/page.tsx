'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import './tutor-portal.css';

interface Alumno {
    id: number;
    nombre: string;
    apellido: string;
    legajo: string;
    estado: string;
    curso: string;
}

interface TutorData {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    movil: string;
    alumnos: Alumno[];
}

interface AsistenciaRecord {
    id_evento: number;
    id_alumno: number;
    fecha: string;
    tipo_evento: 'Asistencia' | 'Tardanza' | 'Retiro' | 'Inasistencia';
    hora_registro: string | null;
    observaciones: string | null;
    justificacion: string | null;
    motivo_justificacion: string | null;
}

interface AsistenciaResumen {
    inasistencias_total: number;
    tardanzas_total: number;
    retiros_total: number;
    justificadas: number;
    totalRegistros: number;
}

interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    fecha: string;
    importancia: 'alta' | 'media' | 'baja'; // alta=rojo, media=naranja, baja=verde
    leida: boolean;
}

type ViewType = 'notifications' | 'list' | 'student' | 'asistencias';

export default function TutorPortalPage() {
    const router = useRouter();
    const [tutorData, setTutorData] = useState<TutorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>('notifications');
    const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([]);
    const [resumen, setResumen] = useState<AsistenciaResumen | null>(null);
    const [loadingAsistencias, setLoadingAsistencias] = useState(false);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('tutorAuthenticated');
        const data = localStorage.getItem('tutorData');

        if (!isAuthenticated || !data) {
            router.push('/tutor-login');
            return;
        }

        try {
            setTutorData(JSON.parse(data));
        } catch (e) {
            console.error('Error parsing tutor data:', e);
            router.push('/tutor-login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const fetchNotificacionesCount = async () => {
            try {
                const userId = localStorage.getItem('userId');
                // En el portal de tutor, el rol debería ser 6 (TUTOR) basado en los datos de la notificación
                const userRole = localStorage.getItem('tutorIdRol') || 'null';

                if (!userId) {
                    console.log('🔍 No hay userId en localStorage');
                    return;
                }

                const response = await fetch(`/api/notificaciones/tutor?userId=${userId}&userRole=${userRole}`);
                const data = await response.json();

                if (data.success) {
                    const unreadCount = data.data.filter((n: any) => !n.leida).length;
                    const totalCount = data.data.length;

                    console.log(`📊 Tutor Portal: ${unreadCount}/${totalCount} notificaciones no leídas`);
                    setNotificacionesPendientes(unreadCount);

                    // Actualizar notificaciones con datos reales
                    const realNotifications = data.data.map((n: any) => ({
                        id: n.id,
                        titulo: n.titulo,
                        mensaje: n.mensaje,
                        fecha: new Date(n.fecha_creacion).toISOString().split('T')[0],
                        importancia: (n.importancia || 'BAJA').toLowerCase() as Notificacion['importancia'],
                        leida: n.leida
                    }));

                    setNotificaciones(realNotifications);
                } else {
                    console.error('❌ Error en API de notificaciones:', data.error);
                }
            } catch (error) {
                console.error('💥 Error fetching notifications count:', error);
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
        localStorage.removeItem('tutorAuthenticated');
        localStorage.removeItem('tutorData');
        localStorage.removeItem('tutorDni');
        router.push('/tutor-login');
    };

    const handleSelectAlumno = (alumno: Alumno) => {
        setSelectedAlumno(alumno);
        setCurrentView('student');
    };

    const handleBackToList = () => {
        setSelectedAlumno(null);
        setCurrentView('list');
        setAsistencias([]);
        setResumen(null);
    };

    const handleBackToStudent = () => {
        setCurrentView('student');
    };

    const handleContinueToList = () => {
        setCurrentView('list');
    };

    const getNotificacionIcon = (importancia: Notificacion['importancia']) => {
        switch (importancia) {
            case 'alta': // Rojo - Muy importante
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'media': // Naranja - Medianamente importante
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
            case 'baja': // Verde - Importancia mínima
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
        }
    };

    const getImportanciaLabel = (importancia: Notificacion['importancia']) => {
        switch (importancia) {
            case 'alta': return 'Muy Importante';
            case 'media': return 'Importante';
            case 'baja': return 'Informativo';
        }
    };

    const formatNotificacionDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        const diffTime = today.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    };

    const fetchAsistencias = async (alumnoId: number) => {
        setLoadingAsistencias(true);
        try {
            // Fetch attendance records
            const [recordsRes, resumenRes] = await Promise.all([
                fetch(`/api/asistencias?id_alumno=${alumnoId}`),
                fetch(`/api/asistencias?id_alumno=${alumnoId}&acumulado=true`)
            ]);

            if (recordsRes.ok) {
                const data = await recordsRes.json();
                setAsistencias(data);
            }

            if (resumenRes.ok) {
                const data = await resumenRes.json();
                setResumen(data);
            }

            setCurrentView('asistencias');
        } catch (error) {
            console.error('Error fetching asistencias:', error);
        } finally {
            setLoadingAsistencias(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return localDate.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getTipoEventoStyle = (tipo: string) => {
        switch (tipo) {
            case 'Inasistencia':
                return 'tutor-badge-error';
            case 'Tardanza':
                return 'tutor-badge-warning';
            case 'Retiro':
                return 'tutor-badge-info';
            default:
                return 'tutor-badge-success';
        }
    };

    if (loading) {
        return (
            <div className="tutor-portal-loading">
                <div className="tutor-portal-spinner"></div>
                <p>Cargando información...</p>
            </div>
        );
    }

    if (!tutorData) {
        return null;
    }

    return (
        <div className="tutor-portal-container">
            {/* Header */}
            <header className="tutor-portal-header">
                <div className="tutor-portal-header-left">
                    <div className="tutor-portal-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="tutor-portal-title">
                        <h1>Portal de Tutores</h1>
                        <p>Bienvenido/a, {tutorData.nombre} {tutorData.apellido}</p>
                    </div>
                </div>
                <div className="tutor-portal-header-right">
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
                    <button onClick={handleLogout} className="tutor-logout-btn">
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
            <main className="tutor-portal-main">
                {currentView === 'notifications' && (
                    /* Vista de notificaciones/comunicados */
                    <>
                        <div className="tutor-notifications-header animate-fade-in">
                            <div className="tutor-notifications-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    <circle cx="18" cy="5" r="3" fill="#ef4444" stroke="#ef4444" />
                                </svg>
                            </div>
                            <div className="tutor-notifications-title">
                                <h2>Comunicados del Colegio</h2>
                                <p>Tienes {notificaciones.filter(n => !n.leida).length} comunicados sin leer</p>
                            </div>
                        </div>

                        <section className="tutor-notifications-section animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <div className="tutor-notifications-list">
                                {notificaciones.map((notif, index) => (
                                    <div
                                        key={notif.id}
                                        className={`tutor-notification-card tutor-notification-${notif.importancia} ${!notif.leida ? 'tutor-notification-unread' : ''} animate-fade-in`}
                                        style={{ animationDelay: `${(index + 2) * 100}ms` }}
                                    >
                                        <div className={`tutor-notification-icon-wrapper tutor-notification-icon-${notif.importancia}`}>
                                            {getNotificacionIcon(notif.importancia)}
                                        </div>
                                        <div className="tutor-notification-content">
                                            <div className="tutor-notification-header">
                                                <h4>{notif.titulo}</h4>
                                                <div className="tutor-notification-meta">
                                                    <span className={`tutor-importance-badge tutor-importance-${notif.importancia}`}>
                                                        {getImportanciaLabel(notif.importancia)}
                                                    </span>
                                                    <span className="tutor-notification-date">
                                                        {formatNotificacionDate(notif.fecha)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="tutor-notification-message">{notif.mensaje}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="tutor-notifications-action animate-fade-in" style={{ animationDelay: '400ms' }}>
                            <button
                                className="tutor-continue-btn"
                                onClick={handleContinueToList}
                            >
                                <span>Continuar al Portal</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}

                {currentView === 'list' && (
                    /* Vista de selección de alumnos */
                    <>
                        {/* Welcome Card */}
                        <div className="tutor-welcome-card animate-fade-in">
                            <div className="tutor-welcome-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 19.1213 16.1716C18.662 15.4214 18.0609 15 17 15H7C5.93913 15 5.33803 15.4214 4.87868 16.1716C4.41929 16.9217 4 17.9391 4 19V21" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div className="tutor-welcome-info">
                                <h2>{tutorData.nombre} {tutorData.apellido}</h2>
                                <p>DNI: {tutorData.dni}</p>
                                {tutorData.movil && <p>Móvil: {tutorData.movil}</p>}
                            </div>
                        </div>

                        {/* Students Section */}
                        <section className="tutor-students-section animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <h3 className="tutor-section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" />
                                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" />
                                </svg>
                                Selecciona un alumno ({tutorData.alumnos.length})
                            </h3>
                            <p className="tutor-section-hint">Toca un alumno para ver sus opciones</p>

                            {tutorData.alumnos.length > 0 ? (
                                <div className="tutor-students-grid">
                                    {tutorData.alumnos.map((alumno, index) => (
                                        <button
                                            key={alumno.id}
                                            className="tutor-student-card tutor-student-card-selectable animate-fade-in"
                                            style={{ animationDelay: `${(index + 2) * 100}ms` }}
                                            onClick={() => handleSelectAlumno(alumno)}
                                        >
                                            <div className="tutor-student-avatar">
                                                {alumno.nombre[0]}{alumno.apellido[0]}
                                            </div>
                                            <div className="tutor-student-info">
                                                <h4>{alumno.apellido}, {alumno.nombre}</h4>
                                                <p className="tutor-student-legajo">Legajo: {alumno.legajo}</p>
                                                <div className="tutor-student-badges">
                                                    <span className="tutor-badge tutor-badge-curso">{alumno.curso}</span>
                                                    <span className={`tutor-badge ${alumno.estado === 'Regular' ? 'tutor-badge-success' :
                                                        alumno.estado === 'Libre' ? 'tutor-badge-warning' :
                                                            'tutor-badge-neutral'
                                                        }`}>
                                                        {alumno.estado}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="tutor-student-arrow">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="tutor-no-students">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p>No hay alumnos asignados a su cargo.</p>
                                    <span>Contacte a secretaría si cree que esto es un error.</span>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {currentView === 'student' && selectedAlumno && (
                    /* Vista de alumno seleccionado con acciones */
                    <>
                        {/* Back Button */}
                        <button
                            className="tutor-back-btn animate-fade-in"
                            onClick={handleBackToList}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                            </svg>
                            Volver a mis hijos
                        </button>

                        {/* Selected Student Card */}
                        <div className="tutor-selected-student-card animate-fade-in">
                            <div className="tutor-selected-avatar">
                                {selectedAlumno.nombre[0]}{selectedAlumno.apellido[0]}
                            </div>
                            <div className="tutor-selected-info">
                                <h2>{selectedAlumno.apellido}, {selectedAlumno.nombre}</h2>
                                <div className="tutor-selected-details">
                                    <span>Legajo: {selectedAlumno.legajo}</span>
                                    <span className="tutor-badge tutor-badge-curso">{selectedAlumno.curso}</span>
                                    <span className={`tutor-badge ${selectedAlumno.estado === 'Regular' ? 'tutor-badge-success' :
                                        selectedAlumno.estado === 'Libre' ? 'tutor-badge-warning' :
                                            'tutor-badge-neutral'
                                        }`}>
                                        {selectedAlumno.estado}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions for Selected Student */}
                        <section className="tutor-quick-actions animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <h3 className="tutor-section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                ¿Qué deseas consultar?
                            </h3>
                            <div className="tutor-actions-grid tutor-actions-grid-large">
                                <button
                                    className="tutor-quick-action-btn tutor-quick-action-btn-large"
                                    onClick={() => fetchAsistencias(selectedAlumno.id)}
                                    disabled={loadingAsistencias}
                                >
                                    <div className="tutor-quick-action-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    <span>{loadingAsistencias ? 'Cargando...' : 'Ver Asistencias'}</span>
                                    <p className="tutor-action-description">Consulta el registro de asistencias</p>
                                </button>
                                <button className="tutor-quick-action-btn tutor-quick-action-btn-large">
                                    <div className="tutor-quick-action-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" />
                                            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" />
                                        </svg>
                                    </div>
                                    <span>Calificaciones</span>
                                    <p className="tutor-action-description">Revisa notas y evaluaciones</p>
                                </button>
                                <button
                                    className="tutor-quick-action-btn tutor-quick-action-btn-large"
                                    onClick={() => setCurrentView('notifications')}
                                >
                                    <div className="tutor-quick-action-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" />
                                        </svg>
                                    </div>
                                    <span>Comunicados</span>
                                    <p className="tutor-action-description">Mensajes de la escuela</p>
                                </button>

                            </div>
                        </section>
                    </>
                )}

                {currentView === 'asistencias' && selectedAlumno && (
                    /* Vista de asistencias del alumno */
                    <>
                        {/* Back Button */}
                        <button
                            className="tutor-back-btn animate-fade-in"
                            onClick={handleBackToStudent}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                            </svg>
                            Volver a opciones
                        </button>

                        {/* Student Mini Card */}
                        <div className="tutor-student-mini-card animate-fade-in">
                            <div className="tutor-student-mini-avatar">
                                {selectedAlumno.nombre[0]}{selectedAlumno.apellido[0]}
                            </div>
                            <div className="tutor-student-mini-info">
                                <h3>{selectedAlumno.apellido}, {selectedAlumno.nombre}</h3>
                                <span>{selectedAlumno.curso}</span>
                            </div>
                        </div>

                        {/* Resumen de Asistencias */}
                        {resumen && (
                            <section className="tutor-asistencias-resumen animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <h3 className="tutor-section-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 21H3V3" />
                                        <path d="M21 9L15 15L9 9L3 15" />
                                    </svg>
                                    Resumen del Año
                                </h3>
                                <div className="tutor-stats-grid">
                                    <div className="tutor-stat-card tutor-stat-error">
                                        <div className="tutor-stat-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                        </div>
                                        <div className="tutor-stat-value">{resumen.inasistencias_total}</div>
                                        <div className="tutor-stat-label">Inasistencias</div>
                                    </div>
                                    <div className="tutor-stat-card tutor-stat-warning">
                                        <div className="tutor-stat-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div className="tutor-stat-value">{resumen.tardanzas_total}</div>
                                        <div className="tutor-stat-label">Tardanzas</div>
                                    </div>
                                    <div className="tutor-stat-card tutor-stat-info">
                                        <div className="tutor-stat-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" y1="12" x2="9" y2="12" />
                                            </svg>
                                        </div>
                                        <div className="tutor-stat-value">{resumen.retiros_total}</div>
                                        <div className="tutor-stat-label">Retiros</div>
                                    </div>
                                    <div className="tutor-stat-card tutor-stat-success">
                                        <div className="tutor-stat-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </div>
                                        <div className="tutor-stat-value">{resumen.justificadas}</div>
                                        <div className="tutor-stat-label">Justificadas</div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Historial de Asistencias - Últimos 3 registros */}
                        <section className="tutor-asistencias-historial animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <h3 className="tutor-section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Últimos Registros
                            </h3>

                            {asistencias.length > 0 ? (
                                <>
                                    <div className="tutor-asistencias-list">
                                        {asistencias.slice(0, 3).map((asistencia) => (
                                            <div key={asistencia.id_evento} className="tutor-asistencia-item">
                                                <div className="tutor-asistencia-date">
                                                    <span className="tutor-asistencia-day">
                                                        {formatDate(asistencia.fecha)}
                                                    </span>
                                                    {asistencia.hora_registro && (
                                                        <span className="tutor-asistencia-time">
                                                            {asistencia.hora_registro}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="tutor-asistencia-info">
                                                    <span className={`tutor-badge ${getTipoEventoStyle(asistencia.tipo_evento)}`}>
                                                        {asistencia.tipo_evento}
                                                    </span>
                                                    {asistencia.justificacion && (
                                                        <span className="tutor-badge tutor-badge-success">
                                                            Justificado
                                                        </span>
                                                    )}
                                                </div>
                                                {(asistencia.observaciones || asistencia.motivo_justificacion) && (
                                                    <div className="tutor-asistencia-obs">
                                                        {asistencia.motivo_justificacion && (
                                                            <p><strong>Motivo:</strong> {asistencia.motivo_justificacion}</p>
                                                        )}
                                                        {asistencia.observaciones && (
                                                            <p><strong>Obs:</strong> {asistencia.observaciones}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {asistencias.length > 3 && (
                                        <div className="tutor-asistencias-more">
                                            <span>+{asistencias.length - 3} registros anteriores</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="tutor-no-asistencias">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <p>¡Excelente! No hay registros de inasistencias.</p>
                                    <span>El alumno tiene asistencia perfecta.</span>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="tutor-portal-footer">
                <p>© 2026 EscuelaApp - Portal de Tutores</p>
            </footer>
        </div>
    );
}
