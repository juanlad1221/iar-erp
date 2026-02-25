'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import './docente-portal.css';

interface Asignacion {
    id: number;
    materia: string;
    curso: string;
    id_curso: number;
    id_materia: number;
}

interface DocenteData {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    movil: string;
    asignaciones: Asignacion[];
}

interface InstanciaEvaluativa {
    id_instancia: number;
    nombre: string;
    active: boolean;
}

interface Comunicado {
    id: number;
    titulo: string;
    mensaje: string;
    fecha: string;
    tipo: 'urgente' | 'importante' | 'informativo';
}

interface Alumno {
    id_alumno: number;
    legajo: string;
    nombre: string;
    apellido: string;
    dni: string;
}

interface NotaAlumno {
    id_alumno: number;
    nota: string;
}

type ViewType = 'info' | 'home' | 'cargar-notas';

export default function DocentePortalPage() {
    const router = useRouter();
    const [docenteData, setDocenteData] = useState<DocenteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<ViewType>('info');
    const [instancias, setInstancias] = useState<InstanciaEvaluativa[]>([]);
    const [loadingInstancias, setLoadingInstancias] = useState(false);
    const [comunicados, setComunicados] = useState<Comunicado[]>([]);
    const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);

    // Estados para carga de notas
    const [instanciaSeleccionada, setInstanciaSeleccionada] = useState<InstanciaEvaluativa | null>(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<Asignacion | null>(null);
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [notas, setNotas] = useState<NotaAlumno[]>([]);
    const [loadingAlumnos, setLoadingAlumnos] = useState(false);
    const [guardandoNotas, setGuardandoNotas] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [asignacionesCargadas, setAsignacionesCargadas] = useState<Set<string>>(new Set()); // "id_materia-id_curso"
    const [loadingAsignacionesCargadas, setLoadingAsignacionesCargadas] = useState(false);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('docenteAuthenticated');
        const data = localStorage.getItem('docenteData');

        if (!isAuthenticated || !data) {
            router.push('/docente-login');
            return;
        }

        try {
            const parsedData = JSON.parse(data);
            setDocenteData(parsedData);
        } catch (e) {
            console.error('Error parsing docente data:', e);
            router.push('/docente-login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const fetchNotificacionesCount = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const userRole = localStorage.getItem('activeRole');

                if (!userId || !userRole) {
                    console.log('🔍 Docente Portal: No hay userId o userRole en localStorage');
                    return;
                }

                const response = await fetch(`/api/notificaciones/docente?userId=${userId}&userRole=${userRole}`);
                const data = await response.json();

                if (data.success) {
                    console.log('333333', data)
                    const unreadCount = data.data.filter((n: any) => !n.leida).length;
                    const totalCount = data.data.length;

                    console.log(`📊 Docente Portal: ${unreadCount}/${totalCount} notificaciones no leídas`);
                    setNotificacionesPendientes(unreadCount);

                    // Actualizar comunicados si hay datos reales
                    if (data.data.length > 0) {
                        const realComunicados = data.data.slice(0, 4).map((n: any) => ({
                            id: n.id,
                            titulo: n.titulo,
                            mensaje: n.mensaje,
                            fecha: new Date(n.fecha_creacion).toISOString().split('T')[0],
                            tipo: n.importancia === 'ALTA' && 'urgente' || n.importancia === 'MEDIA' && 'importante' || n.importancia === 'BAJA' && 'informativo'
                        }));

                        // Actualizar comunicados con datos reales
                        setComunicados(realComunicados);
                    }
                } else {
                    console.error('❌ Error en API de notificaciones (Docente):', data.error);
                }
            } catch (error) {
                console.error('💥 Error fetching notifications count (Docente):', error);
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
        localStorage.removeItem('docenteAuthenticated');
        localStorage.removeItem('docenteData');
        localStorage.removeItem('docenteDni');
        router.push('/docente-login');
    };

    const handleContinueToHome = async () => {
        setCurrentView('home');
        await fetchInstancias();
    };

    const fetchInstancias = async () => {
        setLoadingInstancias(true);
        try {
            const response = await fetch('/api/instancias-evaluativas');
            if (response.ok) {
                const data = await response.json();
                // Filtrar solo las activas
                setInstancias(data.filter((inst: InstanciaEvaluativa) => inst.active));
            }
        } catch (error) {
            console.error('Error fetching instancias:', error);
        } finally {
            setLoadingInstancias(false);
        }
    };

    const handleCargarNotas = async (instancia: InstanciaEvaluativa) => {
        setInstanciaSeleccionada(instancia);
        setAsignacionSeleccionada(null);
        setAlumnos([]);
        setNotas([]);
        setMensajeExito('');
        setCurrentView('cargar-notas');

        // Consultar qué asignaciones ya tienen notas cargadas para esta instancia
        setLoadingAsignacionesCargadas(true);
        try {
            const response = await fetch(`/api/notas?id_instancia=${instancia.id_instancia}&id_docente=${docenteData?.id}`);
            if (response.ok) {
                const notasCargadas = await response.json();
                // Crear un Set con las combinaciones "id_materia-id_curso" que ya tienen notas
                const cargadas = new Set<string>();

                // Agrupar por materia Y curso, verificar si hay al menos una nota
                notasCargadas.forEach((nota: any) => {
                    if (nota.id_materia && nota.id_curso && nota.nota !== null) {
                        cargadas.add(`${nota.id_materia}-${nota.id_curso}`);
                    }
                });

                setAsignacionesCargadas(cargadas);
            }
        } catch (error) {
            console.error('Error checking loaded grades:', error);
        } finally {
            setLoadingAsignacionesCargadas(false);
        }
    };

    const handleSeleccionarAsignacion = async (asignacion: Asignacion) => {
        setAsignacionSeleccionada(asignacion);
        setLoadingAlumnos(true);
        setMensajeExito('');

        try {
            const response = await fetch(`/api/alumnos-por-curso?id_curso=${asignacion.id_curso}`);
            if (response.ok) {
                const data = await response.json();
                setAlumnos(data);
                // Inicializar notas vacías
                setNotas(data.map((a: Alumno) => ({ id_alumno: a.id_alumno, nota: '' })));
            }
        } catch (error) {
            console.error('Error fetching alumnos:', error);
        } finally {
            setLoadingAlumnos(false);
        }
    };

    const handleNotaChange = (id_alumno: number, valor: string) => {
        // Solo permitir números del 1 al 10
        if (valor === '' || (/^\d+$/.test(valor) && parseInt(valor) >= 1 && parseInt(valor) <= 10)) {
            setNotas(prev => prev.map(n =>
                n.id_alumno === id_alumno ? { ...n, nota: valor } : n
            ));
        }
    };

    const handleGuardarNotas = async () => {
        if (!instanciaSeleccionada || !asignacionSeleccionada) return;

        setGuardandoNotas(true);
        setMensajeExito('');

        try {
            const response = await fetch('/api/notas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notas: notas.filter(n => n.nota !== ''),
                    id_instancia: instanciaSeleccionada.id_instancia,
                    id_materia: asignacionSeleccionada.id_materia,
                    id_docente: docenteData?.id,
                    id_curso: asignacionSeleccionada.id_curso
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMensajeExito(`✓ ${data.mensaje}`);

                // Marcar esta asignación como cargada
                const key = `${asignacionSeleccionada.id_materia}-${asignacionSeleccionada.id_curso}`;
                setAsignacionesCargadas(prev => new Set([...prev, key]));

                // Volver a la pantalla de instancias después de 1.5 segundos
                setTimeout(() => {
                    handleVolverAHome();
                }, 1500);
            }
        } catch (error) {
            console.error('Error guardando notas:', error);
        } finally {
            setGuardandoNotas(false);
        }
    };

    const handleVolverAHome = () => {
        setCurrentView('home');
        setInstanciaSeleccionada(null);
        setAsignacionSeleccionada(null);
        setAlumnos([]);
        setNotas([]);
        setMensajeExito('');
    };

    if (loading) {
        return (
            <div className="docente-portal-loading">
                <div className="docente-portal-spinner"></div>
                <p>Cargando información...</p>
            </div>
        );
    }

    if (!docenteData) {
        return null;
    }

    return (
        <div className="docente-portal-container">
            {/* Header */}
            <header className="docente-portal-header">
                <div className="docente-portal-header-left">
                    <div className="docente-portal-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 13H13M7 17H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="docente-portal-title">
                        <h1>Portal Docente</h1>
                        <p>Bienvenido/a, {docenteData.nombre} {docenteData.apellido}</p>
                    </div>
                </div>
                <div className="docente-portal-header-right">
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
                    <button onClick={handleLogout} className="docente-logout-btn">
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
            <main className="docente-portal-main">
                {currentView === 'info' && (
                    /* Vista de información inicial - Estilo similar al portal de tutores */
                    <>
                        {/* Header con gradiente */}
                        <div className="docente-info-hero animate-fade-in">
                            <div className="docente-info-hero-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                            <div className="docente-info-hero-content">
                                <h2>Bienvenido al Portal Docente</h2>
                                <p>Información del sistema y novedades importantes</p>
                            </div>
                        </div>

                        {/* Card de perfil del docente */}
                        <section className="docente-profile-section animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <div className="docente-profile-hero-card">
                                <div className="docente-profile-hero-avatar">
                                    {docenteData.nombre[0]}{docenteData.apellido[0]}
                                </div>
                                <div className="docente-profile-hero-info">
                                    <h3>{docenteData.nombre} {docenteData.apellido}</h3>
                                    <div className="docente-profile-hero-details">
                                        <span className="docente-profile-detail">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            DNI: {docenteData.dni}
                                        </span>
                                        {docenteData.movil && (
                                            <span className="docente-profile-detail">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                                    <line x1="12" y1="18" x2="12.01" y2="18" />
                                                </svg>
                                                {docenteData.movil}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>


                        {/* Comunicados */}
                        <section className="docente-comunicados-section animate-fade-in" style={{ animationDelay: '400ms' }}>
                            <h3 className="docente-section-hero-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                Comunicados Institucionales ({comunicados.length})
                            </h3>
                            <p className="docente-section-hero-hint">Novedades y avisos importantes</p>

                            <div className="docente-comunicados-list">
                                {comunicados.map((comunicado, index) => (
                                    <div
                                        key={comunicado.id}
                                        className={`docente-comunicado-card docente-comunicado-${comunicado.tipo} animate-fade-in`}
                                        style={{ animationDelay: `${(index + 5) * 100}ms` }}
                                    >
                                        <div className={`docente-comunicado-icon docente-comunicado-icon-${comunicado.tipo}`}>
                                            {comunicado.tipo === 'urgente' && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            )}
                                            {comunicado.tipo === 'importante' && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            )}
                                            {comunicado.tipo === 'informativo' && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="docente-comunicado-content">
                                            <div className="docente-comunicado-header">
                                                <h4>{comunicado.titulo}</h4>
                                                <div className="docente-comunicado-meta">
                                                    <span className={`docente-badge-hero docente-badge-hero-${comunicado.tipo}`}>
                                                        {comunicado.tipo === 'urgente' ? 'Urgente' : comunicado.tipo === 'importante' ? 'Importante' : 'Info'}
                                                    </span>
                                                    <span className="docente-comunicado-fecha">
                                                        {new Date(comunicado.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="docente-comunicado-mensaje">{comunicado.mensaje}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Botón de continuar */}
                        <div className="docente-continue-hero-action animate-fade-in" style={{ animationDelay: '600ms' }}>
                            <button
                                className="docente-continue-hero-btn"
                                onClick={handleContinueToHome}
                            >
                                <span>Continuar al Portal</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}

                {currentView === 'home' && (
                    /* Vista Home con tabla de instancias evaluativas */
                    <>
                        {/* Back Button */}
                        <button
                            className="docente-back-btn animate-fade-in"
                            onClick={() => setCurrentView('info')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                            </svg>
                            Volver a información
                        </button>

                        {/* Docente Mini Card */}
                        <div className="docente-mini-card animate-fade-in">
                            <div className="docente-mini-avatar">
                                {docenteData.nombre[0]}{docenteData.apellido[0]}
                            </div>
                            <div className="docente-mini-info">
                                <h3>{docenteData.apellido}, {docenteData.nombre}</h3>
                                <span>{docenteData.asignaciones.length} asignaciones</span>
                            </div>
                        </div>

                        {/* Instancias Evaluativas Section */}
                        <section className="docente-instancias-section animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <h3 className="docente-section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11L12 14L22 4" />
                                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" />
                                </svg>
                                Instancias Evaluativas Activas
                            </h3>

                            {loadingInstancias ? (
                                <div className="docente-loading-instancias">
                                    <div className="docente-portal-spinner"></div>
                                    <p>Cargando instancias...</p>
                                </div>
                            ) : instancias.length > 0 ? (
                                <div className="docente-table-wrapper">
                                    <table className="docente-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {instancias.map((instancia) => (
                                                <tr key={instancia.id_instancia}>
                                                    <td className="docente-table-id">{instancia.id_instancia}</td>
                                                    <td className="docente-table-nombre">{instancia.nombre}</td>
                                                    <td>
                                                        <span className="docente-badge docente-badge-active">
                                                            Activa
                                                        </span>
                                                    </td>
                                                    <td className="docente-table-actions">
                                                        <button
                                                            className="action-icon"
                                                            title="Cargar Notas"
                                                            onClick={() => handleCargarNotas(instancia)}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="docente-no-instancias">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p>No hay instancias evaluativas activas</p>
                                    <span>Las instancias aparecerán aquí cuando estén disponibles</span>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {currentView === 'cargar-notas' && instanciaSeleccionada && (
                    /* Vista de Carga de Notas */
                    <>
                        {/* Back Button */}
                        <button
                            className="docente-back-btn animate-fade-in"
                            onClick={handleVolverAHome}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                            </svg>
                            Volver a instancias
                        </button>

                        {/* Header de la instancia */}
                        <div className="docente-notas-header animate-fade-in">
                            <div className="docente-notas-header-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </div>
                            <div className="docente-notas-header-content">
                                <h2>Carga de Notas</h2>
                                <p>Instancia: <strong>{instanciaSeleccionada.nombre}</strong></p>
                            </div>
                        </div>

                        {/* Selector de Materia y Curso */}
                        <section className="docente-selector-section animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <h3 className="docente-section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                                Selecciona Materia y Curso
                            </h3>

                            {loadingAsignacionesCargadas ? (
                                <div className="docente-loading-instancias" style={{ padding: 'var(--spacing-lg)' }}>
                                    <div className="docente-portal-spinner"></div>
                                    <p>Verificando cursos cargados...</p>
                                </div>
                            ) : docenteData && docenteData.asignaciones.length > 0 ? (
                                <div className="docente-asignaciones-selector">
                                    {docenteData.asignaciones.map((asig) => {
                                        const key = `${asig.id_materia}-${asig.id_curso}`;
                                        const estaCargada = asignacionesCargadas.has(key);

                                        return (
                                            <button
                                                key={asig.id}
                                                className={`docente-asignacion-btn ${asignacionSeleccionada?.id === asig.id ? 'docente-asignacion-btn-active' : ''} ${estaCargada ? 'docente-asignacion-btn-cargada' : ''}`}
                                                onClick={() => !estaCargada && handleSeleccionarAsignacion(asig)}
                                                disabled={estaCargada}
                                            >
                                                {estaCargada && (
                                                    <div className="docente-asignacion-check">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className="docente-asignacion-btn-materia">{asig.materia}</span>
                                                <span className="docente-asignacion-btn-curso">{asig.curso}</span>
                                                {estaCargada && (
                                                    <span className="docente-asignacion-btn-estado">✓ Cargado</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="docente-no-asignaciones">No tienes asignaciones disponibles</p>
                            )}
                        </section>

                        {/* Lista de Alumnos para cargar notas */}
                        {asignacionSeleccionada && (
                            <section className="docente-alumnos-section animate-fade-in" style={{ animationDelay: '200ms' }}>
                                <div className="docente-alumnos-header">
                                    <h3 className="docente-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" />
                                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" />
                                        </svg>
                                        Alumnos - {asignacionSeleccionada.materia} ({asignacionSeleccionada.curso})
                                    </h3>
                                    <span className="docente-alumnos-count">{alumnos.length} alumnos</span>
                                </div>

                                {mensajeExito && (
                                    <div className="docente-mensaje-exito animate-fade-in">
                                        {mensajeExito}
                                    </div>
                                )}

                                {!mensajeExito && notas.length > 0 && notas.some(n => n.nota === '') && (
                                    <div className="docente-mensaje-advertencia" style={{
                                        padding: '12px 16px',
                                        marginBottom: '16px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(255, 193, 7, 0.15)',
                                        border: '1px solid rgba(255, 193, 7, 0.3)',
                                        color: '#ffc107',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                            <line x1="12" y1="9" x2="12" y2="13"></line>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        Faltan {notas.filter(n => n.nota === '').length} de {notas.length} notas por cargar. Todos los alumnos deben tener nota.
                                    </div>
                                )}

                                {loadingAlumnos ? (
                                    <div className="docente-loading-instancias">
                                        <div className="docente-portal-spinner"></div>
                                        <p>Cargando alumnos...</p>
                                    </div>
                                ) : alumnos.length > 0 ? (
                                    <>
                                        <div className="docente-notas-table-wrapper">
                                            <table className="docente-table docente-notas-table">
                                                <thead>
                                                    <tr>
                                                        <th>Legajo</th>
                                                        <th>Apellido y Nombre</th>
                                                        <th>DNI</th>
                                                        <th className="docente-th-nota">Nota</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {alumnos.map((alumno) => {
                                                        const notaActual = notas.find(n => n.id_alumno === alumno.id_alumno);
                                                        return (
                                                            <tr key={alumno.id_alumno}>
                                                                <td className="docente-table-legajo">{alumno.legajo}</td>
                                                                <td className="docente-table-nombre-alumno">
                                                                    {alumno.apellido}, {alumno.nombre}
                                                                </td>
                                                                <td className="docente-table-dni">{alumno.dni}</td>
                                                                <td className="docente-table-nota">
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={10}
                                                                        className="docente-nota-input"
                                                                        placeholder="1-10"
                                                                        value={notaActual?.nota || ''}
                                                                        onChange={(e) => handleNotaChange(alumno.id_alumno, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="docente-notas-actions">
                                            <button
                                                className="docente-btn-guardar-notas"
                                                onClick={handleGuardarNotas}
                                                disabled={guardandoNotas || notas.some(n => n.nota === '')}
                                                title={notas.some(n => n.nota === '') ? 'Todos los alumnos deben tener una nota' : ''}
                                            >
                                                {guardandoNotas ? (
                                                    <>
                                                        <span className="docente-portal-spinner" style={{ width: 18, height: 18 }}></span>
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                            <polyline points="17 21 17 13 7 13 7 21" />
                                                            <polyline points="7 3 7 8 15 8" />
                                                        </svg>
                                                        Guardar Notas
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="docente-no-instancias">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <p>No hay alumnos en este curso</p>
                                        <span>Selecciona otra asignación</span>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="docente-portal-footer">
                <p>© 2026 EscuelaApp - Portal Docente</p>
            </footer>
        </div>
    );
}
