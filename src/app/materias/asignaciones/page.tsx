'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';

interface AsignacionData {
    id_asignacion: number;
    materia: { nombre_materia: string };
    curso: { anio: number; division: string };
    docente: { persona: { name: string; lastName: string } };
}

interface Materia {
    id_materia: number;
    nombre_materia: string;
}

interface Docente {
    id_docente: number;
    persona: { name: string; lastName: string };
}

export default function AsignacionesPage() {
    const [asignaciones, setAsignaciones] = useState<AsignacionData[]>([]);
    const [filteredAsignaciones, setFilteredAsignaciones] = useState<AsignacionData[]>([]);
    const [paginatedAsignaciones, setPaginatedAsignaciones] = useState<AsignacionData[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMateria, setFilterMateria] = useState('');
    const [filterDocente, setFilterDocente] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });


    const fetchAsignaciones = async (page = 1) => {
        setLoading(true);
        try {
            // Fetch asignaciones with pagination
            const response = await fetch(`/api/asignaciones?page=${page}&pageSize=100`); // Get all for filtering
            if (response.ok) {
                const result = await response.json();
                setAsignaciones(result.data);
                
                // Extract unique materias and docentes (only on first load)
                if (materias.length === 0 || docentes.length === 0) {
                    const uniqueMaterias = Array.from(new Map(result.data.map((a: AsignacionData) => 
                        [a.materia.nombre_materia, { id_materia: 0, nombre_materia: a.materia.nombre_materia }]
                    )).values());
                    
                    const uniqueDocentes = Array.from(new Map(result.data.map((a: AsignacionData) => 
                        [(a.docente as any).id_docente?.toString() || Math.random().toString(), a.docente]
                    )).values());
                    
                    setMaterias(uniqueMaterias as any);
                    setDocentes(uniqueDocentes as any);
                }
                
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching asignaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAsignaciones();
    }, []);

    useEffect(() => {
        // Filter asignaciones based on selected filters
        let filtered = asignaciones;
        
        if (filterMateria) {
            filtered = filtered.filter(asig => 
                asig.materia.nombre_materia.toLowerCase().includes(filterMateria.toLowerCase())
            );
        }
        
        if (filterDocente) {
            filtered = filtered.filter((asig: any) => 
                asig.docente.id_docente?.toString() === filterDocente
            );
        }
        
        setFilteredAsignaciones(filtered);
        
        // Reset pagination to page 1 when filters change
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [asignaciones, filterMateria, filterDocente]);

    useEffect(() => {
        // Apply pagination to filtered results
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginated = filteredAsignaciones.slice(startIndex, endIndex);
        setPaginatedAsignaciones(paginated);
        
        // Update total pages for filtered results
        const filteredTotalPages = Math.ceil(filteredAsignaciones.length / pagination.pageSize);
        setPagination(prev => ({
            ...prev,
            total: filteredAsignaciones.length,
            totalPages: filteredTotalPages
        }));
    }, [filteredAsignaciones, pagination.page]);



    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta asignación?')) return;
        
        try {
            const response = await fetch(`/api/asignaciones/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchAsignaciones();
            }
        } catch (error) {
            console.error('Error deleting asignacion:', error);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="materias" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Asignaciones Académicas</h1>
                        <p>Vinculación de materias, cursos y docentes</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/materias/asignaciones/nuevo" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nueva Asignación
                        </Link>
                    </div>
                </header>

                <div className="toolbar animate-slide-in">
                    <div className="form-group" style={{ minWidth: '250px' }}>
                        <label>Filtrar por Materia</label>
                        <select 
                            className="input" 
                            value={filterMateria} 
                            onChange={(e) => setFilterMateria(e.target.value)}
                        >
                            <option value="">Todas las materias</option>
                            {materias.map(m => (
                                <option key={m.nombre_materia} value={m.nombre_materia}>
                                    {m.nombre_materia}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group" style={{ minWidth: '250px' }}>
                        <label>Filtrar por Docente</label>
                        <select 
                            className="input" 
                            value={filterDocente} 
                            onChange={(e) => setFilterDocente(e.target.value)}
                        >
                            <option value="">Todos los docentes</option>
                            {docentes.map(d => (
                                <option key={d.id_docente} value={d.id_docente}>
                                    {d.persona.name} {d.persona.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        {(filterMateria || filterDocente) && (
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {
                                    setFilterMateria('');
                                    setFilterDocente('');
                                }}
                                style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Limpiar Filtros
                            </button>
                        )}
                        <div style={{ 
                            fontSize: '0.875rem', 
                            color: (filterMateria || filterDocente) ? 'var(--primary-600)' : 'var(--text-secondary)', 
                            padding: '8px 12px', 
                            background: (filterMateria || filterDocente) ? 'var(--primary-50)' : 'var(--gray-100)', 
                            borderRadius: 'var(--radius-md)',
                            fontWeight: (filterMateria || filterDocente) ? '600' : '400',
                            border: (filterMateria || filterDocente) ? '1px solid var(--primary-200)' : '1px solid transparent'
                        }}>
                            {filteredAsignaciones.length} de {asignaciones.length} asignaciones
                            {(filterMateria || filterDocente) && ` (filtrado - página ${pagination.page})`}
                        </div>
                    </div>
                </div>

                <div className="table-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando asignaciones...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Materia</th>
                                        <th>Curso</th>
                                        <th>Docente</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedAsignaciones.length > 0 ? (
                                        paginatedAsignaciones.map((asig) => (
                                            <tr key={asig.id_asignacion}>
                                                <td style={{ fontWeight: '600', color: 'var(--text-tertiary)' }}>#{asig.id_asignacion}</td>
                                                <td>{asig.materia.nombre_materia}</td>
                                                <td>
                                                    <span className="badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: '700' }}>
                                                        {asig.curso.anio}{asig.curso.division}
                                                    </span>
                                                </td>
                                                <td>{asig.docente.persona.name} {asig.docente.persona.lastName}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="action-icons" style={{ justifyContent: 'flex-end' }}>
                                                        <Link href={`/materias/asignaciones/editar/${asig.id_asignacion}`} className="action-icon" title="Editar">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </Link>
                                                        <button onClick={() => handleDelete(asig.id_asignacion)} className="action-icon" title="Eliminar" style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer' }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                {filterMateria || filterDocente ? 
                                                    'No hay asignaciones que coincidan con los filtros seleccionados en esta página' : 
                                                    filteredAsignaciones.length === 0 && asignaciones.length > 0 ?
                                                        'No hay asignaciones que coincidan con los filtros seleccionados' :
                                                        'No hay asignaciones registradas'
                                                }
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className="pagination-controls" style={{
                                padding: 'var(--spacing-lg)',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Mostrando {paginatedAsignaciones.length} de {filteredAsignaciones.length} asignaciones
                                    {(filterMateria || filterDocente) && ` (filtrados de ${asignaciones.length} totales)`}
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn"
                                        style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                    >
                                        Anterior
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)', fontWeight: '600' }}>
                                        Página {pagination.page} de {pagination.totalPages || 1}
                                    </div>
                                    <button
                                        className="btn"
                                        style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
