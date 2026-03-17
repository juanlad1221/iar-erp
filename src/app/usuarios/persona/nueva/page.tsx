'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';

interface Role {
    id: string;
    rol: string;
}

export default function NuevaPersonaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        movil: '',
        adress: '',
        fecha_nacimiento: '',
        userName: '',
        password: '',
        confirmPassword: '',
        active: true,
        roles: [] as string[],
        id_curso: ''
    });

    const isPreceptor = formData.roles.some(roleId => {
        const role = roles.find(r => r.id === roleId);
        return role && role.rol.toLowerCase().includes('preceptor');
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setRolesLoading(true);
        try {
            const response = await fetch('/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
        } finally {
            setRolesLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        const isPreceptorSelected = formData.roles.some(roleId => {
            const role = roles.find(r => r.id === roleId);
            return role && role.rol.toLowerCase().includes('preceptor');
        });

        console.log('Form submitted with roles:', formData.roles);
        console.log('isPreceptor:', isPreceptorSelected);
        console.log('id_curso:', formData.id_curso);

        if (formData.password !== formData.confirmPassword) {
            setNotification({ type: 'error', message: 'Las contraseñas no coinciden' });
            setLoading(false);
            return;
        }

        if (formData.roles.length === 0) {
            setNotification({ type: 'error', message: 'Debe seleccionar al menos un rol' });
            setLoading(false);
            return;
        }

        if (isPreceptorSelected && !formData.id_curso) {
            setNotification({ type: 'error', message: 'Debe seleccionar un curso para el preceptor' });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                lastName: formData.lastName,
                dni: formData.dni || null,
                movil: formData.movil || null,
                adress: formData.adress || null,
                fecha_nacimiento: formData.fecha_nacimiento || null,
                userName: formData.userName,
                password: formData.password,
                active: formData.active,
                roles: formData.roles,
                id_curso: (isPreceptorSelected && formData.id_curso) ? parseInt(formData.id_curso) : null
            };
            console.log('Payload:', JSON.stringify(payload));
            
            const response = await fetch('/api/personas/usuario-rol', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    lastName: formData.lastName,
                    dni: formData.dni || null,
                    movil: formData.movil || null,
                    adress: formData.adress || null,
                    fecha_nacimiento: formData.fecha_nacimiento || null,
                    userName: formData.userName,
                    password: formData.password,
                    active: formData.active,
                    roles: formData.roles,
                    id_curso: (isPreceptor && formData.id_curso) ? parseInt(formData.id_curso) : null
                })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: 'Persona creada exitosamente' });
                setTimeout(() => {
                    router.push('/usuarios');
                }, 1500);
            } else {
                const data = await response.json();
                console.log('Error response:', data);
                setNotification({ type: 'error', message: data.error || 'Error al crear la persona' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: 'Error al crear la persona' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="students-container">
            <Sidebar activePage="usuarios" />

            <main className="students-main">
                <header className="page-header animate-fade-in">
                    <div className="header-info">
                        <h1>Nueva Persona</h1>
                        <p>Crea una nueva persona y asígnale un usuario con rol</p>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="table-card" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-xl)' }}>
                    <form className="student-form" onSubmit={handleSubmit}>
                        {notification && (
                            <div style={{ 
                                padding: 'var(--spacing-md)', 
                                background: notification.type === 'success' ? 'var(--success-50)' : 'var(--error-50)', 
                                color: notification.type === 'success' ? 'var(--success-600)' : 'var(--error-600)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                {notification.message}
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-lg)',
                            paddingBottom: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21V19C20 17.9391 19.5786 16.9217 19.1571 16.1716C18.7357 15.4214 18.0609 15 17 15H7C5.93913 15 5.26434 15.4214 4.84289 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Datos de la Persona</h3>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ingrese el nombre"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellido *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.lastName}
                                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="Ingrese el apellido"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>DNI *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.dni}
                                    onChange={e => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                                    placeholder="Ingrese el DNI"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono Móvil</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.movil}
                                    onChange={e => setFormData(prev => ({ ...prev, movil: e.target.value }))}
                                    placeholder="Ingrese el teléfono"
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.adress}
                                    onChange={e => setFormData(prev => ({ ...prev, adress: e.target.value }))}
                                    placeholder="Ingrese la dirección"
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.fecha_nacimiento}
                                    onChange={e => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--spacing-sm)',
                            marginTop: 'var(--spacing-lg)',
                            marginBottom: 'var(--spacing-lg)',
                            paddingTop: 'var(--spacing-md)',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Datos del Usuario</h3>
                        </div>

                        <div className="form-group">
                            <label>Nombre de Usuario *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.userName}
                                onChange={e => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                                placeholder="Ingrese nombre de usuario"
                                required
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Contraseña *</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={formData.password}
                                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Contraseña"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirmar Contraseña *</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder="Confirmar contraseña"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-xs)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="active"
                                        checked={formData.active}
                                        onChange={() => setFormData(prev => ({ ...prev, active: true }))}
                                    />
                                    Activo
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="active"
                                        checked={!formData.active}
                                        onChange={() => setFormData(prev => ({ ...prev, active: false }))}
                                    />
                                    Inactivo
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Roles *</label>
                            {rolesLoading ? (
                                <div style={{ padding: 'var(--spacing-md)', color: 'var(--text-tertiary)' }}>Cargando roles...</div>
                            ) : (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: 'var(--spacing-sm)',
                                    marginTop: 'var(--spacing-xs)'
                                }}>
                                    {roles.map(role => (
                                        <label 
                                            key={role.id} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                cursor: 'pointer',
                                                padding: 'var(--spacing-sm)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                background: formData.roles.includes(role.id) ? 'var(--primary-50)' : 'transparent'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.roles.includes(role.id)}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({ ...prev, roles: [...prev.roles, role.id] }));
                                                    } else {
                                                        setFormData(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role.id) }));
                                                    }
                                                }}
                                            />
                                            {role.rol}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {formData.roles.length === 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--error-500)', marginTop: 'var(--spacing-xs)' }}>
                                    Seleccione al menos un rol
                                </div>
                            )}
                        </div>

                        {isPreceptor && (
                            <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                                <label>Curso *</label>
                                <select
                                    className="input"
                                    value={formData.id_curso}
                                    onChange={e => setFormData(prev => ({ ...prev, id_curso: e.target.value }))}
                                    required
                                >
                                    <option value="">Seleccione un curso</option>
                                    {[1, 2, 3, 4, 5].map(anio => (
                                        <option key={anio} value={anio}>{anio}° Año</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            gap: 'var(--spacing-md)', 
                            justifyContent: 'flex-end',
                            marginTop: 'var(--spacing-xl)',
                            paddingTop: 'var(--spacing-lg)',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <button 
                                type="button" 
                                className="btn" 
                                onClick={() => router.push('/usuarios')}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={loading}
                            >
                                {loading ? 'Creando...' : 'Crear Persona'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
