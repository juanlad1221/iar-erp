'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';

interface CursoData {
    id_curso: number;
    anio: number;
    division: string;
}

export default function CursosPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [cursos, setCursos] = useState<CursoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const fetchCursos = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/cursos?page=${page}&pageSize=${pagination.pageSize}&search=${search}`);
            if (response.ok) {
                const result = await response.json();
                setCursos(result.data);
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching cursos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCursos(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchCursos(newPage, searchTerm);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch(`/api/cursos/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchCursos(pagination.page, searchTerm);
            } else {
                alert('No se pudo eliminar el curso. Verifique que no tenga asignaciones vinculadas.');
            }
        } catch (error) {
            console.error('Error deleting curso:', error);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="cursos" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Gestión de Cursos</h1>
                        <p>Administra los grados y divisiones de la institución</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/cursos/nuevo" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nuevo Curso
                        </Link>
                    </div>
                </header>

                <div className="toolbar animate-slide-in">
                    <div className="search-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="input"
                            placeholder="Buscar por año o división..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-card" style={{ maxWidth: '800px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando cursos...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Nombre del Curso</th>
                                        <th>Año</th>
                                        <th>División</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cursos.length > 0 ? (
                                        cursos.map((curso) => (
                                            <tr key={curso.id_curso}>
                                                <td>
                                                    <div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--primary-600)' }}>
                                                        {curso.anio}{curso.division}
                                                    </div>
                                                </td>
                                                <td>{curso.anio}º Año</td>
                                                <td>División "{curso.division}"</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="action-icons" style={{ justifyContent: 'flex-end' }}>
                                                        <Link href={`/cursos/editar/${curso.id_curso}`} className="action-icon" title="Editar">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </Link>
                                                        <button onClick={() => handleDelete(curso.id_curso)} className="action-icon" title="Eliminar" style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer' }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No se encontraron cursos
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="pagination-controls" style={{
                                padding: 'var(--spacing-lg)',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Total: {pagination.total} cursos
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                    >
                                        Anterior
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)', fontWeight: '600' }}>
                                        {pagination.page} de {pagination.totalPages || 1}
                                    </div>
                                    <button
                                        className="btn"
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
