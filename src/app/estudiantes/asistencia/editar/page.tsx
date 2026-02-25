'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';

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

export default function EditAsistenciaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const normalizeFecha = (value: string | null) => {
        if (!value || value === 'null' || value === 'undefined') {
            const now = new Date();
            const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
            return localDate.toISOString().split('T')[0];
        }
        if (value.includes('T')) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return localDate.toISOString().split('T')[0];
    };
    const initialCurso = searchParams.get('id_curso') || '';
    const initialFecha = normalizeFecha(searchParams.get('fecha'));

    const [cursos, setCursos] = useState<any[]>([]);
    const [selectedCurso, setSelectedCurso] = useState(initialCurso);
    const [fecha, setFecha] = useState(initialFecha);
    const [alumnos, setAlumnos] = useState<AlumnoAsistencia[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<Record<number, { tipo: TipoAsistencia, hora: string, obs: string, justificado: string, motivo: string }>>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showJustifyModal, setShowJustifyModal] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [justificationReason, setJustificationReason] = useState('');
    const [prefillExisting, setPrefillExisting] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);

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
            if (!userInfo || !userRole) return;
            setLoading(true);
            try {
                const userId = userInfo.id || '';
                const cursosRes = await fetch(`/api/cursos-por-rol?userId=${userId}&userRole=${userRole}`);
                const cursosResponse = await cursosRes.json();
                if (cursosResponse.success) {
                    setCursos(cursosResponse.data);
                    if (!selectedCurso && cursosResponse.data.length > 0) {
                        setSelectedCurso(cursosResponse.data[0].id_curso.toString());
                    }
                } else {
                    setCursos([]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userInfo, userRole]);

    useEffect(() => {
        if (selectedCurso && fecha) {
            fetchAlumnos();
        }
    }, [selectedCurso, fecha]);

    const fetchAlumnos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/asistencias?id_curso=${selectedCurso}&fecha=${fecha}`);
            if (res.ok) {
                const data = await res.json();
                setAlumnos(data);
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

    const justifyIndividual = (id: number) => {
        setSelectedStudentId(id);
        setJustificationReason('');
        setShowJustifyModal(true);
    };

    const confirmJustification = async () => {
        if (!selectedStudentId || !justificationReason.trim()) return;
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
                fetchAlumnos();
                setShowJustifyModal(false);
                setSelectedStudentId(null);
                setJustificationReason('');
            } else {
                setNotification({ type: 'error', message: 'Error al registrar justificación' });
            }
        } catch {
            setNotification({ type: 'error', message: 'Error de conexión al registrar justificación' });
        }
    };

    const cancelJustification = () => {
        setShowJustifyModal(false);
        setSelectedStudentId(null);
        setJustificationReason('');
    };

    const saveAttendance = async () => {
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
            };
            const res = await fetch('/api/asistencias/editar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setNotification({ type: 'success', message: '¡Asistencia actualizada con éxito!' });
                router.push('/estudiantes/asistencia');
            } else {
                setNotification({ type: 'error', message: 'Error al actualizar la asistencia' });
            }
        } catch {
            setNotification({ type: 'error', message: 'Error de conexión al servidor' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="estudiantes" />
            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Editar Asistencia</h1>
                        <p>Actualice la asistencia del curso y fecha seleccionados</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <button className="btn" onClick={() => { router.push('/estudiantes/asistencia'); setNotification(null); }}>
                            Volver al Historial
                        </button>
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

                <div className="toolbar" style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'flex-end',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label>Curso</label>
                        <select className="input" value={selectedCurso} onChange={(e) => setSelectedCurso(e.target.value)}>
                            {cursos.map((c: any) => <option key={c.id_curso} value={c.id_curso}>{c.anio}{c.division}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label>Fecha</label>
                        <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn" onClick={() => {
                            const newMap = { ...attendanceMap };
                            alumnos.forEach(al => { newMap[al.id_alumno] = { ...newMap[al.id_alumno], tipo: 'Asistencia' }; });
                            setAttendanceMap(newMap);
                        }} style={{ flex: 1, minWidth: '120px' }}>
                            Presentes a todos
                        </button>
                        <button className="btn btn-primary" onClick={saveAttendance} disabled={saving || alumnos.length === 0} style={{ flex: 1, minWidth: '120px' }}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>

                <div className="table-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando lista de alumnos...</div>
                    ) : (
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
                    )}
                </div>
            </main>

            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
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
                            <button className="btn" onClick={() => setShowConfirmModal(false)} disabled={saving}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={confirmSaveAttendance} disabled={saving}>
                                {saving ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <button className="btn" onClick={cancelJustification}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={confirmJustification} disabled={!justificationReason.trim()}>
                                Justificar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .badge-outline { background: transparent; }
                .badge-outline:hover { background: var(--bg-hover); }
                @media (max-width: 768px) {
                    .desktop-table { display: none !important; }
                }
                @media (min-width: 769px) {
                    .desktop-table { display: block !important; }
                }
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-content {
                    background: #808080;
                    border-radius: var(--radius-md);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    max-width: 400px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: auto;
                }
                @media (prefers-color-scheme: dark) {
                    .modal-content { background: #374151; border-color: #4b5563; }
                }
                .modal-header { padding: 20px 20px 10px 20px; border-bottom: 1px solid var(--border); }
                .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #ffffff; }
                .modal-body { padding: 20px; }
                .modal-body p { margin: 0; color: #ffffff; line-height: 1.5; }
                .modal-footer {
                    padding: 10px 20px 20px 20px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                @media (max-width: 480px) {
                    .modal-overlay { padding: 16px; }
                    .modal-content { max-width: 100%; }
                    .modal-header { padding: 16px 16px 8px 16px; }
                    .modal-header h3 { font-size: 1.125rem; }
                    .modal-body { padding: 16px; }
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
                        font-size: 16px !important;
                        min-height: 120px !important;
                    }
                }
            `}</style>
        </div>
    );
}
