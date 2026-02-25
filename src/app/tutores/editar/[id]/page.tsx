'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function EditarTutorPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        adress: '',
        movil: ''
    });

    useEffect(() => {
        const fetchTutor = async () => {
            try {
                const res = await fetch(`/api/tutores/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.persona.name || '',
                        lastName: data.persona.lastName || '',
                        dni: data.persona.dni || '',
                        adress: data.persona.adress || '',
                        movil: data.persona.movil || ''
                    });
                } else {
                    alert('Error al cargar datos del tutor');
                    router.push('/tutores');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo conectar con el servidor');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTutor();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/tutores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/tutores');
            } else {
                const data = await res.json();
                alert('Error al guardar: ' + (data.error || 'Desconocido'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="students-container">
                <Sidebar activePage="tutores" />
                <main className="students-main">
                    <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos del tutor...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="students-container">
            <Sidebar activePage="tutores" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Link href="/tutores" className="btn-icon" title="Volver">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </Link>
                            <h1>Editar Tutor</h1>
                        </div>
                        <p>Actualiza la información personal del tutor</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="table-card animate-slide-in" style={{ padding: '30px', maxWidth: '800px' }}>
                    <form onSubmit={handleSubmit} className="student-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellido</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>DNI</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={formData.dni}
                                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Mobil / Teléfono</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.movil}
                                    onChange={e => setFormData({ ...formData, movil: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.adress}
                                    onChange={e => setFormData({ ...formData, adress: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <Link href="/tutores" className="btn">
                                Cancelar
                            </Link>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
