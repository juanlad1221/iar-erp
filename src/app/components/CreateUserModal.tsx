'use client';

import { useState, useEffect } from 'react';
import './Modal.css';

interface Role {
    id: string;
    rol: string;
}

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        userName: '',
        password: '',
        confirmPassword: '',
        active: true,
        roles: [] as string[]
    });

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
            setFormData({
                userName: '',
                password: '',
                confirmPassword: '',
                active: true,
                roles: []
            });
            setError('');
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!formData.userName || !formData.password) {
            setError('Usuario y contraseña son requeridos');
            return;
        }

        if (formData.roles.length === 0) {
            setError('Debe seleccionar al menos un rol');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: formData.userName,
                    password: formData.password,
                    active: formData.active,
                    roles: formData.roles
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || 'Error al crear usuario');
            }
        } catch (err) {
            setError('Error al crear usuario');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Crear Usuario</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form className="student-form" onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ 
                            padding: 'var(--spacing-md)', 
                            background: 'var(--error-50)', 
                            color: 'var(--error-600)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Usuario *</label>
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
                        {loading ? (
                            <div style={{ padding: 'var(--spacing-md)', color: 'var(--text-tertiary)' }}>Cargando roles...</div>
                        ) : (
                            <select
                                className="input"
                                multiple
                                value={formData.roles}
                                onChange={e => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData(prev => ({ ...prev, roles: selected }));
                                }}
                                style={{ 
                                    height: '120px',
                                    padding: 'var(--spacing-sm)'
                                }}
                            >
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.rol}
                                    </option>
                                ))}
                            </select>
                        )}
                        {formData.roles.length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--spacing-xs)' }}>
                                Seleccione al menos un rol (use Ctrl/Cmd para seleccionar múltiples)
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
