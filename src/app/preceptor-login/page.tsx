'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../components/ThemeProvider';
import './preceptor-login.css';

export default function PreceptorLoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [dni, setDni] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mejorar experiencia móvil: prevenir zoom al enfocar inputs
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'text') {
        target.style.fontSize = '16px'; // Evita zoom en iOS
      }
    };

    const handleBlur = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'text') {
        target.style.fontSize = '';
      }
    };

    const inputs = document.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/preceptor-dni-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dni }),
      });

      const data = await response.json();
      
      if (data.success && data.user.roles.includes('PRECEPTOR')) {
        // Store auth state and roles
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('inicial', 'P');
        localStorage.setItem('username', `${data.user.name} ${data.user.lastName}` || 'Preceptor');
        localStorage.setItem('dni', data.user.dni);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('roles', JSON.stringify(data.user.roles));
        localStorage.setItem('activeRole', 'PRECEPTOR'); // Set preceptor as active role
        router.push('/preceptor-portal');
      } else if (data.success && !data.user.roles.includes('PRECEPTOR')) {
        setError('Acceso denegado. Esta página es solo para preceptores.');
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Intenta de nuevo.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="preceptor-login-container">
      {/* Theme Toggle */}
      <div className="preceptor-login-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Animated Background */}
      <div className="preceptor-login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Login Card */}
      <div className="preceptor-login-card animate-fade-in">
        <div className="preceptor-login-header">
          <div className="logo-container">
            <Image
              src={theme === 'light' ? '/logo-azul-iar.png' : '/ea-bg.svg'}
              alt="Logo EscuelaApp"
              width={72}
              height={72}
              className="logo-image"
              priority
            />
            <h1 className="logo-text">Portal Preceptores</h1>
          </div>
          <p className="preceptor-login-subtitle">Accede a tus herramientas de gestión</p>
          <p className="preceptor-login-description">
            Gestiona cursos, asistencias y comunicados institucionales
          </p>
          <div className="role-indicator">
            <span className="role-badge">Acceso exclusivo para Preceptores</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="preceptor-login-form">

          <div className="form-group">
            <label htmlFor="dni" className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <line x1="7" y1="8" x2="17" y2="8"/>
                <line x1="7" y1="12" x2="12" y2="12"/>
              </svg>
              Número de DNI
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                id="dni"
                type="text"
                className="input input-with-icon"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                maxLength={8}
                pattern="[0-9]{7,8}"
              />
            </div>
          </div>

          

          {error && (
            <div className="error-message animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-login"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Verificando DNI...
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
          
          <div className="preceptor-info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>
              Ingrese el DNI registrado como preceptor en la institución. Ante inconvenientes, contacte a secretaría.
            </p>
          </div>
        </form>

        <div className="preceptor-login-footer">
          <p>¿No es un preceptor? <a href="/login" className="back-link">Volver al login general</a></p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="decorative-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
    </div>
  );
}
