'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';

interface DocenteData {
    id_docente: number;
    nombre: string;
    apellido: string;
    dni: string;
    cantidadAsignaciones: number;
    cursos: string[];
    totalNotas: number;
    porcentajeCarga: number;
}

interface AsignacionData {
    id_asignacion: number;
    curso: string;
    id_curso: number;
    materia: string;
    id_materia: number;
    cantidadNotas: number;
    cantidadAlumnos: number;
}

interface DocenteDetalle {
    id_docente: number;
    nombre: string;
    apellido: string;
    asignaciones: AsignacionData[];
    instancias: InstanciaEvaluativa[];
}

interface InstanciaEvaluativa {
    id_instancia: number;
    nombre: string;
}

interface AlumnoConNotas {
    id_alumno: number;
    legajo: string;
    nombre: string;
    apellido: string;
    estado: string;
    notasPorInstancia: Record<number, number | null>;
}

interface AlumnosResponse {
    instancias: InstanciaEvaluativa[];
    alumnos: AlumnoConNotas[];
}

// Normalizar rol para comparación
const normalizeRole = (role: string | null): string => {
    if (!role) return '';
    return role.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export default function VerCargaPage() {
    const [docentes, setDocentes] = useState<DocenteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState<string>('');
    
    // Estado para vista de detalle
    const [vistaActual, setVistaActual] = useState<'listado' | 'asignaciones' | 'alumnos'>('listado');
    const [docenteSeleccionado, setDocenteSeleccionado] = useState<DocenteDetalle | null>(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<AsignacionData | null>(null);
    const [alumnosConNotas, setAlumnosConNotas] = useState<AlumnoConNotas[]>([]);
    const [instanciasEvaluativas, setInstanciasEvaluativas] = useState<InstanciaEvaluativa[]>([]);
    const [instanciaSeleccionada, setInstanciaSeleccionada] = useState<InstanciaEvaluativa | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    
    // Estado para edición de notas
    const [editingNota, setEditingNota] = useState<{ id_alumno: number; value: string } | null>(null);
    const [savingNota, setSavingNota] = useState(false);

    const fetchDocentes = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ver-carga');
            if (response.ok) {
                const data = await response.json();
                setDocentes(data);
            }
        } catch (error) {
            console.error('Error fetching docentes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocentes();
        // Obtener rol del usuario
        const storedRole = localStorage.getItem('userRole');
        setUserRole(normalizeRole(storedRole));
    }, []);

    // Verificar si el usuario puede editar notas (Admin o Secretario)
    const canEditNotas = () => {
        return userRole === 'admin' || userRole === 'secretario';
    };

    // Guardar nota editada
    const handleSaveNota = async (id_alumno: number, nuevaNota: string) => {
        if (!asignacionSeleccionada || !instanciaSeleccionada || !docenteSeleccionado) return;
        
        setSavingNota(true);
        try {
            const response = await fetch('/api/notas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_alumno,
                    id_instancia: instanciaSeleccionada.id_instancia,
                    id_materia: asignacionSeleccionada.id_materia,
                    id_curso: asignacionSeleccionada.id_curso,
                    id_docente: docenteSeleccionado.id_docente,
                    nota: nuevaNota === '' ? null : nuevaNota
                })
            });

            if (response.ok) {
                // Actualizar el estado local
                setAlumnosConNotas(prev => prev.map(alumno => {
                    if (alumno.id_alumno === id_alumno) {
                        return {
                            ...alumno,
                            notasPorInstancia: {
                                ...alumno.notasPorInstancia,
                                [instanciaSeleccionada.id_instancia]: nuevaNota === '' ? null : parseInt(nuevaNota)
                            }
                        };
                    }
                    return alumno;
                }));
            }
        } catch (error) {
            console.error('Error al guardar nota:', error);
        } finally {
            setSavingNota(false);
            setEditingNota(null);
        }
    };

    // Iniciar edición de una nota
    const handleStartEdit = (id_alumno: number, notaActual: number | null) => {
        if (!canEditNotas()) return;
        setEditingNota({
            id_alumno,
            value: notaActual !== null && notaActual !== undefined ? String(notaActual) : ''
        });
    };

    // Manejar cambio en el input de edición
    const handleEditChange = (value: string) => {
        if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 10)) {
            setEditingNota(prev => prev ? { ...prev, value } : null);
        }
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setEditingNota(null);
    };

    const handleVerAsignaciones = async (docente: DocenteData) => {
        setLoadingDetalle(true);
        try {
            const response = await fetch(`/api/ver-carga?id_docente=${docente.id_docente}`);
            if (response.ok) {
                const data: DocenteDetalle = await response.json();
                setDocenteSeleccionado(data);
                setVistaActual('asignaciones');
            }
        } catch (error) {
            console.error('Error fetching asignaciones:', error);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleVerAlumnos = async (asignacion: AsignacionData, instancia: InstanciaEvaluativa) => {
        if (!docenteSeleccionado) return;
        
        setLoadingDetalle(true);
        setAsignacionSeleccionada(asignacion);
        setInstanciaSeleccionada(instancia);
        try {
            const response = await fetch(
                `/api/ver-carga?id_docente=${docenteSeleccionado.id_docente}&id_curso=${asignacion.id_curso}&id_materia=${asignacion.id_materia}`
            );
            if (response.ok) {
                const data: AlumnosResponse = await response.json();
                setInstanciasEvaluativas(data.instancias);
                setAlumnosConNotas(data.alumnos);
                setVistaActual('alumnos');
            }
        } catch (error) {
            console.error('Error fetching alumnos:', error);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleVolver = () => {
        if (vistaActual === 'alumnos') {
            setVistaActual('asignaciones');
            setAsignacionSeleccionada(null);
            setAlumnosConNotas([]);
            setInstanciasEvaluativas([]);
            setInstanciaSeleccionada(null);
        } else if (vistaActual === 'asignaciones') {
            setVistaActual('listado');
            setDocenteSeleccionado(null);
        }
    };

    const docentesFiltrados = docentes.filter(docente => {
        const nombreCompleto = `${docente.nombre} ${docente.apellido}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return nombreCompleto.includes(search) || docente.dni?.includes(search);
    });

    // Calcular promedio de notas de un alumno
    const calcularPromedio = (notasPorInstancia: Record<number, number | null>) => {
        const notas = Object.values(notasPorInstancia).filter(n => n !== null && n !== undefined) as number[];
        if (notas.length === 0) return '-';
        const suma = notas.reduce((acc, n) => acc + n, 0);
        return (suma / notas.length).toFixed(1);
    };

    // Contar notas cargadas de un alumno
    const contarNotasCargadas = (notasPorInstancia: Record<number, number | null>) => {
        return Object.values(notasPorInstancia).filter(n => n !== null && n !== undefined).length;
    };

    // Obtener iniciales de un nombre (ej: "Parcial 1" -> "P1", "Examen Final" -> "EF")
    const getIniciales = (nombre: string) => {
        return nombre
            .split(' ')
            .map(palabra => {
                // Si es un número, lo dejamos completo
                if (!isNaN(Number(palabra))) return palabra;
                // Si no, tomamos la primera letra
                return palabra.charAt(0).toUpperCase();
            })
            .join('');
    };

    return (
        <div className="students-container">
            <Sidebar activePage="evaluacion" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        {vistaActual === 'listado' && (
                            <>
                                <h1>Ver Carga de Notas</h1>
                                <p>Visualiza las notas cargadas por cada docente</p>
                            </>
                        )}
                        {vistaActual === 'asignaciones' && docenteSeleccionado && (
                            <>
                                <h1>{docenteSeleccionado.apellido}, {docenteSeleccionado.nombre}</h1>
                                <p>Cursos y materias asignadas</p>
                            </>
                        )}
                        {vistaActual === 'alumnos' && asignacionSeleccionada && (
                            <>
                                <h1>{asignacionSeleccionada.materia} - {instanciaSeleccionada?.nombre}</h1>
                                <p>Curso {asignacionSeleccionada.curso} - Notas de alumnos</p>
                            </>
                        )}
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        {vistaActual !== 'listado' && (
                            <button onClick={handleVolver} className="btn btn-primary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                                Volver
                            </button>
                        )}
                    </div>
                </header>

                {/* Vista: Listado de Docentes */}
                {vistaActual === 'listado' && (
                    <>
                        <div className="toolbar animate-slide-in">
                            <div className="search-box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Buscar docente por nombre o DNI..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-card">
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>Cargando docentes...</div>
                            ) : (
                                <table className="students-table">
                                    <thead>
                                        <tr>
                                            <th>Docente</th>
                                            <th>DNI</th>
                                            <th>Cursos Asignados</th>
                                            <th style={{ textAlign: 'center' }}>Asignaciones</th>
                                            <th style={{ textAlign: 'center' }}>Notas Cargadas</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {docentesFiltrados.length > 0 ? (
                                            docentesFiltrados.map((docente) => (
                                                <tr key={docente.id_docente}>
                                                    <td>
                                                        <span className="name">{docente.apellido}, {docente.nombre}</span>
                                                    </td>
                                                    <td>{docente.dni || '-'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                            {docente.cursos.length > 0 ? (
                                                                docente.cursos.map((curso, idx) => (
                                                                    <span key={idx} className="badge badge-neutral">
                                                                        {curso}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span style={{ color: 'var(--text-tertiary)' }}>Sin cursos</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="badge badge-info">
                                                            {docente.cantidadAsignaciones}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`badge ${docente.porcentajeCarga >= 100 ? 'badge-success' : 'badge-warning'}`}>
                                                            {docente.porcentajeCarga}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-icons">
                                                            <button 
                                                                onClick={() => handleVerAsignaciones(docente)}
                                                                className="action-icon" 
                                                                title="Ver asignaciones y notas"
                                                                disabled={docente.cantidadAsignaciones === 0}
                                                                style={{ 
                                                                    opacity: docente.cantidadAsignaciones === 0 ? 0.4 : 1,
                                                                    cursor: docente.cantidadAsignaciones === 0 ? 'not-allowed' : 'pointer'
                                                                }}
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                    No se encontraron docentes
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                            
                            {docentesFiltrados.length > 0 && (
                                <div style={{
                                    padding: 'var(--spacing-lg)',
                                    borderTop: '1px solid var(--border)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.875rem'
                                }}>
                                    Mostrando {docentesFiltrados.length} de {docentes.length} docentes
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Vista: Asignaciones del Docente */}
                {vistaActual === 'asignaciones' && docenteSeleccionado && (
                    <div className="table-card animate-fade-in" style={{ overflowX: 'auto' }}>
                        {loadingDetalle ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>Cargando asignaciones...</div>
                        ) : (
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Curso</th>
                                        <th>Materia</th>
                                        <th style={{ textAlign: 'center' }}>Alumnos</th>
                                        <th style={{ textAlign: 'center' }}>Notas Cargadas</th>
                                        <th style={{ minWidth: '200px' }}>Ver por Instancia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {docenteSeleccionado.asignaciones.length > 0 ? (
                                        docenteSeleccionado.asignaciones.map((asig) => (
                                                <tr key={asig.id_asignacion}>
                                                    <td>
                                                        <span className="badge badge-neutral">{asig.curso}</span>
                                                    </td>
                                                    <td>
                                                        <span className="name">{asig.materia}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="badge badge-info">{asig.cantidadAlumnos}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`badge ${asig.cantidadNotas > 0 ? 'badge-success' : 'badge-warning'}`}>
                                                            {asig.cantidadNotas}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-icons" style={{ gap: '8px' }}>
                                                            {docenteSeleccionado.instancias.length > 0 ? (
                                                                docenteSeleccionado.instancias.map((instancia) => (
                                                                    <button 
                                                                        key={instancia.id_instancia}
                                                                        onClick={() => handleVerAlumnos(asig, instancia)}
                                                                        className="action-icon"
                                                                        title={instancia.nombre}
                                                                        style={{
                                                                            width: 'auto',
                                                                            minWidth: '32px',
                                                                            padding: '4px 8px',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: '600'
                                                                        }}
                                                                    >
                                                                        {getIniciales(instancia.nombre)}
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                                    Sin instancias
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                Este docente no tiene asignaciones
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        
                        {docenteSeleccionado.asignaciones.length > 0 && (
                            <div style={{
                                padding: 'var(--spacing-lg)',
                                borderTop: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem'
                            }}>
                                Total: {docenteSeleccionado.asignaciones.length} asignaciones
                            </div>
                        )}
                    </div>
                )}

                {/* Vista: Alumnos con Notas */}
                {vistaActual === 'alumnos' && asignacionSeleccionada && instanciaSeleccionada && (
                    <div className="table-card animate-fade-in">
                        {loadingDetalle ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>Cargando alumnos...</div>
                        ) : (
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Legajo</th>
                                        <th>Alumno</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: 'center' }}>Nota</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumnosConNotas.length > 0 ? (
                                        alumnosConNotas.map((alumno) => {
                                            const nota = alumno.notasPorInstancia[instanciaSeleccionada.id_instancia];
                                            return (
                                                <tr key={alumno.id_alumno}>
                                                    <td style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                                                        {alumno.legajo}
                                                    </td>
                                                    <td>
                                                        <span className="name">{alumno.apellido}, {alumno.nombre}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${alumno.estado === 'Regular' ? 'badge-success' : 
                                                            alumno.estado === 'Libre' ? 'badge-warning' : 'badge-neutral'}`}>
                                                            {alumno.estado}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {editingNota && editingNota.id_alumno === alumno.id_alumno ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={10}
                                                                    value={editingNota.value}
                                                                    onChange={(e) => handleEditChange(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveNota(alumno.id_alumno, editingNota.value);
                                                                        if (e.key === 'Escape') handleCancelEdit();
                                                                    }}
                                                                    autoFocus
                                                                    disabled={savingNota}
                                                                    style={{
                                                                        width: '60px',
                                                                        padding: '6px 8px',
                                                                        fontSize: '1rem',
                                                                        textAlign: 'center',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        border: '2px solid var(--primary)',
                                                                        background: 'var(--bg-secondary)',
                                                                        color: 'var(--text-primary)'
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => handleSaveNota(alumno.id_alumno, editingNota.value)}
                                                                    disabled={savingNota}
                                                                    className="action-icon"
                                                                    title="Guardar"
                                                                    style={{ background: 'var(--success)', color: 'white', width: '28px', height: '28px' }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    disabled={savingNota}
                                                                    className="action-icon"
                                                                    title="Cancelar"
                                                                    style={{ background: 'var(--danger)', color: 'white', width: '28px', height: '28px' }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span 
                                                                className={`badge ${
                                                                    nota === null || nota === undefined ? 'badge-neutral' :
                                                                    nota >= 6 ? 'badge-success' : 'badge-warning'
                                                                }`} 
                                                                style={{ 
                                                                    fontSize: '1.1rem', 
                                                                    padding: '6px 16px', 
                                                                    fontWeight: '600', 
                                                                    minWidth: '50px', 
                                                                    display: 'inline-block',
                                                                    cursor: canEditNotas() ? 'pointer' : 'default',
                                                                    transition: 'transform 0.15s ease'
                                                                }}
                                                                onClick={() => handleStartEdit(alumno.id_alumno, nota)}
                                                                onMouseEnter={(e) => {
                                                                    if (canEditNotas()) {
                                                                        (e.target as HTMLElement).style.transform = 'scale(1.1)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    (e.target as HTMLElement).style.transform = 'scale(1)';
                                                                }}
                                                                title={canEditNotas() ? 'Click para editar' : undefined}
                                                            >
                                                                {nota !== null && nota !== undefined ? nota : '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No hay alumnos en este curso
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        
                        {alumnosConNotas.length > 0 && (
                            <div style={{
                                padding: 'var(--spacing-lg)',
                                borderTop: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>Total: {alumnosConNotas.length} alumnos</span>
                                <span>
                                    Con nota: {alumnosConNotas.filter(a => a.notasPorInstancia[instanciaSeleccionada.id_instancia] !== null && a.notasPorInstancia[instanciaSeleccionada.id_instancia] !== undefined).length} | 
                                    Sin nota: {alumnosConNotas.filter(a => a.notasPorInstancia[instanciaSeleccionada.id_instancia] === null || a.notasPorInstancia[instanciaSeleccionada.id_instancia] === undefined).length}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
