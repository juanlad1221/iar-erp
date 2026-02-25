'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';

export default function NuevoDocentePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        adress: '',
        movil: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);
        
        try {
            const response = await fetch('/api/docentes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Docente registrado con éxito!' });
                setTimeout(() => router.push('/docentes'), 2000);
            } else {
                const error = await response.json();
                setNotification({ type: 'error', message: error.error || 'No se pudo registrar el docente' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="students-container">
            <Sidebar activePage="docentes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Registrar Nuevo Docente</h1>
                        <p>Completa la información personal para dar de alta al docente</p>
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
                                    <input required name="name" className="input" value={formData.name} onChange={handleChange} placeholder="Ej: Roberto" />
                                </div>
                                <div className="form-group">
                                    <label>Apellido</label>
                                    <input required name="lastName" className="input" value={formData.lastName} onChange={handleChange} placeholder="Ej: Gómez" />
                                </div>
                            </div>

                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div className="form-group">
                                    <label>DNI</label>
                                    <input name="dni" className="input" value={formData.dni} onChange={handleChange} placeholder="Número de documento" />
                                </div>
                                <div className="form-group">
                                    <label>Móvil</label>
                                    <input name="movil" className="input" value={formData.movil} onChange={handleChange} placeholder="Teléfono de contacto" />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Dirección</label>
                                <input name="adress" className="input" value={formData.adress} onChange={handleChange} placeholder="Calle, Número, Localidad" />
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/docentes" className="btn">Cancelar</Link>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Registrar Docente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
