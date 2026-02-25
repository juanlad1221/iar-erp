'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
//import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/app/components/ThemeToggle';

interface Notificacion {
    id: string;
    titulo: string;
    mensaje: string;
    importancia: string;
    leida: boolean;
    fecha_creacion: string;
    fecha_expiracion: string;
    rol_destino?: {
        rol: string;
    };
}

export default function TutorNotificacionesPage() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; notification: Notificacion | null }>({
        open: false,
        notification: null
    });
    const [editModal, setEditModal] = useState<{ open: boolean; notification: Notificacion | null }>({
        open: false,
        notification: null
    });
    const router = useRouter();

    useEffect(() => {
        const fetchNotificaciones = async () => {
            try {
                // FORZAR: Obtener datos de tutor del localStorage
                const tutorData = localStorage.getItem('tutorData');
                const tutorAuthenticated = localStorage.getItem('tutorAuthenticated');

                console.log('=== PÁGINA ESPECÍFICA DE TUTOR ===');
                console.log('tutorData:', tutorData);
                console.log('tutorAuthenticated:', tutorAuthenticated);

                if (!tutorData || !tutorAuthenticated) {
                    router.push('/tutor-login');
                    return;
                }

                const tutor = JSON.parse(tutorData!) as { id: number };
                const userId = tutor.id.toString();
                const userRole = '6'; // Role ID for tutors (corrected based on DB data)

                console.log('📚 Tutor específico detectado:', { userId, userRole });

                // Obtener notificaciones para rol de tutor
                const response = await fetch(`/api/notificaciones?userId=${userId}&userRole=${userRole}&mode=received`);
                const data = await response.json();

                console.log('📬 Response API:', data);

                if (data.success) {
                    setNotificaciones(data.data);
                }
            } catch (err) {
                console.error('Error al cargar notificaciones:', err);
            }
        };

        fetchNotificaciones();
    }, []);

    const handleEdit = (notificacion: Notificacion) => {
        console.log('Editando notificación:', notificacion);
        setEditModal({ open: true, notification: notificacion });
    };

    const handleDelete = async (notificacion: Notificacion) => {
        setDeleteModal({ open: true, notification: notificacion });
    };

    const confirmDelete = async () => {
        if (!deleteModal.notification) return;

        try {
            const response = await fetch(`/api/notificaciones/${deleteModal.notification.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const fetchNotificaciones = async () => {
                    try {
                        const tutorData = localStorage.getItem('tutorData');
                        if (!tutorData) return;
                        const tutor = JSON.parse(tutorData);
                        const userId = tutor.id.toString();
                        const userRole = '2';

                        const response = await fetch(`/api/notificaciones?userId=${userId}&userRole=${userRole}&mode=received`);
                        const data = await response.json();
                        if (data.success) {
                            setNotificaciones(data.data);
                        }
                    } catch (err) {
                        console.error('Error al cargar notificaciones:', err);
                    }
                };

                fetchNotificaciones();
                setDeleteModal({ open: false, notification: null });
            } else {
                const error = await response.json();
                alert('Error al eliminar notificación: ' + (error.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de conexión al eliminar notificación');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ open: false, notification: null });
    };

    const confirmEdit = async () => {
        if (!editModal.notification) return;

        try {
            const response = await fetch(`/api/notificaciones/${editModal.notification.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titulo: editModal.notification.titulo,
                    mensaje: editModal.notification.mensaje,
                    importancia: editModal.notification.importancia
                })
            });

            if (response.ok) {
                // Recargar la lista de notificaciones
                const fetchNotificaciones = async () => {
                    try {
                        const tutorData = localStorage.getItem('tutorData');
                        if (!tutorData) return;
                        const tutor = JSON.parse(tutorData) as { id: number };
                        const userId = tutor.id.toString();
                        const userRole = '6';

                        const response = await fetch(`/api/notificaciones?userId=${userId}&userRole=${userRole}&mode=received`);
                        const data = await response.json();
                        if (data.success) {
                            setNotificaciones(data.data);
                        }
                    } catch (err) {
                        console.error('Error al cargar notificaciones:', err);
                    }
                };

                fetchNotificaciones();
                setEditModal({ open: false, notification: null });
            } else {
                const error = await response.json();
                alert('Error al actualizar notificación: ' + (error.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de conexión al actualizar notificación');
        }
    };

    const cancelEdit = () => {
        setEditModal({ open: false, notification: null });
    };

    const handleEditFieldChange = (field: keyof Notificacion, value: string) => {
        if (!editModal.notification) return;
        setEditModal({
            ...editModal,
            notification: {
                ...editModal.notification,
                [field]: value
            }
        });
    };

    const getImportanciaBadge = (importancia: string) => {
        switch (importancia) {
            case 'BAJA':
                return 'badge-neutral';
            case 'MEDIA':
                return 'badge-warning';
            case 'ALTA':
                return 'badge-error';
            default:
                return 'badge-neutral';
        }
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Modal de edición
    if (editModal.open && editModal.notification) {
        console.log('Renderizando modal de edición para:', editModal.notification);
    }

    return (
        <div className="students-container">
            <Sidebar activePage="notificaciones" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Mis Notificaciones</h1>
                        <p>Notificaciones activas para tutores</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/tutor-portal" className="btn">
                            Volver al Portal
                        </Link>
                    </div>
                </header>

                <div className="table-card animate-slide-in">
                    {notificaciones.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto var(--spacing-lg)',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--gray-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem'
                            }}>
                                📬
                            </div>
                            <h3 style={{
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--spacing-sm)',
                                fontSize: '1.25rem',
                                fontWeight: '600'
                            }}>
                                No hay notificaciones
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                                No hay notificaciones activas para tutores en este momento.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Importancia</th>
                                        <th>Fecha de Creación</th>
                                        <th>Fecha de Expiración</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notificaciones.map((notificacion) => (
                                        <tr key={notificacion.id}>
                                            <td>
                                                <div style={{
                                                    fontWeight: '600',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {notificacion.titulo}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${getImportanciaBadge(notificacion.importancia)}`}>
                                                    {notificacion.importancia}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                    {formatearFecha(notificacion.fecha_creacion)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                    {formatearFecha(notificacion.fecha_expiracion)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-icons">
                                                    <button
                                                        className="action-icon"
                                                        onClick={() => handleEdit(notificacion)}
                                                        title="Editar notificación"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="action-icon"
                                                        onClick={() => handleDelete(notificacion)}
                                                        title="Eliminar notificación"
                                                        style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3,6 5,6 21,6"></polyline>
                                                            <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"></path>
                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de edición */}
            {editModal.open && editModal.notification && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={cancelEdit}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--surface)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-2xl)',
                            maxWidth: '600px',
                            width: '90%',
                            boxShadow: 'var(--shadow-2xl)',
                            border: '1px solid var(--border)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 'var(--spacing-xl)',
                            paddingBottom: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 'var(--spacing-md)',
                                fontSize: '1.25rem'
                            }}>
                                ✏️
                            </div>
                            <div>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    Editar Notificación
                                </h2>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    margin: 0,
                                    fontSize: '0.875rem'
                                }}>
                                    Modifica los campos deseados
                                </p>
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: '600'
                            }}>
                                Título
                            </label>
                            <input
                                type="text"
                                value={editModal.notification.titulo}
                                onChange={(e) => handleEditFieldChange('titulo', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-md)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                                placeholder="Ingrese el título"
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: '600'
                            }}>
                                Mensaje
                            </label>
                            <textarea
                                value={editModal.notification.mensaje}
                                onChange={(e) => handleEditFieldChange('mensaje', e.target.value)}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-md)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                placeholder="Ingrese el mensaje"
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: '600'
                            }}>
                                Importancia
                            </label>
                            <select
                                value={editModal.notification.importancia}
                                onChange={(e) => handleEditFieldChange('importancia', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-md)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="BAJA">Baja</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                            </select>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            justifyContent: 'flex-end',
                            marginTop: 'var(--spacing-xl)'
                        }}>
                            <button
                                onClick={cancelEdit}
                                style={{
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                    border: '2px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={confirmEdit}
                                style={{
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                                }}
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {deleteModal.open && deleteModal.notification && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                onClick={cancelDelete}
            >
                <div
                    style={{
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-2xl)',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: 'var(--shadow-2xl)',
                        border: '1px solid var(--border)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            margin: '0 auto var(--spacing-lg)',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: 'var(--error)'
                        }}>
                            🗑️
                        </div>

                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            Eliminar Notificación
                        </h2>

                        <p style={{
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--spacing-lg)',
                            lineHeight: 1.5
                        }}>
                            ¿Estás seguro de que deseas eliminar la notificación
                            <strong style={{ color: 'var(--text-primary)' }}>
                                "{deleteModal.notification.titulo}"
                            </strong>?
                            <br />
                            Esta acción no se puede deshacer.
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            justifyContent: 'center',
                            marginTop: 'var(--spacing-xl)'
                        }}>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                    border: '2px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--error)',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--error)';
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}