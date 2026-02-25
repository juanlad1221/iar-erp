'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';

export default function NuevaMateriaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [nombreMateria, setNombreMateria] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const response = await fetch('/api/materias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_materia: nombreMateria }),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Materia creada con éxito!' });
                setTimeout(() => router.push('/materias'), 2000);
            } else {
                const error = await response.json();
                setNotification({ type: 'error', message: error.error || 'No se pudo crear la materia' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="materias" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Crear Nueva Materia</h1>
                        <p>Añade una nueva asignatura al plan de estudios</p>
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
                                    placeholder="Ej: Matemáticas, Historia, Física..."
                                />
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/materias" className="btn">Cancelar</Link>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Crear Materia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
