'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../components/ThemeProvider';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, dni: null }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login - Datos recibidos:', data);
        // Mapeo de nombres de rol a IDs según la base de datos
        const roleMap: { [key: string]: string } = {
          'ADMIN': '1',
          'DOCENTE': '7',  // ID correcto para docentes según los datos
          'TUTOR': '6',   // ID correcto para tutores según los datos
          'PRECEPTOR': '4'
        };
        console.log('Login - Roles disponibles:', data);
        const rawRole = data.user.roles[0];
        const mappedRoleId = roleMap[rawRole] || '';

        // Store auth state and roles
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('inicial', username.substring(0, 2));
        localStorage.setItem('username', username);
        localStorage.setItem('roles', JSON.stringify(data.user.roles));
        localStorage.setItem('activeRole', mappedRoleId); // Set correct role ID
        localStorage.setItem('userId', data.user.id);
        router.push('/home');
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Intenta de nuevo.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Theme Toggle */}
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Animated Background */}
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Login Card */}
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-container">
            <Image
              src={theme === 'light' ? '/logo-azul-iar.png' : '/ea-bg.svg'}
              alt="Logo EscuelaApp"
              width={72}
              height={72}
              className="logo-image"
              priority
            />
            <h1 className="logo-text">EscuelaApp</h1>
          </div>
          <p className="login-subtitle">Sistema de Gestión Escolar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Usuario
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                id="username"
                type="text"
                className="input input-with-icon"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                id="password"
                type="password"
                className="input input-with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox" />
              <span>Recordarme</span>
            </label>
            <a href="#" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
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
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar Sesión
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <a href="#" className="signup-link">Regístrate aquí</a></p>
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
