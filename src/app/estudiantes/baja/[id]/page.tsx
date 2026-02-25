'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';
import Tabs from '../../../components/Tabs';

interface StudentData {
    id_alumno: number;
    legajo: string;
    estado: string;
    persona: {
        name: string;
        lastName: string;
        dni: string;
    }
}

export default function BajaEstudiantePage() {
    const { id } = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [motivoBaja, setMotivoBaja] = useState('');
    const [confirmando, setConfirmando] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await fetch(`/api/estudiantes/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudent(data);
                }
            } catch (error) {
                console.error('Error fetching student:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStudent();
    }, [id]);

    const handleBaja = async () => {
        if (!motivoBaja) {
            setNotification({ type: 'error', message: 'Debe seleccionar un motivo de baja' });
            return;
        }

        setConfirmando(true);
        try {
            const res = await fetch(`/api/estudiantes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    estado: `Baja - ${motivoBaja}`,
                    motivo_baja: motivoBaja
                })
            });

            if (res.ok) {
                setNotification({ type: 'success', message: 'El alumno ha sido dado de baja correctamente' });
                setTimeout(() => {
                    router.push('/estudiantes');
                }, 2000);
            } else {
                const error = await res.json();
                setNotification({ type: 'error', message: error.error || 'Error al dar de baja al alumno' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión al procesar la baja' });
        } finally {
            setConfirmando(false);
        }
    };

    const tabs = [
        {
            id: 'individual',
            label: 'Baja por Alumno',
            content: (
                <div style={{ padding: '20px' }}>
                    {loading ? (
                        <p>Cargando datos del estudiante...</p>
                    ) : student ? (
                        <div className="student-profile" style={{ textAlign: 'left' }}>
                            <div style={{ background: 'var(--background-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                                <h3 style={{ marginBottom: '16px', color: 'var(--primary-600)' }}>Información del Estudiante</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Nombre Completo</label>
                                        <p style={{ fontWeight: '600' }}>{student.persona.name} {student.persona.lastName}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Legajo</label>
                                        <p style={{ fontWeight: '600' }}>{student.legajo}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>DNI</label>
                                        <p style={{ fontWeight: '600' }}>{student.persona.dni}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Estado Actual</label>
                                        <span className={`badge badge-info`}>{student.estado}</span>
                                    </div>
                                </div>
                            </div>

                            {notification && (
                                <div style={{ 
                                    padding: '12px 16px', 
                                    marginTop: '20px',
                                    borderRadius: 'var(--radius-md)', 
                                    background: notification.type === 'success' ? 'var(--success-50)' : 'var(--error-50)',
                                    border: `1px solid ${notification.type === 'success' ? 'var(--success-200)' : 'var(--error-200)'}`,
                                    color: notification.type === 'success' ? 'var(--success-700)' : 'var(--error-700)'
                                }}>
                                    {notification.message}
                                </div>
                            )}

                            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid var(--error-200)', borderRadius: 'var(--radius-lg)', background: 'var(--error-50)' }}>
                                <h4 style={{ color: 'var(--error-700)', marginBottom: '10px' }}>⚠️ Zona de Peligro</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--error-600)', marginBottom: '20px' }}>
                                    Esta acción marcará al estudiante como &apos;Baja&apos; en el sistema. El alumno no será visible en los listados.
                                </p>
                                
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--error-700)', marginBottom: '8px' }}>
                                        Motivo de la Baja *
                                    </label>
                                    <select 
                                        className="filter-select" 
                                        style={{ width: '100%', maxWidth: '300px', padding: '10px', borderColor: 'var(--error-300)' }}
                                        value={motivoBaja}
                                        onChange={(e) => setMotivoBaja(e.target.value)}
                                    >
                                        <option value="">Seleccione un motivo...</option>
                                        <option value="Cambio de Escuela">Cambio de Escuela</option>
                                        <option value="Fallecimiento">Fallecimiento</option>
                                    </select>
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    style={{ background: 'var(--error-600)', border: 'none' }} 
                                    onClick={handleBaja}
                                    disabled={!motivoBaja || confirmando || student.estado.startsWith('Baja')}
                                >
                                    {confirmando ? 'Procesando...' : 'Confirmar Baja de Estudiante'}
                                </button>
                                {student.estado.startsWith('Baja') && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--error-600)', marginTop: '8px' }}>
                                        Este alumno ya está dado de baja
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>No se encontró el estudiante</p>
                    )}
                </div>
            )
        },
        {
            id: 'curso',
            label: 'Baja por Curso Completo',
            content: (
                <div style={{ padding: '20px', textAlign: 'left' }}>
                    <div style={{ maxWidth: '400px' }}>
                        <div className="form-group">
                            <label>Seleccionar Curso</label>
                            <select className="filter-select" style={{ width: '100%', padding: '10px' }} disabled>
                                <option>Seleccione un curso...</option>
                                <option>1º Año - A</option>
                                <option>1º Año - B</option>
                                <option>2º Año - A</option>
                            </select>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '12px' }}>
                                Esta opción permitirá dar de baja a todos los alumnos pertenecientes a un curso específico en el futuro.
                            </p>
                        </div>
                        <button className="btn" style={{ marginTop: '20px' }} disabled>
                            Dar de Baja curso completo
                        </button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="students-container">
            <Sidebar activePage="estudiantes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Link href="/estudiantes" className="btn-icon" title="Volver">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </Link>
                            <h1>Baja de Estudiantes</h1>
                        </div>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="table-card animate-slide-in" style={{ padding: '0' }}>
                    <Tabs tabs={tabs} />
                </div>
            </main>
        </div>
    );
}
