'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';

type TipoAsistencia = '' | 'Asistencia' | 'Tardanza' | 'Retiro' | 'Inasistencia';

interface AlumnoAsistencia {
    id_alumno: number;
    persona: {
        name: string;
        lastName: string;
    };
    asistencias: {
        tipo_evento: TipoAsistencia;
        hora_registro?: string;
        observaciones?: string;
        justificacion?: string;
        motivo_justificacion?: string;
    }[];
}

export default function AsistenciaPage() {
    const [view, setView] = useState<'list' | 'record'>('list');
    const [cursos, setCursos] = useState<any[]>([]);
    const [selectedCurso, setSelectedCurso] = useState('');
    const [fecha, setFecha] = useState(() => {
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return localDate.toISOString().split('T')[0];
    });
    const [alumnos, setAlumnos] = useState<AlumnoAsistencia[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<Record<number, { tipo: TipoAsistencia, hora: string, obs: string, justificado: string, motivo: string }>>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [filterCurso, setFilterCurso] = useState('');
    const [filterFecha, setFilterFecha] = useState('');
    const [prefillExisting, setPrefillExisting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showJustifyModal, setShowJustifyModal] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [justificationReason, setJustificationReason] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (view === 'list') {
            setNotification(null);
            setShowConfirmModal(false);
            setShowJustifyModal(false);
            setAttendanceMap({});
            setFilterCurso('');
            setFilterFecha('');
            setPrefillExisting(false);
        }
    }, [view]);

    // Obtener información del usuario desde localStorage
    useEffect(() => {
        const activeRole = localStorage.getItem('activeRole');
        const username = localStorage.getItem('username');
        const dni = localStorage.getItem('dni');
        const roles = localStorage.getItem('roles');
        const userId = localStorage.getItem('userId');

        if (activeRole && userId) {
            setUserRole(activeRole);
            setUserInfo({
                id: userId,
                username: username || '',
                dni: dni || '',
                name: username?.split(' ')[0] || '',
                lastName: username?.split(' ')[1] || '',
                roles: roles ? JSON.parse(roles) : [],
                activeRole: activeRole
            });
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!userInfo || !userRole) return; // Esperar a tener info del usuario y rol

            setLoading(true);
            try {
                // Fetch cursos según el rol usando la nueva API unificada
                const userId = userInfo.id || '';

                const cursosRes = await fetch(`/api/cursos-por-rol?userId=${userId}&userRole=${userRole}`);
                const cursosResponse = await cursosRes.json();

                if (cursosResponse.success) {
                    setCursos(cursosResponse.data);
                    if (cursosResponse.data.length > 0) {
                        setSelectedCurso(cursosResponse.data[0].id_curso.toString());
                    }
                } else {
                    console.error('Error fetching courses:', cursosResponse.error);
                    setCursos([]);
                }

                // Fetch history con filtrado según rol
                const historyUrl = userRole === 'PRECEPTOR' && userInfo?.id
                    ? `/api/asistencias-filtradas?historial=true&userId=${userInfo.id}&userRole=${userRole}`
                    : '/api/asistencias?historial=true';

                const historyRes = await fetch(historyUrl);
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setHistory(data);
                    setFilteredHistory(data);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userInfo && userRole) {
            fetchData();
        }
    }, [userInfo, userRole]);

    useEffect(() => {
        let filtered = history;

        if (filterCurso) {
            filtered = filtered.filter(item => {
                const curso = item.curso || item.alumno?.curso;
                return curso && curso.id_curso.toString() === filterCurso;
            });
        }

        if (filterFecha) {
            filtered = filtered.filter(item => item.fecha.split('T')[0] === filterFecha);
        }

        setFilteredHistory(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filterCurso, filterFecha, history]);

    useEffect(() => {
        // Fetch alumnos when switching when curso/fecha changes
        if (selectedCurso && fecha) {
            fetchAlumnos();
        }
    }, [selectedCurso, fecha]);

    useEffect(() => {
        // Fetch alumnos when switching to record view
        if (view === 'record') {
            fetchAlumnos();
        }
    }, [view]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredHistory.length / pageSize);
    const paginatedHistory = filteredHistory.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const fetchAlumnos = async () => {
        setLoading(true);
        try {
            console.log('Fetching alumnos for curso:', selectedCurso, 'fecha:', fecha);
            const res = await fetch(`/api/asistencias?id_curso=${selectedCurso}&fecha=${fecha}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Received alumnos:', data);
                setAlumnos(data);

                // Initialize map with optional prefill (when editing history)
                const newMap: any = {};
                data.forEach((al: AlumnoAsistencia) => {
                    const existing = al.asistencias[0];
                    newMap[al.id_alumno] = (prefillExisting && existing) ? {
                        tipo: existing?.tipo_evento || 'Asistencia',
                        hora: existing?.hora_registro || '',
                        obs: existing?.observaciones || '',
                        justificado: existing?.justificacion || '',
                        motivo: existing?.motivo_justificacion || ''
                    } : {
                        tipo: 'Asistencia',
                        hora: '',
                        obs: '',
                        justificado: '',
                        motivo: ''
                    };
                });
                setAttendanceMap(newMap);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (id: number, status: TipoAsistencia) => {
        setAttendanceMap(prev => ({
            ...prev,
            [id]: { ...prev[id], tipo: status }
        }));
    };

    const handleMetaChange = (id: number, field: 'hora' | 'obs' | 'motivo', value: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const justifyIndividual = async (id: number) => {
        setSelectedStudentId(id);
        setJustificationReason('');
        setShowJustifyModal(true);
    };

    const confirmJustification = async () => {
        if (!selectedStudentId || !justificationReason.trim()) {
            return;
        }

        try {
            const response = await fetch('/api/asistencias', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_alumno: selectedStudentId,
                    fecha: fecha,
                    justificacion: 'Justificado',
                    motivo_justificacion: justificationReason.trim()
                })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: 'Justificación registrada correctamente' });
                // Refresh current attendance data
                fetchAlumnos();
                setShowJustifyModal(false);
                setSelectedStudentId(null);
                setJustificationReason('');
            } else {
                setNotification({ type: 'error', message: 'Error al registrar justificación' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión al registrar justificación' });
        }
    };

    const cancelJustification = () => {
        setShowJustifyModal(false);
        setSelectedStudentId(null);
        setJustificationReason('');
    };

    const saveAttendance = async () => {
        // Show confirmation modal
        setShowConfirmModal(true);
    };

    const confirmSaveAttendance = async () => {
        setShowConfirmModal(false);
        setSaving(true);
        setNotification(null);
        try {
            const payload = {
                fecha: fecha,
                curso_id: selectedCurso,
                asistencias: Object.entries(attendanceMap)
                    .map(([id, data]) => ({
                        id_alumno: id,
                        tipo_evento: data.tipo,
                        hora_registro: data.hora,
                        observaciones: data.obs,
                        justificacion: data.justificado,
                        motivo_justificacion: data.motivo
                    }))
                    .filter(item => {
                        // Include all non-attendance records OR attendance records with additional data
                        return item.tipo_evento && (
                            item.tipo_evento !== 'Asistencia' ||
                            item.observaciones ||
                            item.hora_registro ||
                            item.justificacion ||
                            item.motivo_justificacion
                        );
                    })
            };

            const res = await fetch('/api/asistencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setNotification({ type: 'success', message: '¡Asistencia guardada con éxito!' });
                // Refresh history
                const historyRes = await fetch('/api/asistencias?historial=true');
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setHistory(data);
                }
                setView('list'); // Return to history list
                setPrefillExisting(false);
                setTimeout(() => setNotification(null), 3000);
            } else {
                if (res.status === 409) {
                    setNotification({ type: 'error', message: 'No puede tomarse asistencia: ya existe para este curso y fecha' });
                } else {
                    setNotification({ type: 'error', message: 'Error al guardar la asistencia' });
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            setNotification({ type: 'error', message: 'Error de conexión al servidor' });
        } finally {
            setSaving(false);
        }
    };

    const cancelSaveAttendance = () => {
        setShowConfirmModal(false);
    };

    const markAllAs = (status: TipoAsistencia) => {
        const newMap = { ...attendanceMap };
        alumnos.forEach(al => {
            newMap[al.id_alumno] = { ...newMap[al.id_alumno], tipo: status };
        });
        setAttendanceMap(newMap);
    };

    const handleEditHistory = (item: any) => {
        const curso = item.curso || item.alumno?.curso;
        const id = curso?.id_curso;
        const f = item.fecha;
        if (id && f) {
            router.push(`/estudiantes/asistencia/editar?id_curso=${id}&fecha=${encodeURIComponent(f)}`);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="estudiantes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>
                            {userRole === 'PRECEPTOR' ? 'Mis Cursos - Asistencia' : 'Toma de Asistencia'}
                        </h1>
                        <p>
                            {userRole === 'PRECEPTOR'
                                ? (view === 'list' ? 'Historial de asistencia de tus cursos asignados' : 'Registra la asistencia de los alumnos de tus cursos')
                                : (view === 'list' ? 'Historial de registros realizados' : 'Registra el ingreso y permanencia de los estudiantes')
                            }
                        </p>
                        {userRole === 'PRECEPTOR' && (
                            <div style={{
                                background: 'var(--primary-100)',
                                color: 'var(--primary-700)',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem',
                                marginTop: '8px',
                                border: '1px solid var(--primary-200)'
                            }}>
                                Mostrando solo los cursos que tienes asignados como preceptor
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        {view === 'list' && (
                            <button className="btn btn-primary" onClick={() => setView('record')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Nueva Asistencia
                            </button>
                        )}
                        {view === 'record' && (
                            <button className="btn" onClick={() => { 
                                setView('list'); 
                                setNotification(null); 
                                setAttendanceMap({}); 
                                setFilterCurso(''); 
                                setFilterFecha(''); 
                                setPrefillExisting(false);
                            }}>
                                Volver al Historial
                            </button>
                        )}
                    </div>
                </header>

                {notification && (
                    <div className="animate-fade-in" style={{ marginBottom: '20px' }}>
                        <div className={`badge ${notification.type === 'success' ? 'badge-success' : 'badge-warning'}`}
                            style={{ width: '100%', padding: 'var(--spacing-md)', textAlign: 'center', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}>
                            {notification.message}
                        </div>
                    </div>
                )}

                {view === 'list' ? (
                    <div className="animate-slide-in">
                        <div className="toolbar" style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'flex-end',
                            marginBottom: '30px',
                            flexWrap: 'wrap'
                        }}>
                            <div className="form-group" style={{
                                flex: '1',
                                minWidth: '150px'
                            }}>
                                <label>Filtrar por Curso</label>
                                <select className="input" value={filterCurso} onChange={(e) => setFilterCurso(e.target.value)}>
                                    <option value="">Todos los cursos</option>
                                    {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.anio}{c.division}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{
                                flex: '1',
                                minWidth: '150px'
                            }}>
                                <label>Filtrar por Fecha</label>
                                <input type="date" className="input" value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} />
                            </div>
                        </div>
                        <div className="table-card">
                            {loading && history.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>Cargando historial...</div>
                            ) : filteredHistory.length > 0 ? (
                                <>
                                    {/* Mobile Cards View */}
                                    <div className="mobile-cards" style={{ display: 'none' }}>
                                        {paginatedHistory.map((item, idx) => (
                                            <div key={idx} className="attendance-card" style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '16px',
                                                marginBottom: '12px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Fecha</div>
                                                        <div style={{ fontWeight: '600' }}>
                                                            {(() => {
                                                                const date = new Date(item.fecha);
                                                                const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                                                                return localDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Curso</div>
                                                        <span className="badge badge-neutral">
                                                            {(() => {
                                                                if (item.curso) {
                                                                    return `${item.curso.anio}° ${item.curso.division}`;
                                                                } else if (item.alumno?.curso) {
                                                                    return `${item.alumno.curso.anio}° ${item.alumno.curso.division}`;
                                                                } else {
                                                                    return 'Sin curso';
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleEditHistory(item)}>
                                                        Editar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="desktop-table">
                                        <table className="students-table">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Curso</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedHistory.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{(() => {
                                                            const date = new Date(item.fecha);
                                                            const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                                                            return localDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                        })()}</td>
                                                        <td>
                                                            <span className="badge badge-neutral">
                                                                {(() => {
                                                                    if (item.curso) {
                                                                        return `${item.curso.anio}° ${item.curso.division}`;
                                                                    } else if (item.alumno?.curso) {
                                                                        return `${item.alumno.curso.anio}° ${item.alumno.curso.division}`;
                                                                    } else {
                                                                        return 'Sin curso';
                                                                    }
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-primary" style={{ padding: '5px 15px', fontSize: '0.875rem' }} onClick={() => handleEditHistory(item)}>
                                                                Editar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div style={{
                                        padding: 'var(--spacing-lg)',
                                        borderTop: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            Mostrando {paginatedHistory.length} de {filteredHistory.length} registros
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                            <button
                                                className="btn"
                                                style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Anterior
                                            </button>
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)', fontWeight: '600' }}>
                                                Página {currentPage} de {totalPages || 1}
                                            </div>
                                            <button
                                                className="btn"
                                                style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <p style={{ fontSize: '1.1rem' }}>No hay registros de asistencia realizados aún</p>
                                    <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setView('record')}>
                                        Tomar Primera Asistencia
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-slide-in">
                        <div className="toolbar" style={{
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-end',
                            marginBottom: '30px',
                            flexWrap: 'wrap'
                        }}>
                            <div className="form-group" style={{
                                flex: '1',
                                minWidth: '150px'
                            }}>
                                <label>Curso</label>
                                <select className="input" value={selectedCurso} onChange={(e) => setSelectedCurso(e.target.value)}>
                                    {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.anio}{c.division}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{
                                flex: '1',
                                minWidth: '150px'
                            }}>
                                <label>Fecha</label>
                                <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                width: '100%',
                                justifyContent: 'flex-end'
                            }}>
                                <button className="btn" onClick={() => markAllAs('Asistencia')} style={{ flex: '1', minWidth: '120px' }}>Presentes a todos</button>
                                <button className="btn btn-primary" onClick={saveAttendance} disabled={saving || alumnos.length === 0} style={{ flex: '1', minWidth: '120px' }}>
                                    {saving ? 'Guardando...' : 'Guardar Todo'}
                                </button>
                            </div>
                        </div>

                        <div className="table-card">
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>Cargando lista de alumnos...</div>
                            ) : (
                                <>
                                    {/* Mobile Cards View */}
                                    <div className="mobile-cards" style={{ display: 'none' }}>
                                        {alumnos.length > 0 ? alumnos.map((al) => (
                                            <div key={al.id_alumno} className="attendance-card" style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '16px',
                                                marginBottom: '16px'
                                            }}>
                                                {/* Student Name */}
                                                <div style={{
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    marginBottom: '12px',
                                                    paddingBottom: '8px',
                                                    borderBottom: '1px solid var(--border)'
                                                }}>
                                                    {al.persona.lastName}, {al.persona.name}
                                                </div>

                                                {/* Attendance Status */}
                                                <div style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Estado</div>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {(['Asistencia', 'Tardanza', 'Retiro', 'Inasistencia'] as TipoAsistencia[]).map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusChange(al.id_alumno, status)}
                                                                className={`badge ${attendanceMap[al.id_alumno]?.tipo === status ? 'badge-primary' : 'badge-outline'}`}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    border: '1px solid var(--border)',
                                                                    background: attendanceMap[al.id_alumno]?.tipo === status
                                                                        ? (status === 'Asistencia' ? '#2563EB' : 'var(--primary-600)')
                                                                        : 'transparent',
                                                                    color: attendanceMap[al.id_alumno]?.tipo === status ? 'white' : 'inherit',
                                                                    fontSize: '0.75rem',
                                                                    padding: '4px 8px'
                                                                }}
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Time and Observations */}
                                                <div style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Hora / Observaciones</div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {(attendanceMap[al.id_alumno]?.tipo === 'Tardanza' || attendanceMap[al.id_alumno]?.tipo === 'Retiro') && (
                                                            <input
                                                                type="time"
                                                                className="input"
                                                                style={{ width: '100px', padding: '4px', fontSize: '0.875rem' }}
                                                                value={attendanceMap[al.id_alumno]?.hora}
                                                                onChange={(e) => handleMetaChange(al.id_alumno, 'hora', e.target.value)}
                                                            />
                                                        )}
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            placeholder="Observaciones..."
                                                            style={{ flex: 1, padding: '4px', fontSize: '0.875rem' }}
                                                            value={attendanceMap[al.id_alumno]?.obs}
                                                            onChange={(e) => handleMetaChange(al.id_alumno, 'obs', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Justification */}
                                                {(attendanceMap[al.id_alumno]?.tipo === 'Inasistencia' || attendanceMap[al.id_alumno]?.tipo === 'Tardanza' || attendanceMap[al.id_alumno]?.tipo === 'Retiro') && (
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Justificación</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                            <span className={`badge ${attendanceMap[al.id_alumno]?.justificado === 'Justificado' ? 'badge-success' : 'badge-error'}`}
                                                                style={{ fontSize: '0.75rem' }}>
                                                                {attendanceMap[al.id_alumno]?.justificado || 'Sin Justificar'}
                                                            </span>
                                                            {!attendanceMap[al.id_alumno]?.justificado && (
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                                                    onClick={() => justifyIndividual(al.id_alumno)}
                                                                >
                                                                    Justificar
                                                                </button>
                                                            )}
                                                        </div>
                                                        {attendanceMap[al.id_alumno]?.justificado && (
                                                            <textarea
                                                                className="input"
                                                                placeholder="Motivo..."
                                                                style={{
                                                                    padding: '6px',
                                                                    fontSize: '0.875rem',
                                                                    height: '60px',
                                                                    resize: 'vertical',
                                                                    minHeight: '60px',
                                                                    width: '100%'
                                                                }}
                                                                value={attendanceMap[al.id_alumno]?.motivo}
                                                                onChange={(e) => handleMetaChange(al.id_alumno, 'motivo', e.target.value)}
                                                                readOnly
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                No hay alumnos registrados en este curso
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="desktop-table">
                                        <table className="students-table">
                                            <thead>
                                                <tr>
                                                    <th>Estudiante</th>
                                                    <th>Estado de Asistencia</th>
                                                    <th>Hora / Obs</th>
                                                    <th>Justificación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {alumnos.length > 0 ? alumnos.map((al) => (
                                                    <tr key={al.id_alumno}>
                                                        <td>
                                                            <div style={{ fontWeight: '600' }}>{al.persona.lastName}, {al.persona.name}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {(['Asistencia', 'Tardanza', 'Retiro', 'Inasistencia'] as TipoAsistencia[]).map((status) => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => handleStatusChange(al.id_alumno, status)}
                                                                        className={`badge ${attendanceMap[al.id_alumno]?.tipo === status ? 'badge-primary' : 'badge-outline'}`}
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            border: '1px solid var(--border)',
                                                                            background: attendanceMap[al.id_alumno]?.tipo === status
                                                                                ? (status === 'Asistencia' ? '#2563EB' : 'var(--primary-600)')
                                                                                : 'transparent',
                                                                            color: attendanceMap[al.id_alumno]?.tipo === status ? 'white' : 'inherit'
                                                                        }}
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                {(attendanceMap[al.id_alumno]?.tipo === 'Tardanza' || attendanceMap[al.id_alumno]?.tipo === 'Retiro') && (
                                                                    <input
                                                                        type="time"
                                                                        className="input"
                                                                        style={{ width: '120px', padding: '5px' }}
                                                                        value={attendanceMap[al.id_alumno]?.hora}
                                                                        onChange={(e) => handleMetaChange(al.id_alumno, 'hora', e.target.value)}
                                                                    />
                                                                )}
                                                                <input
                                                                    type="text"
                                                                    className="input"
                                                                    placeholder="Obs..."
                                                                    style={{ flex: 1, padding: '5px' }}
                                                                    value={attendanceMap[al.id_alumno]?.obs}
                                                                    onChange={(e) => handleMetaChange(al.id_alumno, 'obs', e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {(attendanceMap[al.id_alumno]?.tipo === 'Inasistencia' || attendanceMap[al.id_alumno]?.tipo === 'Tardanza' || attendanceMap[al.id_alumno]?.tipo === 'Retiro') && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                        <span className={`badge ${attendanceMap[al.id_alumno]?.justificado === 'Justificado' ? 'badge-success' : 'badge-error'}`}>
                                                                            {attendanceMap[al.id_alumno]?.justificado || 'Sin Justificar'}
                                                                        </span>
                                                                    </div>
                                                                    {!attendanceMap[al.id_alumno]?.justificado ? (
                                                                        <button
                                                                            className="btn btn-primary"
                                                                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                                                            onClick={() => justifyIndividual(al.id_alumno)}
                                                                        >
                                                                            Justificar
                                                                        </button>
                                                                    ) : (
                                                                        <textarea
                                                                            className="input"
                                                                            placeholder="Motivo..."
                                                                            style={{
                                                                                padding: '5px',
                                                                                fontSize: '0.75rem',
                                                                                height: '40px',
                                                                                resize: 'vertical',
                                                                                minHeight: '40px'
                                                                            }}
                                                                            value={attendanceMap[al.id_alumno]?.motivo}
                                                                            onChange={(e) => handleMetaChange(al.id_alumno, 'motivo', e.target.value)}
                                                                            readOnly
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>No hay alumnos registrados en este curso</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={cancelSaveAttendance}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirmar Guardado</h3>
                        </div>
                        <div className="modal-body">
                            <p>¿Está seguro que desea guardar la asistencia?</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                Esta acción registrará los datos de todos los alumnos y no se podrá deshacer.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                onClick={cancelSaveAttendance}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmSaveAttendance}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Justification Modal */}
            {showJustifyModal && (
                <div className="modal-overlay" onClick={cancelJustification}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Justificar Inasistencia</h3>
                        </div>
                        <div className="modal-body">
                            <p>Ingrese el motivo de la justificación:</p>
                            <textarea
                                className="input"
                                placeholder="Ej: El alumno presentó certificado médico..."
                                value={justificationReason}
                                onChange={(e) => setJustificationReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    marginTop: '12px',
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn"
                                onClick={cancelJustification}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmJustification}
                                disabled={!justificationReason.trim()}
                            >
                                Justificar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <style jsx>{`
                .badge-outline {
                    background: transparent;
                }
                .badge-outline:hover {
                    background: var(--bg-hover);
                }

                /* Responsive Styles */
                @media (max-width: 768px) {
                    /* Hide desktop table and show mobile cards */
                    .desktop-table {
                        display: none !important;
                    }
                    .mobile-cards {
                        display: block !important;
                    }

                    /* Improve header layout */
                    .page-header {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 1rem;
                    }
                    
                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                    }

                    /* Toolbar improvements */
                    .toolbar {
                        flex-direction: column !important;
                        gap: 1rem !important;
                        align-items: stretch !important;
                    }

                    .toolbar > div {
                        width: 100% !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }

                    .toolbar button {
                        min-height: 44px; /* Touch-friendly */
                        font-size: 16px; /* Prevents zoom on iOS */
                    }
                }

                @media (max-width: 480px) {
                    /* Extra small screens */
                    .attendance-card {
                        padding: 12px !important;
                        margin-bottom: 12px !important;
                    }

                    .attendance-card > div {
                        margin-bottom: 8px !important;
                    }

                    .badge {
                        font-size: 0.7rem !important;
                        padding: 2px 6px !important;
                    }

                    .input {
                        font-size: 16px !important; /* Prevents zoom on iOS */
                    }
                }

                @media (min-width: 769px) {
                    /* Ensure desktop view is shown and mobile hidden */
                    .desktop-table {
                        display: block !important;
                    }
                    .mobile-cards {
                        display: none !important;
                    }
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-content {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: var(--radius-md);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    max-width: 400px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: auto;
                }

                /* Dark mode fallback */
                @media (prefers-color-scheme: dark) {
                    .modal-content {
                        background: #374151;
                        border-color: #4b5563;
                    }
                }

                .modal-header {
                    padding: 20px 20px 10px 20px;
                    border-bottom: 1px solid var(--border);
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                }

                .modal-body {
                    padding: 20px;
                }

                .modal-body p {
                    margin: 0;
                    color: #111827;
                    line-height: 1.5;
                }

                .modal-body p[style*="color: var(--text-secondary)"] {
                    color: #6b7280 !important;
                }

                /* Dark mode text colors */
                @media (prefers-color-scheme: dark) {
                    .modal-header h3 {
                        color: #f9fafb;
                    }

                    .modal-body p {
                        color: #f9fafb;
                    }

                    .modal-body p[style*="color: var(--text-secondary)"] {
                        color: #9ca3af !important;
                    }
                }

                .modal-footer {
                    padding: 10px 20px 20px 20px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                /* Responsive Modal */
                @media (max-width: 480px) {
                    .modal-overlay {
                        padding: 16px;
                    }

                    .modal-content {
                        max-width: 100%;
                    }

                    .modal-header {
                        padding: 16px 16px 8px 16px;
                    }

                    .modal-header h3 {
                        font-size: 1.125rem;
                    }

                    .modal-body {
                        padding: 16px;
                    }

                    .modal-footer {
                        padding: 8px 16px 16px 16px;
                        flex-direction: column-reverse;
                        gap: 8px;
                    }

                    .modal-footer button {
                        width: 100%;
                        min-height: 44px;
                        font-size: 16px;
                    }

                    .modal-body textarea {
                        font-size: 16px !important; /* Prevents zoom on iOS */
                        min-height: 120px !important;
                    }
                }
            `}</style>
        </div>
    );
}
