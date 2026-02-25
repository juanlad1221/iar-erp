'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function EditarCursoPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        anio: '',
        division: '',
    });

    useEffect(() => {
        const fetchCurso = async () => {
            try {
                const response = await fetch(`/api/cursos/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        anio: data.anio.toString(),
                        division: data.division,
                    });
                }
            } catch (error) {
                console.error('Error fetching curso:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCurso();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setNotification(null);

        try {
            const response = await fetch(`/api/cursos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Curso actualizado con éxito!' });
                setTimeout(() => router.push('/cursos'), 2000);
            } else {
                setNotification({ type: 'error', message: 'No se pudo actualizar el curso' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div className="students-container">
            <Sidebar activePage="cursos" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Editar Curso</h1>
                        <p>Modifica el año o la división del curso seleccionado</p>
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
                                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                            <option key={num} value={num}>{num}º Año</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>División</label>
                                    <input required name="division" className="input" maxLength={2} value={formData.division} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                                </div>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/cursos" className="btn">Cancelar</Link>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
