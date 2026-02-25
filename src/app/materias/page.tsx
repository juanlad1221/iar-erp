'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';

interface MateriaData {
    id_materia: number;
    nombre_materia: string;
    active: boolean;
}

export default function MateriasPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [materias, setMaterias] = useState<MateriaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const fetchMaterias = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/materias?page=${page}&pageSize=${pagination.pageSize}&search=${search}`);
            if (response.ok) {
                const result = await response.json();
                setMaterias(result.data);
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching materias:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMaterias(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchMaterias(newPage, searchTerm);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="materias" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Gestión de Materias</h1>
                        <p>Administra las asignaturas disponibles en la institución</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/materias/nuevo" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nueva Materia
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
                            placeholder="Buscar materia por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-card" style={{ maxWidth: '900px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando materias...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Nombre de la Materia</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materias.length > 0 ? (
                                        materias.map((materia) => (
                                            <tr key={materia.id_materia}>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {materia.nombre_materia}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${materia.active ? 'badge-success' : 'badge-error'}`}>
                                                        {materia.active ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="action-icons" style={{ justifyContent: 'flex-end' }}>
                                                        <Link href={`/materias/editar/${materia.id_materia}`} className="action-icon" title="Editar">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={`/materias/baja/${materia.id_materia}`}
                                                            className="action-icon"
                                                            title={materia.active ? "Dar de Baja" : "Dar de Alta"}
                                                            style={{ color: materia.active ? 'var(--error-600)' : 'var(--primary-600)' }}
                                                        >
                                                            {materia.active ? (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"></path>
                                                                    <circle cx="8.5" cy="7" r="4"></circle>
                                                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                                                </svg>
                                                            ) : (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"></path>
                                                                    <circle cx="8.5" cy="7" r="4"></circle>
                                                                    <line x1="19" y1="8" x2="19" y2="14"></line>
                                                                    <line x1="16" y1="11" x2="22" y2="11"></line>
                                                                </svg>
                                                            )}
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No se encontraron materias
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
                                    Total: {pagination.total} materias
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
