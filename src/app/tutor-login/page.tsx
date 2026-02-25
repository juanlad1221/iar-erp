'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../components/ThemeProvider';
import './tutor-login.css';

export default function TutorLoginPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const [dni, setDni] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!dni.trim()) {
            setError('Por favor ingrese su número de DNI');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dni: dni.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                // Extraer el ID del rol "TUTOR"
                const tutorRoleId = data.tutor.roles.find((r: { id: string, rol: string }) => r.rol === "TUTOR")?.id || null;
                console.log('/////////////////', tutorRoleId)
                // Guardar datos del tutor en localStorage
                localStorage.setItem('tutorAuthenticated', 'true');
                localStorage.setItem('tutorData', JSON.stringify(data.tutor));
                localStorage.setItem('tutorDni', data.tutor.dni);
                localStorage.setItem('tutorIdRol', tutorRoleId)
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                }
                if (tutorRoleId) {
                    localStorage.setItem('tutorRoleId', tutorRoleId);
                }

                // Redirigir al portal de tutores (replace para que no pueda volver con las flechas del navegador)
                router.replace('/tutor-portal');
            } else {
                setError(data.error || 'DNI no encontrado en el sistema');
            }
        } catch (err) {
            setError('Error al conectar con el servidor. Intenta de nuevo.');
            console.error('Tutor login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir números
        const value = e.target.value.replace(/\D/g, '');
        setDni(value);
    };

    return (
        <div className="tutor-login-container">
            {/* Theme Toggle */}
            <div className="tutor-theme-toggle">
                <ThemeToggle />
            </div>

            {/* Animated Background */}
            <div className="tutor-login-background">
                <div className="tutor-gradient-orb tutor-orb-1"></div>
                <div className="tutor-gradient-orb tutor-orb-2"></div>
                <div className="tutor-gradient-orb tutor-orb-3"></div>
            </div>

            {/* Decorative Shapes */}
            <div className="tutor-decorative-shapes">
                <div className="tutor-shape tutor-shape-1"></div>
                <div className="tutor-shape tutor-shape-2"></div>
                <div className="tutor-shape tutor-shape-3"></div>
                <div className="tutor-shape tutor-shape-4"></div>
            </div>

            {/* Login Card */}
            <div className="tutor-login-card animate-fade-in">
                <div className="tutor-login-header">
                    <div className="tutor-logo-container">
                        <Image
                            src={theme === 'light' ? '/logo-azul-iar.png' : '/ea-bg.svg'}
                            alt="Logo EscuelaApp"
                            width={80}
                            height={80}
                            className="tutor-logo-image"
                            priority
                        />
                        <h1 className="tutor-logo-text">Portal de Tutores</h1>
                    </div>
                    <p className="tutor-login-subtitle">Accede a la información de tus hijos</p>
                    <p className="tutor-login-description">
                        Consulta asistencias, calificaciones y comunicados escolares
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="tutor-login-form">
                    <div className="tutor-form-group">
                        <label htmlFor="dni" className="tutor-form-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <line x1="7" y1="8" x2="17" y2="8" />
                                <line x1="7" y1="12" x2="12" y2="12" />
                            </svg>
                            Número de DNI
                        </label>
                        <div className="tutor-input-wrapper">
                            <svg className="tutor-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M15 8H17M15 12H17M7 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <input
                                id="dni"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="tutor-input"
                                placeholder="Ej: 12345678"
                                value={dni}
                                onChange={handleDniChange}
                                maxLength={8}
                                autoComplete="off"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="tutor-error-message animate-fade-in">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="tutor-btn-login"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="tutor-spinner"></span>
                                Verificando...
                            </>
                        ) : (
                            <>
                                Ingresar al Portal
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className="tutor-info-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <p>
                        Ingrese el DNI registrado como tutor en la institución. Si tiene problemas para acceder, contacte a secretaría.
                    </p>
                </div>
            </div>
        </div>
    );
}
