'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    destinatario?: {
        id: string;
        userName?: string;
        Data_personal?: {
            name?: string;
            lastName?: string;
        };
    };
}

export default function NotificacionesPage() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; notification: Notificacion | null }>({
        open: false,
        notification: null
    });
    const [editModal, setEditModal] = useState<{
        open: boolean;
        notification: Notificacion | null;
        form: { titulo: string; mensaje: string; importancia: string; destinoRol: string; duracion_minutos: number | '' };
    }>({
        open: false,
        notification: null,
        form: { titulo: '', mensaje: '', importancia: 'BAJA', destinoRol: 'tutores', duracion_minutos: '' }
    });
    const router = useRouter();

    useEffect(() => {
        const fetchNotificaciones = async () => {
            try {
                let userId = null;
                let userRole = null;
                let userInfo = null;

                // Check if user is coming from tutor portal (PRIORIDAD ALTA)
                //const tutorData = localStorage.getItem('tutorData');
                //const tutorAuthenticated = localStorage.getItem('tutorAuthenticated');
                userId = localStorage.getItem('userId');
                userRole = localStorage.getItem('activeRole');

                // FORZAR: Si hay datos de tutor, usar siempre rol de tutor
                /*if (tutorData && tutorAuthenticated) {
                    // User is from tutor portal
                    const tutor = JSON.parse(tutorData);
                    userId = localStorage.getItem('userId') || tutor.id.toString();
                    userRole = '6'; // Role ID for tutors (corrected based on DB data)
                    userInfo = { id: userId, role: 'tutor' };
                    console.log('✅ User detected from TUTOR portal');
                } else {
                    // User is from general login
                    userInfo = localStorage.getItem('user');
                    if (userInfo) {
                        const user = JSON.parse(userInfo);
                        userId = user.id;
                        // Get user role from different sources
                        userRole = user.roles ? user.roles[0] : null;
                    } else {
                        userId = localStorage.getItem('userId') || '1';
                        userRole = null;
                    }

                    // Try to get from localStorage if not found
                    if (!userRole) {
                        userRole = localStorage.getItem('activeRole') || localStorage.getItem('userRole');
                    }
                    console.log('❌ User detected from GENERAL login');
                }*/

                // Para roles como tutor/docente/preceptor, mostrar todas las notificaciones activas para su rol
                const response = await fetch(`/api/notificaciones?userId=${userId}&userRole=${userRole || ''}&mode=received`);
                const data = await response.json();
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
        setEditModal({
            open: true,
            notification: notificacion,
            form: {
                titulo: notificacion.titulo,
                mensaje: notificacion.mensaje,
                importancia: notificacion.importancia || 'BAJA',
                destinoRol: notificacion.rol_destino?.rol || 'tutores',
                duracion_minutos: ''
            }
        });
    };

    const submitEdit = async () => {
        if (!editModal.notification) return;
        try {
            const userId = localStorage.getItem('userId');
            const payload = {
                id: editModal.notification.id,
                titulo: editModal.form.titulo,
                mensaje: editModal.form.mensaje,
                importancia: editModal.form.importancia,
                destino: { tipo: 'rol', valor: editModal.form.destinoRol },
                duracion_minutos: editModal.form.duracion_minutos === '' ? undefined : editModal.form.duracion_minutos,
                usuario_id_remitente: userId
            };
            const resp = await fetch('/api/notificaciones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (data.success) {
                setNotificaciones((prev) =>
                    prev.map((n) => (n.id === editModal.notification?.id ? { ...n, ...data.data } : n))
                );
                setEditModal({
                    open: false,
                    notification: null,
                    form: { titulo: '', mensaje: '', importancia: 'BAJA', destinoRol: 'tutores', duracion_minutos: '' }
                });
            } else {
                alert(data.error || 'Error al editar notificación');
            }
        } catch {
            alert('Error de conexión al editar notificación');
        }
    };

    const cancelEdit = () => {
        setEditModal({
            open: false,
            notification: null,
            form: { titulo: '', mensaje: '', importancia: 'BAJA', destinoRol: 'tutores', duracion_minutos: '' }
        });
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
                // Recargar la lista de notificaciones
                const fetchNotificaciones = async () => {
                    try {
                        let userId = null;
                        let userRole = null;

                        // Check if user is coming from tutor portal
                        const tutorData = localStorage.getItem('tutorData');
                        const tutorAuthenticated = localStorage.getItem('tutorAuthenticated');

                        if (tutorData && tutorAuthenticated) {
                            // User is from tutor portal
                            const tutor = JSON.parse(tutorData);
                            userId = localStorage.getItem('userId') || tutor.id.toString();
                            userRole = '2'; // Role ID for tutors
                        } else {
                            // User is from general login
                            const userInfo = localStorage.getItem('user');
                            userId = userInfo ? JSON.parse(userInfo).id : localStorage.getItem('userId') || '1';

                            // Get user role from different sources
                            if (userInfo) {
                                const user = JSON.parse(userInfo);
                                userRole = user.roles ? user.roles[0] : null;
                            }

                            // Try to get from localStorage if not found
                            if (!userRole) {
                                userRole = localStorage.getItem('activeRole') || localStorage.getItem('userRole');
                            }
                        }

                        const response = await fetch(`/api/notificaciones?userId=${userId}&userRole=${userRole || ''}&mode=received`);
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

    if (editModal.open && editModal.notification) {
        return (
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
                        maxWidth: '640px',
                        width: '90%',
                        boxShadow: 'var(--shadow-2xl)',
                        border: '1px solid var(--border)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)' }}>
                        Editar Notificación
                    </h2>
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Título</label>
                            <input
                                value={editModal.form.titulo}
                                onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, titulo: e.target.value } }))}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Mensaje</label>
                            <textarea
                                value={editModal.form.mensaje}
                                onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, mensaje: e.target.value } }))}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Importancia</label>
                                <select
                                    value={editModal.form.importancia}
                                    onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, importancia: e.target.value } }))}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="BAJA">BAJA</option>
                                    <option value="MEDIA">MEDIA</option>
                                    <option value="ALTA">ALTA</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rol destino</label>
                                <select
                                    value={String(editModal.form.destinoRol)}
                                    onChange={(e) =>
                                        setEditModal((m) => ({
                                            ...m,
                                            form: { ...m.form, destinoRol: e.target.value }
                                        }))
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="tutores">Tutores</option>
                                    <option value="docentes">Docentes</option>
                                    <option value="preceptores">Preceptores</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Extender duración (minutos)</label>
                            <input
                                type="number"
                                min={1}
                                value={editModal.form.duracion_minutos}
                                onChange={(e) =>
                                    setEditModal((m) => ({
                                        ...m,
                                        form: {
                                            ...m.form,
                                            duracion_minutos: e.target.value === '' ? '' : Number(e.target.value)
                                        }
                                    }))
                                }
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
                        <button
                            onClick={cancelEdit}
                            style={{
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                border: '2px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={submitEdit}
                            style={{
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                border: 'none',
                                borderRadius: 'var(--radius-lg)',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Guardar cambios
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    // Modal de confirmación de eliminación
    if (deleteModal.open && deleteModal.notification) {
        return (
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
        );
    }

    return (
        <div className="students-container">
            <Sidebar activePage="notificaciones" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Mis Notificaciones</h1>
                        <p>Notificaciones activas para tu rol</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/notificaciones/nueva" className="btn btn-primary">
                            Nueva Notificación
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
                                No hay notificaciones activas para tu rol en este momento.
                            </p>
                            <Link href="/notificaciones/nueva" className="btn btn-primary">
                                Crear Notificación
                            </Link>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Destinatario</th>
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
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {notificacion.rol_destino?.rol || 'Todos'}
                                                </span>
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
        </div>
    );
}
