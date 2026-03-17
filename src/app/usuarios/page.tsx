'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import CreateUserModal from '../components/CreateUserModal';

interface UsuarioData {
    id: string;
    userName: string | null;
    active: boolean;
    created_at: string;
    Data_personal: {
        id: string;
        name: string | null;
        lastName: string | null;
        dni: string | null;
        movil: string | null;
    } | null;
    roles: { idRol: string; idUser: string; rol: string }[];
}

export default function UsuariosPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const fetchUsuarios = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/usuarios?page=${page}&pageSize=${pagination.pageSize}&search=${search}`);
            if (response.ok) {
                const result = await response.json();
                setUsuarios(result.data);
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsuarios(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsuarios(newPage, searchTerm);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const normalizedRole = role.toLowerCase().replace('/a', '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        switch (normalizedRole) {
            case 'administrador':
                return 'badge-primary';
            case 'director':
                return 'badge-info';
            case 'secretario':
                return 'badge-warning';
            case 'preceptor':
                return 'badge-success';
            default:
                return 'badge-default';
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="usuarios" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Gestión de Usuarios</h1>
                        <p>Administra los usuarios del sistema y sus roles</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nuevo Usuario
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
                            placeholder="Buscar por nombre, apellido, usuario o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando usuarios...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>DNI</th>
                                        <th>Contacto</th>
                                        <th>Roles</th>
                                        <th>Estado</th>
                                        <th>Fecha Alta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.length > 0 ? (
                                        usuarios.map((usuario) => (
                                            <tr key={usuario.id}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="avatar" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                                                            {usuario.Data_personal?.name?.[0] || usuario.userName?.[0] || 'U'}
                                                        </div>
                                                        <div className="name-cell">
                                                            <span className="name">
                                                                {usuario.Data_personal?.name 
                                                                    ? `${usuario.Data_personal.name} ${usuario.Data_personal.lastName || ''}`
                                                                    : usuario.userName || 'Sin nombre'}
                                                            </span>
                                                            <span className="email">{usuario.userName || '-'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{usuario.Data_personal?.dni || '-'}</td>
                                                <td>{usuario.Data_personal?.movil || '-'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        {usuario.roles.map((role, idx) => (
                                                            <span key={idx} className={`badge ${getRoleBadgeColor(role.rol)}`}>
                                                                {role.rol}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${usuario.active ? 'badge-success' : 'badge-error'}`}>
                                                        {usuario.active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {usuario.created_at 
                                                        ? new Date(usuario.created_at).toLocaleDateString('es-AR')
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No se encontraron usuarios
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
                                    Mostrando {usuarios.length} de {pagination.total} usuarios
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

                <CreateUserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => fetchUsuarios(pagination.page, searchTerm)}
                />
            </main>
        </div>
    );
}
