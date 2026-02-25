'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import AddTutorModal from '../components/AddTutorModal';
import Link from 'next/link';


interface TutorData {
    id_tutor: number;
    persona: {
        name: string;
        lastName: string;
        dni: string;
        adress: string;
        movil: string;
    }
}

export default function TutoresPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tutores, setTutores] = useState<TutorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const fetchTutores = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tutores?page=${page}&pageSize=${pagination.pageSize}&search=${search}`);
            if (response.ok) {
                const result = await response.json();
                setTutores(result.data);
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching tutores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTutores(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchTutores(newPage, searchTerm);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="tutores" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Gestión de Tutores</h1>
                        <p>Administra la información de los tutores y padres</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nuevo Tutor
                        </button>
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
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando tutores...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Tutor</th>
                                        <th>DNI</th>
                                        <th>Dirección</th>
                                        <th>Teléfono</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tutores.length > 0 ? (
                                        tutores.map((tutor) => (
                                            <tr key={tutor.id_tutor}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="avatar">
                                                            {tutor.persona?.name?.[0]}{tutor.persona?.lastName?.[0]}
                                                        </div>
                                                        <div className="name-cell">
                                                            <span className="name">{tutor.persona?.name} {tutor.persona?.lastName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{tutor.persona?.dni}</td>
                                                <td>{tutor.persona?.adress || '-'}</td>
                                                <td>{tutor.persona?.movil || '-'}</td>
                                                <td>
                                                    <div className="action-icons">
                                                        <Link href={`/tutores/editar/${tutor.id_tutor}`} className="action-icon" title="Editar">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </Link>
                                                        <Link href={`/tutores/baja/${tutor.id_tutor}`} className="action-icon" title="Eliminar">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No se encontraron tutores
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
                                    Mostrando {tutores.length} de {pagination.total} tutores
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

                <AddTutorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => fetchTutores(pagination.page, searchTerm)}
                />
            </main>
        </div>
    );
}
