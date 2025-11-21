import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import { toast } from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

const LoginUltraModern = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { signIn } = useAuth()
  const navigate = useNavigate()

  // Efecto para el movimiento del mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    console.log('Intentando login con:', email)

    try {
      const result = await signIn(email, password)
      console.log('Resultado del login:', result)

      if (result && !result.error) {
        console.log('Login exitoso, redirigiendo...')
        toast.success('¡Bienvenido de nuevo!')
        navigate('/panel-principal')
      } else {
        console.error('Error de autenticación:', result?.error)
        const errorMessage = result?.error?.message || 'Credenciales inválidas. Por favor, verifica tu email y contraseña.'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error)
      toast.error('Error al iniciar sesión. Por favor, verifica tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden relative">
      {/* SEO Meta Tags para Login */}
      <Helmet>
        <title>Iniciar Sesión - StaffHub | Plataforma de Comunicación Interna</title>
        <meta name="description" content="Accede a tu cuenta de StaffHub. Gestiona la comunicación interna de tu empresa con IA avanzada." />
        <meta name="keywords" content="login, iniciar sesión, StaffHub, comunicación interna, empresa" />
        <meta property="og:title" content="Iniciar Sesión - StaffHub" />
        <meta property="og:description" content="Accede a tu cuenta de StaffHub para gestionar empleados y comunicaciones." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://staffhub.cl/login" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://staffhub.cl/login" />
      </Helmet>
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

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-gray-300">Inicia sesión para continuar con tu experiencia</p>
          </div>

          <div className="relative">
            {/* Floating card with glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-4 border border-gray-700 rounded-xl bg-gray-700/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-white transition-all duration-300"
                      placeholder="tu@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-4 border border-gray-700 rounded-xl bg-gray-700/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-white transition-all duration-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                      Recordarme
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : null}
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800/80 backdrop-blur-sm text-gray-300">
                      ¿Primera vez aquí?
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/register"
                    className="w-full flex justify-center py-4 px-4 border border-gray-700 rounded-xl shadow-sm text-lg font-medium text-white bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-300"
                  >
                    Crear una cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center p-4">
        <p className="text-sm text-gray-400">
          Al iniciar sesión, aceptas nuestros{' '}
          <button className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
            Términos de Servicio
          </button>{' '}
          y{' '}
          <button className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
            Política de Privacidad
          </button>
        </p>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  )
}

export default LoginUltraModern