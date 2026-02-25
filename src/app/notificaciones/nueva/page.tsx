'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';
import '../notificaciones.css'; // Reusing styles from parent

export default function NuevaNotificacionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        titulo: '',
        mensaje: '',
        destinoValor: 'tutores', // Solo roles: tutores, docentes, preceptores
        duracion_dias: 7, // 7 days default
        importancia: 'MEDIA'
    });

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Get current user info
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
            setCurrentUser(JSON.parse(userInfo));
        } else {
            // Fallback to userId if user object is not available
            const userId = localStorage.getItem('userId');
            if (userId) {
                setCurrentUser({ id: userId });
            } else {
                // Default user for testing
                setCurrentUser({ id: '1' });
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!currentUser) {
            setError('No se pudo identificar al usuario remitente. Por favor inicie sesión.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                titulo: formData.titulo,
                mensaje: formData.mensaje,
                destino: {
                    tipo: 'rol',
                    valor: formData.destinoValor
                },
                duracion_minutos: Number(formData.duracion_dias) * 24 * 60, // Convertir días a minutos
                usuario_id_remitente: currentUser.id,
                importancia: formData.importancia
            };

            const response = await fetch('/api/notificaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear la notificación');
            }

            setSuccess('Notificación enviada exitosamente');
            // Reset form or redirect
            setTimeout(() => {
                router.push('/notificaciones');
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar la notificación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="notificaciones" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Crear Nueva Notificación</h1>
                        <p>Envía un mensaje a los destinatarios seleccionados</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/notificaciones" className="btn">
                            Volver al Listado
                        </Link>
                    </div>
                </header>

                <div className="animate-slide-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="card">
                        {error && (
                            <div className="badge badge-warning" style={{ width: '100%', marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="badge badge-success" style={{ width: '100%', marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="student-form">
                            <div className="form-group">
                                <label htmlFor="titulo">Título</label>
                                <input
                                    type="text"
                                    id="titulo"
                                    name="titulo"
                                    value={formData.titulo}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                    placeholder="Título de la notificación"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="destinoValor">Destinatario (Rol)</label>
                                <select
                                    id="destinoValor"
                                    name="destinoValor"
                                    value={formData.destinoValor}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="tutor">Tutores</option>
                                    <option value="docente">Docentes</option>
                                    <option value="preceptor">Preceptores</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="mensaje">Mensaje</label>
                                <textarea
                                    id="mensaje"
                                    name="mensaje"
                                    value={formData.mensaje}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                    style={{ minHeight: '120px', resize: 'vertical' }}
                                    placeholder="Escribe el contenido de la notificación..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="importancia">Importancia</label>
                                <select
                                    id="importancia"
                                    name="importancia"
                                    value={formData.importancia}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="BAJA">Baja</option>
                                    <option value="MEDIA">Media</option>
                                    <option value="ALTA">Alta</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="duracion_dias">Duración (días)</label>
                                <input
                                    type="number"
                                    id="duracion_dias"
                                    name="duracion_dias"
                                    value={formData.duracion_dias}
                                    onChange={handleChange}
                                    min="1"
                                    max="30"
                                    required
                                    className="input"
                                />
                                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                    La notificación estará activa entre 1 y 30 días
                                </small>
                            </div>

                            <div className="modal-footer">
                                <Link href="/notificaciones" className="btn">
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? 'Enviando...' : 'Enviar Notificación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
