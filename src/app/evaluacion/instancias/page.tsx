'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';

interface InstanciaData {
    id_instancia: number;
    nombre: string;
    active: boolean;
}

export default function InstanciasEvaluativasPage() {
    const [instancias, setInstancias] = useState<InstanciaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [nombreNueva, setNombreNueva] = useState('');
    const [creando, setCreando] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [editando, setEditando] = useState<number | null>(null);
    const [nombreEditado, setNombreEditado] = useState('');

    const fetchInstancias = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/instancias-evaluativas');
            if (response.ok) {
                const data = await response.json();
                setInstancias(data);
            }
        } catch (error) {
            console.error('Error fetching instancias:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstancias();
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nombreNueva.trim()) {
            setNotification({ type: 'error', message: 'El nombre es requerido' });
            return;
        }

        setCreando(true);
        try {
            const response = await fetch('/api/instancias-evaluativas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombreNueva.trim() })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: 'Instancia evaluativa creada correctamente' });
                setNombreNueva('');
                fetchInstancias();
            } else {
                const error = await response.json();
                setNotification({ type: 'error', message: error.error || 'Error al crear la instancia' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setCreando(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEditar = (instancia: InstanciaData) => {
        setEditando(instancia.id_instancia);
        setNombreEditado(instancia.nombre);
    };

    const handleGuardarEdicion = async (id: number) => {
        if (!nombreEditado.trim()) {
            setNotification({ type: 'error', message: 'El nombre es requerido' });
            return;
        }

        try {
            const response = await fetch(`/api/instancias-evaluativas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombreEditado.trim() })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: 'Instancia actualizada correctamente' });
                setEditando(null);
                fetchInstancias();
            } else {
                setNotification({ type: 'error', message: 'Error al actualizar la instancia' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCancelarEdicion = () => {
        setEditando(null);
        setNombreEditado('');
    };

    const handleBaja = async (id: number, currentActive: boolean) => {
        const action = currentActive ? 'dar de baja' : 'reactivar';
        if (!confirm(`¿Está seguro de ${action} esta instancia evaluativa?`)) return;

        try {
            const response = await fetch(`/api/instancias-evaluativas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentActive })
            });

            if (response.ok) {
                setNotification({ 
                    type: 'success', 
                    message: currentActive ? 'Instancia dada de baja correctamente' : 'Instancia reactivada correctamente' 
                });
                fetchInstancias();
            } else {
                setNotification({ type: 'error', message: 'Error al cambiar estado de la instancia' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="students-container">
            <Sidebar activePage="evaluacion" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Instancias Evaluativas</h1>
                        <p>Crea y administra las instancias de evaluación</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                    </div>
                </header>

                {notification && (
                    <div 
                        className={`animate-fade-in ${notification.type === 'success' ? 'notification-success' : 'notification-error'}`}
                        style={{ 
                            padding: '12px 16px', 
                            marginBottom: '20px',
                            borderRadius: 'var(--radius-md)', 
                            background: notification.type === 'success' ? 'var(--success-600)' : 'var(--error-600)',
                            color: '#fff',
                            fontWeight: '500'
                        }}
                    >
                        {notification.message}
                    </div>
                )}

                {/* Formulario para crear nueva instancia */}
                <div className="toolbar animate-slide-in" style={{ maxWidth: '700px', marginBottom: '24px', flexDirection: 'column', alignItems: 'stretch' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        ➕ Crear Nueva Instancia
                    </h3>
                    <form onSubmit={handleCrear} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '6px', 
                                fontSize: '0.875rem', 
                                fontWeight: '500',
                                color: 'var(--text-secondary)'
                            }}>
                                Nombre de la Instancia
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej: Examen Parcial, Trabajo Práctico, etc."
                                value={nombreNueva}
                                onChange={(e) => setNombreNueva(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={creando || !nombreNueva.trim()}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {creando ? 'Creando...' : 'Crear Instancia'}
                        </button>
                    </form>
                </div>

                {/* Tabla de instancias */}
                <div className="table-card" style={{ maxWidth: '700px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando instancias...</div>
                    ) : (
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Nombre de la Instancia</th>
                                    <th style={{ width: '100px' }}>Estado</th>
                                    <th style={{ width: '120px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instancias.length > 0 ? (
                                    instancias.map((instancia, index) => (
                                        <tr key={instancia.id_instancia}>
                                            <td style={{ color: 'var(--text-tertiary)', fontWeight: '500' }}>
                                                {index + 1}
                                            </td>
                                            <td>
                                                {editando === instancia.id_instancia ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            value={nombreEditado}
                                                            onChange={(e) => setNombreEditado(e.target.value)}
                                                            style={{ flex: 1, minWidth: '150px', padding: '6px 10px' }}
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => handleGuardarEdicion(instancia.id_instancia)}
                                                            className="action-icon"
                                                            style={{ color: 'var(--success-600)' }}
                                                            title="Guardar"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelarEdicion}
                                                            className="action-icon"
                                                            style={{ color: 'var(--error-600)' }}
                                                            title="Cancelar"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {instancia.nombre}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${instancia.active ? 'badge-success' : 'badge-error'}`}>
                                                    {instancia.active ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {editando !== instancia.id_instancia && (
                                                    <div className="action-icons" style={{ justifyContent: 'flex-end' }}>
                                                        <button 
                                                            onClick={() => handleEditar(instancia)}
                                                            className="action-icon" 
                                                            title="Editar"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleBaja(instancia.id_instancia, instancia.active)}
                                                            className="action-icon"
                                                            title={instancia.active ? "Dar de Baja" : "Reactivar"}
                                                            style={{ color: instancia.active ? 'var(--error-600)' : 'var(--success-600)' }}
                                                        >
                                                            {instancia.active ? (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                                                </svg>
                                                            ) : (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                            No hay instancias evaluativas creadas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                    
                    {instancias.length > 0 && (
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            borderTop: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            Total: {instancias.length} instancias evaluativas
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
