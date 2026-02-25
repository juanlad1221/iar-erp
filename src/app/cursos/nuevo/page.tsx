'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';

export default function NuevoCursoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        anio: '',
        division: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const response = await fetch('/api/cursos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Curso creado con éxito!' });
                setTimeout(() => router.push('/cursos'), 2000);
            } else {
                const error = await response.json();
                setNotification({ type: 'error', message: error.error || 'No se pudo crear el curso' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="students-container">
            <Sidebar activePage="cursos" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Crear Nuevo Curso</h1>
                        <p>Define un nuevo año y su correspondiente división</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/cursos" className="btn">Volver al Listado</Link>
                    </div>
                </header>

                <div className="animate-slide-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: '30px' }}>
                        {notification && (
                            <div className={`badge ${notification.type === 'success' ? 'badge-success' : 'badge-warning'}`}
                                style={{ width: '100%', marginBottom: '20px', padding: '15px' }}>
                                {notification.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ padding: '20px', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)', marginBottom: '30px', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--primary-700)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Vista Previa del Nombre</span>
                                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-600)' }}>
                                    {formData.anio || '?'}{formData.division || '?'}
                                </span>
                            </div>

                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Año</label>
                                    <select required name="anio" className="input" value={formData.anio} onChange={handleChange as any}>
                                        <option value="">Seleccionar año</option>
                                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                            <option key={num} value={num}>{num}º Año</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>División</label>
                                    <input required name="division" className="input" maxLength={2} value={formData.division} onChange={handleChange} placeholder="Ej: A, B, C..." style={{ textTransform: 'uppercase' }} />
                                </div>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/cursos" className="btn">Cancelar</Link>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Crear Curso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
