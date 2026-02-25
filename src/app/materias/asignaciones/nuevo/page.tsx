'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import Link from 'next/link';

export default function NuevaAsignacionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [materias, setMaterias] = useState<any[]>([]);
    const [cursos, setCursos] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [formData, setFormData] = useState({
        id_materia: '',
        id_curso: '',
        id_docente: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resM, resC, resD] = await Promise.all([
                    fetch('/api/materias?pageSize=100'),
                    fetch('/api/cursos?pageSize=100'),
                    fetch('/api/docentes?pageSize=100')
                ]);

                const dataM = await resM.json();
                const dataC = await resC.json();
                const dataD = await resD.json();

                setMaterias(dataM.data.filter((m: any) => m.active));
                setCursos(dataC.data);
                setDocentes(dataD.data.filter((d: any) => d.active));
            } catch (error) {
                console.error('Error fetching dependency data:', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Asignación creada con éxito!' });
                setTimeout(() => router.push('/materias/asignaciones'), 2000);
            } else {
                const error = await response.json();
                setNotification({ type: 'error', message: error.error || 'No se pudo crear la asignación' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="students-container">
            <Sidebar activePage="materias" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Nueva Asignación</h1>
                        <p>Vincula una materia con un curso y un docente responsable</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/materias/asignaciones" className="btn">Volver</Link>
                    </div>
                </header>

                <div className="animate-slide-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: '30px' }}>
                        {notification && (
                            <div className={`badge ${notification.type === 'success' ? 'badge-success' : 'badge-error'}`}
                                style={{ width: '100%', marginBottom: '20px', padding: '15px' }}>
                                {notification.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Materia</label>
                                <select required name="id_materia" className="input" value={formData.id_materia} onChange={handleChange}>
                                    <option value="">Seleccionar Materia</option>
                                    {materias.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre_materia}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Curso</label>
                                <select required name="id_curso" className="input" value={formData.id_curso} onChange={handleChange}>
                                    <option value="">Seleccionar Curso</option>
                                    {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.anio}{c.division}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Docente</label>
                                <select required name="id_docente" className="input" value={formData.id_docente} onChange={handleChange}>
                                    <option value="">Seleccionar Docente</option>
                                    {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.persona.lastName}, {d.persona.name}</option>)}
                                </select>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <Link href="/materias/asignaciones" className="btn">Cancelar</Link>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Asignando...' : 'Crear Asignación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
