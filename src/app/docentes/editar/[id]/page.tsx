'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function EditarDocentePage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        adress: '',
        movil: '',
    });

    useEffect(() => {
        const fetchDocente = async () => {
            try {
                const response = await fetch(`/api/docentes/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        name: data.persona.name || '',
                        lastName: data.persona.lastName || '',
                        dni: data.persona.dni || '',
                        adress: data.persona.adress || '',
                        movil: data.persona.movil || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching docente:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocente();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setNotification(null);

        try {
            const response = await fetch(`/api/docentes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Datos actualizados con éxito!' });
                setTimeout(() => router.push('/docentes'), 2000);
            } else {
                setNotification({ type: 'error', message: 'No se pudo actualizar el docente' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div className="students-container">
            <Sidebar activePage="docentes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Editar Docente</h1>
                        <p>Modifica la información personal del docente</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/docentes" className="btn">Volver al Listado</Link>
                    </div>
                </header>

                <div className="animate-slide-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: '30px' }}>
                        {notification && (
                            <div className={`badge ${notification.type === 'success' ? 'badge-success' : 'badge-warning'}`}
                                style={{ width: '100%', marginBottom: '20px', padding: '15px' }}>
                                {notification.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input required name="name" className="input" value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Apellido</label>
                                    <input required name="lastName" className="input" value={formData.lastName} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div className="form-group">
                                    <label>DNI</label>
                                    <input name="dni" className="input" value={formData.dni} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Móvil</label>
                                    <input name="movil" className="input" value={formData.movil} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Dirección</label>
                                <input name="adress" className="input" value={formData.adress} onChange={handleChange} />
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/docentes" className="btn">Cancelar</Link>
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
