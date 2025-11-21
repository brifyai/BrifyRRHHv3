import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { toast } from 'react-hot-toast';

const HomeUltraModern = () => {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  // Efecto para el parallax y animaciones
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Redirección automática para usuarios autenticados
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        navigate('/panel-principal');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.error) {
        toast.success('¡Bienvenido a StaffHub!');
        navigate('/panel-principal');
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      toast.error('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-b-transparent rounded-full animate-spin mx-auto animation-delay-300"></div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-white">Redirigiendo al dashboard...</p>
            <p className="text-blue-200">Preparando tu experiencia personalizada</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        ></div>
        <div 
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse animation-delay-1000"
          style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse animation-delay-2000"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        ></div>
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-gray-900/90 backdrop-blur-xl py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                StaffHub
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="font-medium hover:text-blue-300 transition-colors relative group">
                Características
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </a>
              <a href="#testimonials" className="font-medium hover:text-blue-300 transition-colors relative group">
                Testimonios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </a>
              <a href="#pricing" className="font-medium hover:text-blue-300 transition-colors relative group">
                Precios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </a>
              <button
                onClick={() => {
                  setActiveTab('login');
                  // Scroll to the login form section
                  setTimeout(() => {
                    const element = document.getElementById('login-form');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="font-medium hover:text-blue-300 transition-colors relative group"
              >
                Iniciar Sesión
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Comenzar
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800/95 backdrop-blur-lg border-t border-gray-700">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                className="block py-2 font-medium hover:text-blue-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Características
              </a>
              <a 
                href="#testimonials" 
                className="block py-2 font-medium hover:text-blue-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonios
              </a>
              <a 
                href="#pricing" 
                className="block py-2 font-medium hover:text-blue-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Precios
              </a>
              <button
                onClick={() => {
                  setActiveTab('login');
                  setIsMenuOpen(false);
                  // Scroll to the login form section
                  setTimeout(() => {
                    const element = document.getElementById('login-form');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="block w-full text-left py-2 font-medium hover:text-blue-300 transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mt-2"
              >
                Comenzar
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div ref={heroRef} className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-56 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <div 
                className="text-center lg:text-left animate-fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="inline-flex items-center bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-gray-700 mb-6">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Nueva versión disponible
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                  <span className="block">Gestiona tu equipo con</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mt-2">
                    inteligencia artificial
                  </span>
                </h1>
                <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0">
                  La plataforma todo-en-uno que transforma la gestión de recursos humanos con herramientas inteligentes y una experiencia intuitiva.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => setActiveTab('register')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:from-blue-500 hover:to-purple-500 transform hover:-translate-y-1 transition-all duration-300 hover:shadow-blue-500/20 group"
                  >
                    <span className="flex items-center">
                      Comenzar gratis
                      <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                  <button className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm text-white font-semibold rounded-xl border border-gray-700 shadow-lg hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300 group">
                    <Link to="/landing-prueba" className="flex items-center justify-center">
                      Ver demo
                      <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                  </button>
                </div>
                <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto lg:mx-0">
                  <div className="text-center group">
                    <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">500+</div>
                    <div className="text-gray-400 font-medium">Empresas</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">50K+</div>
                    <div className="text-gray-400 font-medium">Usuarios</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">99.9%</div>
                    <div className="text-gray-400 font-medium">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <div className="relative">
                {/* Floating card with glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
                  <div className="max-w-md mx-auto">
                    {activeTab === 'login' ? (
                      <form onSubmit={handleLogin} className="space-y-6 animate-fade-in" id="login-form">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-white">Bienvenido de vuelta</h2>
                          <p className="mt-2 text-gray-400">Ingresa a tu cuenta</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                              Email
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                                placeholder="tu@email.com"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Contraseña
                              </label>
                              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                ¿Olvidaste tu contraseña?
                              </Link>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                                placeholder="••••••••"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                            Recordarme
                          </label>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Iniciando...
                            </span>
                          ) : (
                            'Iniciar Sesión'
                          )}
                        </button>
                        
                        <div className="text-center">
                          <p className="text-gray-400">
                            ¿No tienes cuenta?{' '}
                            <button
                              type="button"
                              onClick={() => setActiveTab('register')}
                              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Regístrate gratis
                            </button>
                          </p>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
                          <p className="mt-2 text-gray-400">Comienza tu prueba gratuita</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="full-name" className="block text-sm font-medium text-gray-300 mb-2">
                              Nombre completo
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <input
                                id="full-name"
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                                placeholder="Tu nombre"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-2">
                              Email
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <input
                                id="register-email"
                                type="email"
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                                placeholder="tu@email.com"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-2">
                              Contraseña
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <input
                                id="register-password"
                                type="password"
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <Link to="/register">Crear cuenta gratis</Link>
                        </button>
                        
                        <div className="text-center">
                          <p className="text-gray-400">
                            ¿Ya tienes cuenta?{' '}
                            <button
                              onClick={() => setActiveTab('login')}
                              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Inicia sesión
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Características que marcan la diferencia
            </h2>
            <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
              Tecnología de vanguardia diseñada para revolucionar la gestión de recursos humanos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25"></div>
                ),
                title: 'Seguridad Avanzada',
                description: 'Protección de nivel enterprise con encriptación de punta a punta y autenticación multifactor.'
              },
              {
                icon: (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25"></div>
                ),
                title: 'Velocidad Extrema',
                description: 'Procesos optimizados que ahorran tiempo valioso en cada interacción con carga instantánea.'
              },
              {
                icon: (
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 rounded-xl blur opacity-25"></div>
                ),
                title: 'Inteligencia Artificial',
                description: 'Automatización inteligente que aprende de tus patrones de trabajo para optimizar procesos.'
              },
              {
                icon: (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-25"></div>
                ),
                title: 'Dashboard Intuitivo',
                description: 'Interfaz moderna y personalizable con métricas en tiempo real para una toma de decisiones informada.'
              },
              {
                icon: (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-xl blur opacity-25"></div>
                ),
                title: 'Gestión de Equipos',
                description: 'Herramientas completas para la gestión de empleados, desde contratación hasta desarrollo profesional.'
              },
              {
                icon: (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-green-600 rounded-xl blur opacity-25"></div>
                ),
                title: 'Análisis Avanzado',
                description: 'Insights detallados sobre el desempeño del equipo y la organización con reportes personalizables.'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="relative group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:-translate-y-2">
                  <div className="relative h-12 w-12 rounded-xl bg-gray-700 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-50"></div>
                    <svg className="h-6 w-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
              Empresas que han transformado su gestión de RRHH con StaffHub
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: 'Ana García',
                position: 'Directora de RRHH',
                company: 'InnovateCorp',
                comment: 'StaffHub transformó completamente cómo gestionamos nuestro talento. La simplicidad es su mayor virtud.',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              },
              {
                name: 'Carlos Mendoza',
                position: 'CEO',
                company: 'TechStart',
                comment: 'Finalmente una herramienta que entiende las necesidades reales de las empresas modernas.',
                avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              },
              {
                name: 'Laura Silva',
                position: 'VP de Operaciones',
                company: 'DataFlow',
                comment: 'La experiencia de usuario es excepcional. Nuestros empleados la aman.',
                avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:-translate-y-2 group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center">
                  <img className="h-12 w-12 rounded-full ring-2 ring-blue-500/30" src={testimonial.avatar} alt={testimonial.name} />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-blue-400">{testimonial.position}</p>
                    <p className="text-sm text-gray-400">{testimonial.company}</p>
                  </div>
                </div>
                <p className="mt-6 text-gray-300 italic">"{testimonial.comment}"</p>
                <div className="mt-6 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Planes simples y transparentes
            </h2>
            <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
              Elige el plan perfecto para tu equipo
            </p>
          </div>

          <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            {[
              {
                name: 'Básico',
                price: '$0',
                description: 'Perfecto para equipos pequeños',
                features: [
                  'Hasta 5 usuarios',
                  'Gestión de empleados básica',
                  'Soporte por email',
                  'Informes mensuales'
                ],
                cta: 'Comenzar gratis',
                popular: false
              },
              {
                name: 'Profesional',
                price: '$29',
                description: 'Para equipos en crecimiento',
                features: [
                  'Hasta 50 usuarios',
                  'Todas las características básicas',
                  'Soporte prioritario',
                  'Informes avanzados',
                  'Integraciones',
                  'Automatización básica'
                ],
                cta: 'Comenzar prueba',
                popular: true
              },
              {
                name: 'Empresarial',
                price: '$99',
                description: 'Para organizaciones grandes',
                features: [
                  'Usuarios ilimitados',
                  'Todas las características profesionales',
                  'Soporte 24/7',
                  'Informes personalizados',
                  'Todas las integraciones',
                  'Automatización avanzada',
                  'Funciones personalizadas'
                ],
                cta: 'Contactar ventas',
                popular: false
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 group ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/50 shadow-2xl shadow-blue-500/10' 
                    : 'bg-gray-800/50 backdrop-blur-sm border-gray-700'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Más popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-1 text-xl font-semibold">/mes</span>
                  </div>
                  <p className="mt-2 text-gray-400">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl text-white">
              ¿Listo para transformar tu gestión de RRHH?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Únete a miles de empresas que ya están revolucionando su forma de trabajar
            </p>
            <div className="mt-10">
              <button
                onClick={() => setActiveTab('register')}
                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-2xl hover:shadow-blue-500/30 transform hover:-translate-y-1"
              >
                Comenzar prueba gratuita
                <svg className="ml-3 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-xl border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="ml-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  StaffHub
                </span>
              </div>
              <p className="mt-4 text-gray-400">
                La plataforma definitiva para la gestión moderna de recursos humanos.
              </p>
              <div className="flex space-x-4 mt-6">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Producto</h3>
              <ul className="mt-4 space-y-4">
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Características</button></li>
                <li><a href="#pricing" className="text-base text-gray-400 hover:text-white transition-colors">Precios</a></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">API</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Integraciones</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Empresa</h3>
              <ul className="mt-4 space-y-4">
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Sobre nosotros</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Blog</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Carreras</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Contacto</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Privacidad</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Términos</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Seguridad</button></li>
                <li><button className="text-base text-gray-400 hover:text-white transition-colors">Compliance</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8">
            <p className="text-base text-gray-500 text-center">
              &copy; 2025 StaffHub. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  );
};

export default HomeUltraModern;