'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import AssignStudentsModal from '../../components/AssignStudentsModal';

// ... (keep imports)

interface TutorAssignment {
    id_tutor: number;
    persona: {
        name: string;
        lastName: string;
        dni: string;
        movil: string;
    };
    alumnos: {
        alumno: {
            id_alumno: number;
            legajo: string;
            persona: {
                name: string;
                lastName: string;
                dni: string;
            }
        }
    }[];
}

// ... (keep component)

export default function AlumnosACargoPage() {
    const [assignments, setAssignments] = useState<TutorAssignment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState<TutorAssignment | null>(null);

    const fetchAssignments = async () => {
        setLoading(true); // Optional: only if we want to show loading spinner again
        try {
            const res = await fetch('/api/tutores');
            if (res.ok) {
                const result = await res.json();
                // The API now returns { data: TutorData[], meta: ... }
                setAssignments(Array.isArray(result.data) ? result.data : []);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const openAssignModal = (tutor: TutorAssignment) => {
        // @ts-ignore
        setSelectedTutor(tutor);
        setIsAssignModalOpen(true);
    };

    const handleSuccess = () => {
        fetchAssignments();
    };

    const filteredAssignments = assignments.filter(tutor => {
        const searchLower = searchTerm.toLowerCase();

        // Match Tutor Name, Last Name or DNI
        const tutorMatch =
            tutor.persona?.name?.toLowerCase().includes(searchLower) ||
            tutor.persona?.lastName?.toLowerCase().includes(searchLower) ||
            tutor.persona?.dni?.includes(searchTerm);

        // Match any assigned Student Name
        const studentMatch = tutor.alumnos?.some(({ alumno }) =>
            alumno.persona.name.toLowerCase().includes(searchLower) ||
            alumno.persona.lastName.toLowerCase().includes(searchLower)
        );

        return tutorMatch || studentMatch;
    });

    return (
        <div className="students-container">
            <Sidebar activePage="tutores" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Alumnos a Cargo</h1>
                        <p>Relación de tutores y estudiantes asignados</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="toolbar animate-slide-in">
                    <div className="search-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="input"
                            placeholder="Buscar tutor, DNI o alumno asignado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-card animate-slide-in">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando asignaciones...</div>
                    ) : (
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Tutor</th>
                                    <th>DNI Tutor</th>
                                    <th>Contacto</th>
                                    <th>Alumnos Asignados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.length > 0 ? (
                                    filteredAssignments.map((tutor) => (
                                        <tr key={tutor.id_tutor}>
                                            <td>
                                                <div className="user-info">
                                                    <div className="avatar" style={{ background: 'var(--accent-100)', color: 'var(--accent-600)' }}>
                                                        {tutor.persona?.name?.[0]}{tutor.persona?.lastName?.[0]}
                                                    </div>
                                                    <div className="name-cell">
                                                        <span className="name">{tutor.persona?.name} {tutor.persona?.lastName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{tutor.persona?.dni}</td>
                                            <td>{tutor.persona?.movil || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                                                    <div className="tags-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, padding: '8px 0' }}>
                                                        {tutor.alumnos && tutor.alumnos.length > 0 ? (
                                                            tutor.alumnos.map(({ alumno }) => (
                                                                <span key={alumno.id_alumno} style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                                                                    • {alumno.persona.name} {alumno.persona.lastName}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.875rem' }}>Sin asignaciones</span>
                                                        )}
                                                    </div>

                                                    <button
                                                        className="action-icon"
                                                        title="Gestionar Asignaciones"
                                                        onClick={() => openAssignModal(tutor)}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                            No hay registros disponibles.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* @ts-ignore */}
                <AssignStudentsModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    tutor={selectedTutor}
                    onSuccess={handleSuccess}
                />
            </main>
        </div>
    );
}
