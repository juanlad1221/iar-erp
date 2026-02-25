'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function EditarMateriaPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [nombreMateria, setNombreMateria] = useState('');

    useEffect(() => {
        const fetchMateria = async () => {
            try {
                const response = await fetch(`/api/materias/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setNombreMateria(data.nombre_materia);
                }
            } catch (error) {
                console.error('Error fetching materia:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMateria();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setNotification(null);

        try {
            const response = await fetch(`/api/materias/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_materia: nombreMateria }),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Materia actualizada con éxito!' });
                setTimeout(() => router.push('/materias'), 2000);
            } else {
                setNotification({ type: 'error', message: 'No se pudo actualizar la materia' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div className="students-container">
            <Sidebar activePage="materias" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Editar Materia</h1>
                        <p>Modifica el nombre de la asignatura seleccionada</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/materias" className="btn">Volver al Listado</Link>
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
                            <div className="form-group">
                                <label>Nombre de la Materia</label>
                                <input
                                    required
                                    className="input"
                                    value={nombreMateria}
                                    onChange={(e) => setNombreMateria(e.target.value)}
                                />
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/materias" className="btn">Cancelar</Link>
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
