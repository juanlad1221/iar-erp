'use client';

import { useState } from 'react';
import './Modal.css'; // Shared styles

interface AddTutorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTutorModal({ isOpen, onClose, onSuccess }: AddTutorModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        adress: '',
        movil: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/tutores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.details || 'No se pudo crear el tutor'));
            }
        } catch (error) {
            alert('Error de conexión al servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Nuevo Tutor</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form className="student-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre</label>
                            <input
                                required
                                name="name"
                                className="input"
                                placeholder="Ej: Maria"
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
                                placeholder="Ej: Gonzalez"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>DNI</label>
                        <input
                            required
                            name="dni"
                            className="input"
                            placeholder="DNI del tutor"
                            value={formData.dni}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Dirección</label>
                        <input
                            name="adress"
                            className="input"
                            placeholder="Calle, Número, Ciudad"
                            value={formData.adress}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Teléfono / Móvil</label>
                        <input
                            required
                            name="movil"
                            className="input"
                            placeholder="Ej: +54 9..."
                            value={formData.movil}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Crear Tutor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
