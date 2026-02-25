'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';


interface StudentData {
    id_alumno: number;
    estudiante: string;
    dni: string;
    curso: string;
    estado: string;
    tutores: string[];
    tutorDetails: Array<{
        nombre: string;
        telefono: string;
    }>;
    inasistencia: number;
    justificadas: number;
    inasistencias_justificadas: number;
}

export default function EstudiantesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Estado');
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
    const [showTutorModal, setShowTutorModal] = useState(false);
    interface Course {
        id_curso: number;
        anio: number;
        division: string;
    }
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseFilter, setCourseFilter] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    // Función para normalizar roles
    const normalizeRole = (role: string | null): string => {
        if (!role) return '';
        return role.toLowerCase().replace('/a', '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    // Verificar si el rol puede editar/eliminar estudiantes
    const canEditStudents = () => {
        const normalized = normalizeRole(userRole);
        // Director solo puede ver, no editar ni dar de baja
        return normalized !== 'director';
    };

    useEffect(() => {
        const role = localStorage.getItem('activeRole');
        setUserRole(role);
    }, []);

    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const res = await fetch('/api/cursos?pageSize=100');
                const data = await res.json();
                setCourses(data.data || []);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetchCursos();
    }, []);

    const fetchStudents = useCallback(async (page = 1, search = '', status = 'Estado', course = '') => {
        setLoading(true);
        try {
            const statusParam = status !== 'Estado' ? `&estado=${status}` : '';
            const courseParam = course ? `&curso=${course}` : '';
            const response = await fetch(`/api/estudiantes?page=${page}&pageSize=${pagination.pageSize}&search=${search}${statusParam}${courseParam}`);
            if (response.ok) {
                const result = await response.json();
                const data: StudentData[] = Array.isArray(result.data) ? result.data : [];
                setStudents(data);
                setPagination(prev => ({
                    ...prev,
                    total: result.meta.total,
                    totalPages: result.meta.totalPages,
                    page: result.meta.page
                }));
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.pageSize, courseFilter]);


    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents(1, searchTerm, statusFilter, courseFilter);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, courseFilter, fetchStudents]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchStudents(newPage, searchTerm, statusFilter, courseFilter);
        }
    };

    const handleTutorClick = (student: StudentData) => {
        setSelectedStudent(student);
        setShowTutorModal(true);
    };

    const closeModal = () => {
        setShowTutorModal(false);
        setSelectedStudent(null);
    };

    return (
        <div className="students-container">
            <Sidebar activePage="estudiantes" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Gestión de Estudiantes</h1>
                        <p>Administra la información y el rendimiento de tus alumnos</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link href="/estudiantes/nuevo" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nuevo Estudiante
                        </Link>
                    </div>
                </header>

                <div className="toolbar animate-slide-in">
                    <div className="search-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="input"
                            placeholder="Buscar por nombre, legajo o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            className="filter-select"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                        >
                            <option value="">Todos los cursos</option>
                            {courses.map((c: any) => (
                                <option key={c.id_curso} value={`${c.anio}° ${c.division}`}>
                                    {c.anio}° {c.division}
                                </option>
                            ))}
                        </select>
                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Estado">Estado</option>
                            <option value="Regular">Regular</option>
                            <option value="Libre">Libre</option>
                        </select>
                    </div>
                </div>

                <div className="table-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando estudiantes...</div>
                    ) : (
                        <>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Estudiante</th>
                                        <th>DNI</th>
                                        <th>Curso</th>
                                        <th>Tutores</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length > 0 ? (
                                        students.map((student) => (
                                            <tr key={student.id_alumno}>
                                                <td>
                                                    <span className="name">{student.estudiante}</span>
                                                </td>
                                                <td>{student.dni}</td>
                                                <td>
                                                    <span className="badge badge-neutral">
                                                        {student.curso}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {student.tutores && student.tutores.length > 0 ? (
                                                        <button
                                                            className="action-icon"
                                                            onClick={() => handleTutorClick(student)}
                                                            title={`Ver ${student.tutores.length} tutor(es)`}
                                                            style={{
                                                                background: 'var(--primary)',
                                                                color: 'white',
                                                                borderRadius: '50%',
                                                                padding: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                margin: '0 auto'
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                                                <circle cx="9" cy="7" r="4"></circle>
                                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                            Sin tutores
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${student.estado === 'Regular' ? 'badge-success' :
                                                        student.estado === 'Baja Fallecido' ? 'badge-error' :
                                                            student.estado === 'Baja pase' ? 'badge-neutral' :
                                                                student.estado === 'Libre' ? 'badge-warning' : 'badge-info'
                                                        }`}>
                                                        {student.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-icons">
                                                        <Link href={`/estudiantes/inasistencias/${student.id_alumno}`} className="action-icon" title="Ver detalle">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                        </Link>
                                                        {canEditStudents() && (
                                                            <>
                                                                <Link href={`/estudiantes/editar/${student.id_alumno}`} className="action-icon" title="Editar">
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                    </svg>
                                                                </Link>
                                                                <Link href={`/estudiantes/baja/${student.id_alumno}`} className="action-icon" title="Eliminar">
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"></path>
                                                                        <circle cx="8.5" cy="7" r="4"></circle>
                                                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                                                    </svg>
                                                                </Link>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                No se encontraron estudiantes
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className="pagination-controls" style={{
                                padding: 'var(--spacing-lg)',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Mostrando {students.length} de {pagination.total} estudiantes
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn"
                                        style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                    >
                                        Anterior
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)', fontWeight: '600' }}>
                                        Página {pagination.page} de {pagination.totalPages || 1}
                                    </div>
                                    <button
                                        className="btn"
                                        style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Modal de Tutores */}
            {showTutorModal && selectedStudent && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={closeModal}
                >
                    <div
                        className="modal-content"
                        style={{
                            backgroundColor: 'var(--background)',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                Tutores de {selectedStudent.estudiante}
                            </h2>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {selectedStudent.tutores && selectedStudent.tutores.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {selectedStudent.tutores.map((tutor, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '16px',
                                            backgroundColor: 'var(--surface)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                fontWeight: 'bold'
                                            }}>
                                                {tutor.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>
                                                    {tutor}
                                                </h3>
                                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                    Teléfono: {selectedStudent.tutorDetails[index]?.telefono || 'No registrado'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <p>Este estudiante no tiene tutores asignados</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
