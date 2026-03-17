'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';

interface Curso {
    id_curso: number;
    anio: number;
    division: string;
}

interface InstanciaActiva {
    id_instancia: number;
    nombre: string;
}

interface NotaAlumno {
    id_alumno: number;
    nombre: string;
    apellido: string;
    nota: number;
    materia: string;
}

interface NotasPorInstancia {
    instancia: { id_instancia: number; nombre: string };
    notas: NotaAlumno[];
    promedio: number;
    total: number;
}

export default function VeedorDashboard() {
    const router = useRouter();
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [data, setData] = useState<any>(null);
    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        const isAuth = localStorage.getItem('isAuthenticated');
        const storedRoles = localStorage.getItem('roles');
        const storedActiveRole = localStorage.getItem('activeRole');

        if (!isAuth) {
            router.push('/login');
            return;
        }

        if (storedRoles) {
            try {
                const parsedRoles = JSON.parse(storedRoles);
                setActiveRole(storedActiveRole || parsedRoles[0] || '');
                if (!parsedRoles.includes('VEEDOR')) {
                    router.push('/home');
                }
            } catch (e) {
                console.error("Error parsing roles", e);
            }
        }

        fetch('/api/veedor')
            .then(res => res.json())
            .then(data => {
                setCursos(data.courses || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading courses:', err);
                setLoading(false);
            });
    }, [router]);

    const handleCursoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cursoId = e.target.value ? parseInt(e.target.value) : null;
        setCursoSeleccionado(cursoId);
        if (cursoId) {
            setLoadingData(true);
            try {
                const res = await fetch(`/api/veedor?id_curso=${cursoId}`);
                const data = await res.json();
                setData(data);
            } catch (err) {
                console.error('Error loading data:', err);
            } finally {
                setLoadingData(false);
            }
        } else {
            setData(null);
        }
    };

    if (loading) {
        return (
            <div className="home-container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <Sidebar activePage="veedor" />

            <main className="main-content">
                <header className="header">
                    <div className="header-left">
                        <h1 className="page-title">Dashboard Veedor</h1>
                        <p className="page-subtitle">Panel de seguimiento académico</p>
                    </div>
                    <div className="header-right">
                        <ThemeToggle />
                    </div>
                </header>

                <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 className="card-title">Selección de Curso</h3>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ fontWeight: '500' }}>Curso:</label>
                            <select
                                className="input"
                                style={{ maxWidth: '300px' }}
                                value={cursoSeleccionado || ''}
                                onChange={handleCursoChange}
                            >
                                <option value="">-- Seleccionar curso --</option>
                                {cursos.map(curso => (
                                    <option key={curso.id_curso} value={curso.id_curso}>
                                        {curso.anio}° "{curso.division}"
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loadingData && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <div className="spinner"></div>
                        </div>
                    )}

                    {data && !loadingData && (
                        <>
                            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Total Alumnos</span>
                                    </div>
                                    <div className="stat-value">{data.estadisticas.totalAlumnos}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Inasistencias Totales</span>
                                    </div>
                                    <div className="stat-value">{data.estadisticas.inasistenciasTotal}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Justificadas</span>
                                        <span className="stat-change positive">✓</span>
                                    </div>
                                    <div className="stat-value">{data.estadisticas.inasistenciasJustificadas}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Sin Justificar</span>
                                        <span className="stat-change negative">!</span>
                                    </div>
                                    <div className="stat-value">{data.estadisticas.inasistenciasSinJustificar}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Tasa de Asistencia</span>
                                    </div>
                                    <div className="stat-value" style={{ 
                                        color: data.estadisticas.tasaAsistencia >= 90 ? 'var(--success)' : 
                                               data.estadisticas.tasaAsistencia >= 75 ? 'var(--warning)' : 'var(--error)'
                                    }}>
                                        {data.estadisticas.tasaAsistencia}%
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className="card">
                                    <h3 className="card-title">Inasistencias del Año</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
                                                    <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
                                                    <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.inasistencias && data.inasistencias.length > 0 ? (
                                                    data.inasistencias.slice(0, 20).map((a: any, i: number) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '12px' }}>
                                                                {new Date(a.fecha).toLocaleDateString('es-AR')}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>{a.tipo_evento}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    background: a.justificacion === 'Justificado' ? 'var(--success)' : 'var(--error)',
                                                                    color: 'white',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    {a.justificacion === 'Justificado' ? 'Justificada' : 'Sin justificar'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                            No hay inasistencias registradas
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="card">
                                    <h3 className="card-title">Notas - Instancias Activas</h3>
                                    {data.notas && data.notas.length > 0 ? (
                                        <div>
                                            {data.notas.map((nota: NotasPorInstancia, idx: number) => (
                                                <div key={idx} style={{ 
                                                    marginBottom: '20px', 
                                                    padding: '16px', 
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                                            {nota.instancia.nombre}
                                                        </h4>
                                                        <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                                            <span>Promedio: <strong>{nota.promedio > 0 ? nota.promedio : '-'}</strong></span>
                                                            <span>Calificados: <strong>{nota.total}</strong></span>
                                                        </div>
                                                    </div>
                                                    {nota.notas.length > 0 ? (
                                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                                <thead>
                                                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                                        <th style={{ padding: '8px', textAlign: 'left' }}>Alumno</th>
                                                                        <th style={{ padding: '8px', textAlign: 'left' }}>Materia</th>
                                                                        <th style={{ padding: '8px', textAlign: 'center' }}>Nota</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {nota.notas.map((n, i) => (
                                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                            <td style={{ padding: '8px' }}>{n.apellido} {n.nombre}</td>
                                                                            <td style={{ padding: '8px' }}>{n.materia || '-'}</td>
                                                                            <td style={{ 
                                                                                padding: '8px', 
                                                                                textAlign: 'center',
                                                                                fontWeight: '600',
                                                                                color: n.nota >= 6 ? 'var(--success)' : 'var(--error)'
                                                                            }}>{n.nota}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', margin: 0 }}>
                                                            Sin calificaciones cargadas
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px' }}>
                                            No hay instancias evaluativas activas
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {!data && !loadingData && (
                        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            </div>
                            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Seleccione un curso para ver las estadísticas
                            </h3>
                            <p style={{ color: 'var(--text-tertiary)' }}>
                                Elija un curso del dropdown para visualizar las inasistencias y notas
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
