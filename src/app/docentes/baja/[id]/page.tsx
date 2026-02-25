'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function BajaDocentePage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [docente, setDocente] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchDocente = async () => {
            try {
                const response = await fetch(`/api/docentes/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setDocente(data);
                }
            } catch (error) {
                console.error('Error fetching docente:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocente();
    }, [id]);

    const handleBaja = async () => {
        setProcessing(true);
        try {
            const response = await fetch(`/api/docentes/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                router.push('/docentes');
            }
        } catch (error) {
            console.error('Error procesando baja:', error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div className="students-container">
            <Sidebar activePage="docentes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>{docente?.active ? 'Baja de Docente' : 'Alta de Docente'}</h1>
                        <p>{docente?.active ? 'Confirma la inhabilitación del docente' : 'Confirma la reactivación del docente'} en el sistema</p>
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
                                background: docente?.active ? 'var(--error-100)' : 'var(--primary-100)',
                                color: docente?.active ? 'var(--error-600)' : 'var(--primary-600)'
                            }}>
                                {docente?.persona?.name?.[0]}{docente?.persona?.lastName?.[0]}
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                                {docente?.persona?.name} {docente?.persona?.lastName}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }}>DNI: {docente?.persona?.dni}</p>
                            <div style={{ marginTop: '10px' }}>
                                <span className={`badge ${docente?.active ? 'badge-success' : 'badge-error'}`}>
                                    Estado Actual: {docente?.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        <div style={{
                            background: docente?.active ? 'var(--error-50)' : 'var(--primary-50)',
                            padding: '20px',
                            borderRadius: 'var(--radius-lg)',
                            border: `1px solid ${docente?.active ? 'var(--error-200)' : 'var(--primary-200)'}`,
                            marginBottom: '30px'
                        }}>
                            <p style={{ color: docente?.active ? 'var(--error-700)' : 'var(--primary-700)', fontWeight: '600' }}>
                                ¿Estás seguro de que deseas {docente?.active ? 'dar de baja' : 'volver a activar'} a este docente?
                            </p>
                            <p style={{ color: docente?.active ? 'var(--error-600)' : 'var(--primary-600)', fontSize: '0.875rem', marginTop: '10px' }}>
                                {docente?.active
                                    ? 'El docente será marcado como inactivo y no podrá ser asignado a nuevos cursos o materias.'
                                    : 'El docente será marcado como activo y podrá ser asignado a cursos y materias nuevamente.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <Link href="/docentes" className="btn">Cancelar</Link>
                            <button
                                onClick={handleBaja}
                                className="btn btn-primary"
                                style={{
                                    background: docente?.active ? 'var(--error-600)' : 'var(--primary-600)',
                                    borderColor: docente?.active ? 'var(--error-600)' : 'var(--primary-600)'
                                }}
                                disabled={processing}
                            >
                                {processing ? 'Procesando...' : (docente?.active ? 'Confirmar Baja' : 'Confirmar Alta')}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
