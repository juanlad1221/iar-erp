'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';
import './Sidebar.css';

interface SidebarProps {
    activePage?: string;
}

export default function Sidebar({ activePage }: SidebarProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const [expandedItem, setExpandedItem] = useState<string | null>(activePage === 'estudiantes' ? 'estudiantes' : 'dashboard');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const updateRole = () => {
            const role = localStorage.getItem('activeRole');
            if (role) {
                setUserRole(role);
            }
        };

        updateRole();

        window.addEventListener('roleChanged', updateRole);
        return () => window.removeEventListener('roleChanged', updateRole);
    }, []);

    // Función para normalizar roles (quita /a, tildes y pasa a minúsculas)
    const normalizeRole = (role: string | null): string => {
        if (!role) return '';
        return role.toLowerCase().replace('/a', '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    // Definir qué items puede ver cada rol (usar claves normalizadas)
    const rolePermissions: Record<string, string[]> = {
        'administrador': ['dashboard', 'estudiantes', 'docentes', 'tutores', 'cursos', 'materias', 'evaluacion', 'notificaciones', 'reportes'],
        'secretario': ['dashboard', 'estudiantes', 'docentes', 'tutores', 'cursos', 'materias', 'evaluacion', 'notificaciones'],
        'director': ['dashboard', 'estudiantes', 'docentes', 'tutores', 'cursos', 'materias', 'evaluacion', 'notificaciones', 'reportes'],
        'preceptor': ['estudiantes'],
    };

    // Definir qué sub-opciones están restringidas para ciertos roles (usar claves normalizadas)
    // El formato es: { rol: { itemId: ['opciones', 'restringidas'] } }
    const restrictedSubOptions: Record<string, Record<string, string[]>> = {
        'secretario': {
            'estudiantes': []
        },
        'director': {
            'estudiantes': []
        },
        'preceptor': {
            'estudiantes': ['Listado']
        }
    };

    // Rol normalizado para comparaciones
    const normalizedRole = normalizeRole(userRole);

    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            href: '/home',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'General', href: '/home' },
                { label: 'Estadísticas', href: '/home' }
            ]
        },
        {
            id: 'estudiantes',
            label: 'Estudiantes',
            href: '/estudiantes',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Listado', href: '/estudiantes' },
                { label: 'Asistencia', href: '/estudiantes/asistencia' }
            ]
        },
        {
            id: 'docentes',
            label: 'Docentes',
            href: '/docentes',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="16 11 18 13 22 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Listado', href: '/docentes' }
            ]
        },
        {
            id: 'tutores',
            label: 'Tutores',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Listado', href: '/tutores' },
                { label: 'Alumnos a cargo', href: '/tutores/alumnos-a-cargo' }
            ]
        },
        {
            id: 'cursos',
            label: 'Cursos',
            href: '/cursos',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Listado', href: '/cursos' },
            ]
        },
        {
            id: 'materias',
            label: 'Materias',
            href: '/materias',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6.253v13.007m0-13.007a8.124 8.124 0 0 0-5.94-2.253c-1.502 0-2.917.406-4.125 1.112a.5.5 0 0 0-.172.688l2.397 4.15a8.126 8.126 0 0 1 7.84 0l2.397-4.15a.5.5 0 0 0-.172-.688A8.124 8.124 0 0 0 12 3.999m0 2.254a8.124 8.124 0 0 1 5.94-2.253c1.502 0 2.917.406 4.125 1.112a.5.5 0 0 1 .172.688l-2.397 4.15a8.126 8.126 0 0 0-7.84 0l-2.397-4.15a.5.5 0 0 1 .172-.688A8.124 8.124 0 0 1 12 3.999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Listado', href: '/materias' },
                { label: 'Asignaciones', href: '/materias/asignaciones' },
            ]
        },
        {
            id: 'evaluacion',
            label: 'Evaluación',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Instancias Evaluativas', href: '/evaluacion/instancias' },
                { label: 'Ver Carga', href: '/evaluacion/ver-carga' },
                { label: 'Exámenes', href: '#' },
                { label: 'Boletines', href: '#' }
            ]
        },
        {
            id: 'notificaciones',
            label: 'Notificaciones',
            href: '/notificaciones',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Bandeja de Entrada', href: '/notificaciones' },
                { label: 'Crear Notificación', href: '/notificaciones/nueva' }
            ]
        },
        {
            id: 'reportes',
            label: 'Reportes',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            options: [
                { label: 'Académicos', href: '#' },
                { label: 'Administrativos', href: '#' },
                { label: 'Asistencia', href: '#' },
                { label: 'Financieros', href: '#' }
            ]
        },
    ];

    const toggleItem = (id: string) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('inicial');
        localStorage.removeItem('username');
        localStorage.removeItem('roles');
        localStorage.removeItem('activeRole');
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
            
            {/* Mobile Toggle Button */}
            <button 
                className="mobile-sidebar-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            
            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <button 
                        className="mobile-close-btn"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className="logo-icon">
                        <Image 
                            src={theme === 'light' ? '/logo-azul-iar.png' : '/ea-bg.svg'} 
                            alt="Logo EscuelaApp" 
                            width={40} 
                            height={40}
                            priority
                        />
                    </div>
                    <div className="title-container">
                        <h2>EscuelaApp</h2>
                        {userRole && <span className="user-role">{userRole}</span>}
                    </div>
                </div>

            <nav className="sidebar-nav">
                {navItems
                    .filter((item) => {
                        // Si no hay rol, mostrar todos los items
                        if (!normalizedRole) return true;
                        // Obtener los items permitidos para este rol
                        const allowedItems = rolePermissions[normalizedRole];
                        // Si el rol no está definido en los permisos, mostrar todos
                        if (!allowedItems) return true;
                        // Verificar si el item está permitido
                        return allowedItems.includes(item.id);
                    })
                    .map((item) => (
                    <div key={item.id} className="nav-group">
                        <button
                            onClick={() => toggleItem(item.id)}
                            className={`nav-item ${activePage === item.id || (item.id === 'dashboard' && activePage === 'home') ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            <svg
                                className={`chevron-icon ${expandedItem === item.id ? 'expanded' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <div className={`nav-options ${expandedItem === item.id ? 'show' : ''}`}>
                            {item.options
                                .filter((option) => {
                                    // Si no hay rol, mostrar todas las opciones
                                    if (!normalizedRole) return true;
                                    // Verificar si esta opción está restringida para este rol
                                    const roleRestrictions = restrictedSubOptions[normalizedRole];
                                    if (!roleRestrictions) return true;
                                    const itemRestrictions = roleRestrictions[item.id];
                                    if (!itemRestrictions) return true;
                                    // Si la opción está en la lista de restringidas, ocultarla
                                    return !itemRestrictions.includes(option.label);
                                })
                                .map((option, idx) => (
                                <Link key={idx} href={option.href} className="nav-option">
                                    {option.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
            </aside>
        </>
    );
}
