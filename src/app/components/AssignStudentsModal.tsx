'use client';

import { useState, useEffect } from 'react';
import './Modal.css'; // Shared styles

interface AssignStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tutor: {
        id_tutor: number;
        persona: {
            name: string;
            lastName: string;
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
    } | null;
}

interface Student {
    id_alumno: number;
    legajo: string;
    persona: {
        name: string;
        lastName: string;
        dni: string;
    };
}

export default function AssignStudentsModal({ isOpen, onClose, onSuccess, tutor }: AssignStudentsModalProps) {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);

    useEffect(() => {
        if (tutor && isOpen) {
            // Pre-fill with currently assigned students
            const existing = tutor.alumnos.map(rel => rel.alumno);
            setAssignedStudents(existing);
            setSearch('');
            setSearchResults([]);
        }
    }, [tutor, isOpen]);

    // Search logic
    useEffect(() => {
        if (search.length > 2) {
            const timer = setTimeout(async () => {
                try {
                    // Reusing the existing students API which allows text search
                    // Important: The API might return formatted data, need to ensure types match
                    const res = await fetch(`/api/estudiantes?search=${search}`);
                    if (res.ok) {
                        const result = await res.json();
                        // The API returns { data: Student[], meta: ... }
                        setSearchResults(Array.isArray(result.data) ? result.data : []);
                    }
                } catch (e) {
                    console.error(e);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [search]);

    const handleAssign = (student: Student) => {
        if (!assignedStudents.some(s => s.id_alumno === student.id_alumno)) {
            setAssignedStudents([...assignedStudents, student]);
        }
        // Clear search to allow finding next one easily or keep it? 
        // Clearing it feels smoother for "next search"
        setSearch('');
        setSearchResults([]);
    };

    const handleRemove = (studentId: number) => {
        setAssignedStudents(assignedStudents.filter(s => s.id_alumno !== studentId));
    };

    const handleSave = async () => {
        console.log('handleSave called');
        if (!tutor) {
            console.error('No tutor selected');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                tutorId: tutor.id_tutor,
                studentIds: assignedStudents.map(s => s.id_alumno)
            };
            console.log('Sending payload to /api/tutores/assign:', payload);

            const res = await fetch('/api/tutores/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);

            if (res.ok) {
                console.log('Assignment successful');
                onSuccess();
                onClose();
            } else {
                console.error('Assignment failed:', data);
                alert('Error al guardar asignaciones: ' + (data.error || 'Desconocido'));
            }
        } catch (e) {
            console.error('Fetch error:', e);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !tutor) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2>Asignar Alumnos</h2>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Tutor: <strong>{tutor.persona.name} {tutor.persona.lastName}</strong>
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="student-form">

                    {/* Assigned List */}
                    <div className="form-group">
                        <label>Alumnos Asignados ({assignedStudents.length})</label>
                        <div className="selected-tags" style={{ minHeight: '40px', padding: '10px', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                            {assignedStudents.length === 0 && (
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No hay alumnos asignados todavía.</span>
                            )}
                            {assignedStudents.map(s => (
                                <div key={s.id_alumno} className="tag" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', padding: '6px 12px' }}>
                                    <span>{s.persona.name} {s.persona.lastName} <small style={{ opacity: 0.7 }}>({s.legajo})</small></span>
                                    <button onClick={() => handleRemove(s.id_alumno)}>&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr style={{ border: '0', borderTop: '1px solid var(--border)' }} />

                    {/* Search Section */}
                    <div className="form-group">
                        <label>Buscar Alumno para agregar</label>
                        <div className="search-box">
                            <input
                                type="text"
                                className="input"
                                placeholder="Escribe nombre, apellido o legajo..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Results Dropdown */}
                        {search.length > 2 && (
                            <div style={{
                                marginTop: '8px',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {searchResults.length === 0 ? (
                                    <div style={{ padding: '10px', color: 'var(--text-tertiary)' }}>No se encontraron alumnos</div>
                                ) : (
                                    <ul className="suggestions-list" style={{ position: 'static', boxShadow: 'none', marginTop: 0 }}>
                                        {searchResults.map(s => {
                                            const isSelected = assignedStudents.some(as => as.id_alumno === s.id_alumno);
                                            return (
                                                <li
                                                    key={s.id_alumno}
                                                    onClick={() => !isSelected && handleAssign(s)}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        opacity: isSelected ? 0.5 : 1,
                                                        cursor: isSelected ? 'default' : 'pointer'
                                                    }}
                                                >
                                                    <span>{s.persona.name} {s.persona.lastName}</span>
                                                    <span style={{ color: 'var(--text-tertiary)' }}>{s.legajo}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Asignaciones'}
                    </button>
                </div>
            </div>
        </div>
    );
}
