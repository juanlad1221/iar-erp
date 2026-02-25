'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import './home.css';

export default function HomePage() {
    const router = useRouter();
    const [inicial, setInicial] = useState('');
    const [username, setUsername] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [roles, setRoles] = useState<string[]>([]);
    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        // Check authentication
        const isAuth = localStorage.getItem('isAuthenticated');
        const inicial = localStorage.getItem('inicial');
        const username = localStorage.getItem('username');
        const storedRoles = localStorage.getItem('roles');
        const storedActiveRole = localStorage.getItem('activeRole');

        if (!isAuth) {
            router.push('/login');
            return;
        }

        setInicial(inicial || 'NN');
        setUsername(username || 'Usuario');

        if (storedRoles) {
            try {
                const parsedRoles = JSON.parse(storedRoles);
                setRoles(parsedRoles);
                setActiveRole(storedActiveRole || parsedRoles[0] || '');
            } catch (e) {
                console.error("Error parsing roles", e);
            }
        }

        // Update time
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [router]);

    const handleRoleChange = (role: string) => {
        setActiveRole(role);
        localStorage.setItem('activeRole', role);
        window.dispatchEvent(new Event('roleChanged'));
    };

    // Role-specific definitions
    const getStatsByRole = () => {
        switch (activeRole?.toLowerCase()) {
            case 'director':
                return [
                    { label: 'Matrícula Total', value: '1,234', change: '+12%', icon: 'users' },
                    { label: 'Presupuesto Mes', value: '$45K', change: '+2%', icon: 'money' },
                    { label: 'Reportes Pendientes', value: '8', change: '-3%', icon: 'report' },
                    { label: 'Asistencia General', value: '94%', change: '+1%', icon: 'check' },
                ];
            case 'secretario':
                return [
                    { label: 'Trámites Atendidos', value: '42', change: '+5%', icon: 'report' },
                    { label: 'Documentos Emitidos', value: '27', change: '+3%', icon: 'book' },
                    { label: 'Inscripciones Hoy', value: '12', change: '+2', icon: 'users' },
                    { label: 'Solicitudes Pendientes', value: '5', change: '-1', icon: 'calendar' },
                ];
            case 'profesor':
                return [
                    { label: 'Mis Estudiantes', value: '145', change: '+2%', icon: 'users' },
                    { label: 'Cursos Asignados', value: '6', change: '0%', icon: 'book' },
                    { label: 'Tareas por Corregir', value: '24', change: '+15%', icon: 'edit' },
                    { label: 'Promedio Curso', value: '8.5', change: '+0.3', icon: 'star' },
                ];
            case 'preceptor':
                return [
                    { label: 'Estudiantes a Cargo', value: '0', change: '0%', icon: 'users' },
                    { label: 'Asistencia Hoy', value: '0%', change: '0%', icon: 'check' },
                    { label: 'Inasistencias del Mes', value: '0', change: '0%', icon: 'calendar' },
                    { label: 'Observaciones Pendientes', value: '0', change: '0%', icon: 'edit' },
                ];
            default:
                return [
                    { label: 'Mis Materias', value: '12', change: '0%', icon: 'book' },
                    { label: 'Mi Asistencia', value: '98%', change: '+1%', icon: 'check' },
                    { label: 'Próximos Exámenes', value: '3', change: 'Activo', icon: 'calendar' },
                    { label: 'Promedio General', value: '9.2', change: '+0.1', icon: 'star' },
                ];
        }
    };

    const getRecentActivities = () => {
        if (activeRole?.toLowerCase() === 'director') {
            return [
                { title: 'Nuevo estudiante registrado', time: 'Hace 5 min', type: 'success' },
                { title: 'Reporte financiero generado', time: 'Hace 2 horas', type: 'info' },
                { title: 'Reunión directiva', time: 'Mañana 10:00 AM', type: 'warning' },
            ];
        }
        return [
            { title: 'Calificaciones cargadas', time: 'Hace 15 min', type: 'success' },
            { title: 'Nuevo mensaje de rectoría', time: 'Hace 1 hora', type: 'warning' },
            { title: 'Tarea entregada - Manuel S.', time: 'Hace 2 horas', type: 'info' },
        ];
    };

    const stats = getStatsByRole();
    const recentActivities = getRecentActivities();

    return (
        <div className="home-container">
            <Sidebar activePage="home" />

            {/* Main Content */}
            <main className="main-content">
                {/* Header */}
                <header className="header">
                    <div className="header-left">
                        <h1 className="page-title">Dashboard {activeRole && `- ${activeRole}`}</h1>
                        <p className="page-subtitle">Bienvenido: {username}</p>
                    </div>
                    <div className="header-right">
                        <div className="time-display">{currentTime}</div>

                        {/* Role Switcher */}
                        {roles.length > 1 && (
                            <div className="role-switcher-container">
                                <select
                                    className="role-select"
                                    value={activeRole}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                >
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            Rol: {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <ThemeToggle />
                        <button className="notification-btn">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="notification-badge">3</span>
                        </button>
                        <div className="user-avatar">
                            {inicial}
                        </div>
                    </div>
                </header>

                {/* Role-specific content */}
                {activeRole?.toLowerCase() === 'preceptor' ? (
                    <div className="preceptor-welcome">
                        <div className="card" style={{ 
                            textAlign: 'center', 
                            padding: '80px 40px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ marginBottom: '30px' }}>
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, margin: '0 auto' }}>
                                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 style={{ 
                                color: 'var(--text-secondary)', 
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                marginBottom: '16px'
                            }}>
                                Portal de Preceptores
                            </h2>
                            <p style={{ 
                                color: 'var(--text-tertiary)', 
                                fontSize: '1.1rem',
                                lineHeight: '1.6',
                                maxWidth: '500px',
                                margin: '0 auto'
                            }}>
                                Bienvenido al portal de preceptores. Esta sección está siendo desarrollada para brindarte herramientas específicas para tu rol.
                            </p>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '20px', 
                                marginTop: '40px',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ 
                                    background: 'var(--bg-secondary)',
                                    padding: '20px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    minWidth: '200px'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Estudiantes</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Gestión de alumnos</div>
                                </div>
                                <div style={{ 
                                    background: 'var(--bg-secondary)',
                                    padding: '20px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    minWidth: '200px'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Asistencia</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Control de presencia</div>
                                </div>
                                <div style={{ 
                                    background: 'var(--bg-secondary)',
                                    padding: '20px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    minWidth: '200px'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Reportes</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Estadísticas y análisis</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="stat-header">
                                        <span className="stat-label">{stat.label}</span>
                                        <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div className="stat-value">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Content Grid */}
                        <div className="content-grid">
                            {/* Recent Activity */}
                            <div className="card activity-card">
                                <h3 className="card-title">Actividad Reciente</h3>
                                <div className="activity-list">
                                    {recentActivities.map((activity, index) => (
                                        <div key={index} className="activity-item">
                                            <div className={`activity-indicator ${activity.type}`}></div>
                                            <div className="activity-content">
                                                <p className="activity-title">{activity.title}</p>
                                                <p className="activity-time">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
