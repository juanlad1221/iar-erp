'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function BajaMateriaPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [materia, setMateria] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchMateria = async () => {
            try {
                const response = await fetch(`/api/materias/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setMateria(data);
                }
            } catch (error) {
                console.error('Error fetching materia:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMateria();
    }, [id]);

    const handleToggleStatus = async () => {
        setProcessing(true);
        try {
            const response = await fetch(`/api/materias/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                router.push('/materias');
            }
        } catch (error) {
            console.error('Error procesando cambio de estado:', error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div className="students-container">
            <Sidebar activePage="materias" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>{materia?.active ? 'Baja de Materia' : 'Alta de Materia'}</h1>
                        <p>{materia?.active ? 'Confirma la inhabilitación de la asignatura' : 'Confirma la reactivación de la asignatura'} en el sistema</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="animate-slide-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '30px' }}>
                            <div className="avatar" style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 20px',
                                fontSize: '2rem',
                                background: materia?.active ? 'var(--error-100)' : 'var(--primary-100)',
                                color: materia?.active ? 'var(--error-600)' : 'var(--primary-600)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {materia?.nombre_materia?.[0]}
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                                {materia?.nombre_materia}
                            </h2>
                            <div style={{ marginTop: '10px' }}>
                                <span className={`badge ${materia?.active ? 'badge-success' : 'badge-error'}`}>
                                    Estado Actual: {materia?.active ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>
                        </div>

                        <div style={{
                            background: materia?.active ? 'var(--error-50)' : 'var(--primary-50)',
                            padding: '20px',
                            borderRadius: 'var(--radius-lg)',
                            border: `1px solid ${materia?.active ? 'var(--error-200)' : 'var(--primary-200)'}`,
                            marginBottom: '30px'
                        }}>
                            <p style={{ color: materia?.active ? 'var(--error-700)' : 'var(--primary-700)', fontWeight: '600' }}>
                                ¿Estás seguro de que deseas {materia?.active ? 'dar de baja' : 'volver a activar'} esta materia?
                            </p>
                            <p style={{ color: materia?.active ? 'var(--error-600)' : 'var(--primary-600)', fontSize: '0.875rem', marginTop: '10px' }}>
                                {materia?.active
                                    ? 'La materia será marcada como inactiva y no podrá ser seleccionada para nuevas asignaciones.'
                                    : 'La materia será marcada como activa y podrá ser asignada a cursos y docentes nuevamente.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <Link href="/materias" className="btn">Cancelar</Link>
                            <button
                                onClick={handleToggleStatus}
                                className="btn btn-primary"
                                style={{
                                    background: materia?.active ? 'var(--error-600)' : 'var(--primary-600)',
                                    borderColor: materia?.active ? 'var(--error-600)' : 'var(--primary-600)'
                                }}
                                disabled={processing}
                            >
                                {processing ? 'Procesando...' : (materia?.active ? 'Confirmar Baja' : 'Confirmar Alta')}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
