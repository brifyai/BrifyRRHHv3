// ✅ SOLUCIÓN DEFINITIVA: Timeout de seguridad SIN resetear datos
useEffect(() => {
  const maxLoadingTimeout = setTimeout(() => {
    console.log('Dashboard: Timeout de seguridad alcanzado, solo forzando loading = false')
    setLoading(false)
    // ❌ PROBLEMA SOLUCIONADO: NO resetear stats si ya se cargaron datos
    // Solo mostrar loading=false, mantener los datos cargados
  }, 12000) // 12 segundos máximo

  return () => clearTimeout(maxLoadingTimeout)
}, [])