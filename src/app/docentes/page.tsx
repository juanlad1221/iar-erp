'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';

interface DocenteData {
    id_docente: number;
    active: boolean;
    persona: {
        name: string;
        lastName: string;
        dni: string;
        movil: string;
    }
}

export default function DocentesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [docentes, setDocentes] = useState<DocenteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const fetchDocentes = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/docentes?page=${page}&pageSize=${pagination.pageSize}&search=${search}`);
            if (response.ok) {
                const result = await response.json();
                setDocentes(result.data);
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching docentes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDocentes(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchDocentes(newPage, searchTerm);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="docentes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Gestión de Docentes</h1>
                        <p>Administra la planta docente y sus asignaciones académicas</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/docentes/nuevo" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nuevo Docente
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
                            placeholder="Buscar por nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando docentes...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Docente</th>
                                        <th>DNI</th>
                                        <th>Contacto</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {docentes.length > 0 ? (
                                        docentes.map((docente) => (
                                            <tr key={docente.id_docente}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="avatar" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                                                            {docente.persona?.name?.[0]}{docente.persona?.lastName?.[0]}
                                                        </div>
                                                        <div className="name-cell">
                                                            <span className="name">{docente.persona?.name} {docente.persona?.lastName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{docente.persona?.dni}</td>
                                                <td>{docente.persona?.movil || '-'}</td>
                                                <td>
                                                    <span className={`badge ${docente.active ? 'badge-success' : 'badge-error'}`}>
                                                        {docente.active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-icons">
                                                        <Link href={`/docentes/editar/${docente.id_docente}`} className="action-icon" title="Editar">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={`/docentes/baja/${docente.id_docente}`}
                                                            className="action-icon"
                                                            title={docente.active ? "Baja" : "Alta"}
                                                            style={{ color: docente.active ? 'var(--error-600)' : 'var(--primary-600)' }}
                                                        >
                                                            {docente.active ? (
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
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No se encontraron docentes
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
                                    Mostrando {docentes.length} de {pagination.total} docentes
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
                                        Página {pagination.page} de {pagination.totalPages || 1}
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
