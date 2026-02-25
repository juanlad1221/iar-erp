'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';
import Tabs from '../../components/Tabs';

interface Tutor {
    id_tutor: number;
    persona: {
        name: string;
        lastName: string;
        dni: string;
    };
}

export default function NewStudentPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('student');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        fecha_nacimiento: '',
        legajo: '',
        id_curso: '',
    });

    const [cursos, setCursos] = useState<any[]>([]);

    // Tutor assignment state
    const [tutorSearch, setTutorSearch] = useState('');
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [searchingTutors, setSearchingTutors] = useState(false);
    const [selectedTutors, setSelectedTutors] = useState<Tutor[]>([]);

    useEffect(() => {
        const fetchCursos = async () => {
            const res = await fetch('/api/cursos?pageSize=100');
            const data = await res.json();
            setCursos(data.data);
        };
        fetchCursos();
    }, []);

    useEffect(() => {
        if (activeTab === 'tutor' && tutorSearch.trim().length > 2) {
            const delayDebounceFn = setTimeout(() => {
                searchTutors();
            }, 500);

            return () => clearTimeout(delayDebounceFn);
        } else if (tutorSearch.trim().length === 0) {
            setTutors([]);
        }
    }, [tutorSearch, activeTab]);

    const searchTutors = async () => {
        setSearchingTutors(true);
        try {
            const response = await fetch(`/api/tutores?search=${tutorSearch}`);
            if (response.ok) {
                const result = await response.json();
                // The API returns { data: TutorData[], meta: ... }
                setTutors(Array.isArray(result.data) ? result.data : []);
            }
        } catch (error) {
            console.error('Error searching tutors:', error);
        } finally {
            setSearchingTutors(false);
        }
    };

    const toggleTutor = (tutor: Tutor) => {
        setSelectedTutors(prev => {
            const isSelected = prev.some(t => t.id_tutor === tutor.id_tutor);
            if (isSelected) {
                return prev.filter(t => t.id_tutor !== tutor.id_tutor);
            } else {
                return [...prev, tutor];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const response = await fetch('/api/estudiantes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    tutorIds: selectedTutors.map(t => t.id_tutor)
                }),
            });

            if (response.ok) {
                setNotification({ type: 'success', message: '¡Estudiante creado con éxito! Redirigiendo...' });
                setTimeout(() => {
                    router.push('/estudiantes');
                }, 2000);
            } else {
                const error = await response.json();
                setNotification({ type: 'error', message: error.details || 'No se pudo crear el estudiante' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Error de conexión al servidor' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const tabs = [
        {
            id: 'student',
            label: 'Datos del Estudiante',
            content: (
                <div style={{ padding: '20px' }}>
                    <form onSubmit={(e) => { e.preventDefault(); setActiveTab('academic'); }} className="student-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    required
                                    name="name"
                                    className="input"
                                    placeholder="Ej: Juan"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellido</label>
                                <input
                                    required
                                    name="lastName"
                                    className="input"
                                    placeholder="Ej: Pérez"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>DNI</label>
                                <input
                                    required
                                    name="dni"
                                    className="input"
                                    placeholder="DNI del estudiante"
                                    value={formData.dni}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    name="fecha_nacimiento"
                                    className="input"
                                    value={formData.fecha_nacimiento}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <Link href="/estudiantes" className="btn">
                                Cancelar
                            </Link>
                            <button type="submit" className="btn btn-primary">
                                Siguiente: Datos Académicos
                            </button>
                        </div>
                    </form>
                </div>
            )
        },
        {
            id: 'academic',
            label: 'Datos Académicos',
            content: (
                <div style={{ padding: '20px' }}>
                    <form onSubmit={(e) => { e.preventDefault(); setActiveTab('tutor'); }} className="student-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Legajo</label>
                                <input
                                    required
                                    name="legajo"
                                    className="input"
                                    placeholder="Nº de legajo"
                                    value={formData.legajo}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Curso</label>
                                <select
                                    name="id_curso"
                                    className="input"
                                    value={formData.id_curso}
                                    onChange={handleChange}
                                >
                                    <option value="">Sin Asignar</option>
                                    {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.anio}{c.division}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <button type="button" className="btn" onClick={() => setActiveTab('student')}>
                                Volver a Datos Personales
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Siguiente: Asignar Tutores
                            </button>
                        </div>
                    </form>
                </div>
            )
        },
        {
            id: 'tutor',
            label: `Asignar Tutores ${selectedTutors.length > 0 ? `(${selectedTutors.length})` : ''}`,
            content: (
                <div className="animate-fade-in" style={{ padding: '20px' }}>
                    <div className="toolbar" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div className="search-box" style={{ maxWidth: '100%' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                className="input"
                                placeholder="Buscar tutor por nombre, apellido o DNI..."
                                value={tutorSearch}
                                onChange={(e) => setTutorSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {selectedTutors.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)', display: 'block' }}>
                                Tutores Seleccionados
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                                {selectedTutors.map(tutor => (
                                    <div key={tutor.id_tutor} className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                                        <span>{tutor.persona.name} {tutor.persona.lastName}</span>
                                        <button onClick={() => toggleTutor(tutor)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="table-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {searchingTutors ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>Buscando tutores...</div>
                        ) : tutors.length > 0 ? (
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Nombre y Apellido</th>
                                        <th>DNI</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tutors.map((tutor) => {
                                        const isSelected = selectedTutors.some(t => t.id_tutor === tutor.id_tutor);
                                        return (
                                            <tr key={tutor.id_tutor}>
                                                <td>{tutor.persona?.name} {tutor.persona?.lastName}</td>
                                                <td>{tutor.persona?.dni}</td>
                                                <td>
                                                    <button
                                                        className={`btn ${isSelected ? 'btn-primary' : ''}`}
                                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.8rem' }}
                                                        onClick={() => toggleTutor(tutor)}
                                                    >
                                                        {isSelected ? 'Seleccionado' : 'Seleccionar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                {tutorSearch.length > 2 ? 'No se encontraron tutores' : 'Ingresa al menos 3 caracteres para buscar'}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer" style={{ marginTop: 'var(--spacing-xl)' }}>
                        <button className="btn" onClick={() => setActiveTab('academic')}>
                            Volver a Académicos
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={loading || !formData.name || !formData.lastName || !formData.dni || !formData.legajo}
                            onClick={handleSubmit}
                        >
                            {loading ? 'Guardando...' : 'Finalizar Registro'}
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
                        <h1>Registrar Estudiante</h1>
                        <p>Completa los datos del alumno y asigna los tutores responsables</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/estudiantes" className="btn">
                            Volver al Listado
                        </Link>
                    </div>
                </header>

                <div className="animate-slide-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {notification && (
                            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                                <div className={`badge ${notification.type === 'success' ? 'badge-success' : 'badge-warning'}`}
                                    style={{ width: '100%', padding: 'var(--spacing-md)', textAlign: 'center', fontSize: '1rem' }}>
                                    {notification.message}
                                </div>
                            </div>
                        )}

                        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                </div>
            </main>
        </div>
    );
}
