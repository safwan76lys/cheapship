import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react'
import { API_URL } from '../config/api.js'
import PhonePrefixSelector from './PhonePrefixSelector'

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  // États pour le système complet
  const [currentView, setCurrentView] = useState('auth') // 'auth', 'forgot', 'reset'
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // États pour le renvoi d'email
  const [showResendSection, setShowResendSection] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [resendError, setResendError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  const [phoneData, setPhoneData] = useState({
    prefix: { countryCode: 'FR', prefix: '+33' },
    number: ''
  })

  // Validation mot de passe renforcée
  const validatePassword = (password) => {
    const minLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []
    if (!minLength) errors.push('8 caractères minimum')
    if (!hasUppercase) errors.push('une majuscule')
    if (!hasLowercase) errors.push('une minuscule')
    if (!hasNumber) errors.push('un chiffre')
    if (!hasSpecialChar) errors.push('un caractère spécial (!@#$%^&*...)')

    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
      errors
    }
  }

  // Indicateur de force du mot de passe
  const PasswordStrengthIndicator = ({ password }) => {
    const validation = validatePassword(password)
    
    return (
      <div className="mt-2">
        <div className="text-xs text-gray-600 mb-1">Exigences du mot de passe :</div>
        <div className="space-y-1">
          {[
            { check: password.length >= 8, text: '8 caractères minimum' },
            { check: /[A-Z]/.test(password), text: 'Une majuscule' },
            { check: /[a-z]/.test(password), text: 'Une minuscule' },
            { check: /\d/.test(password), text: 'Un chiffre' },
            { check: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'Un caractère spécial' }
          ].map((requirement, index) => (
            <div key={index} className={`text-xs flex items-center ${requirement.check ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="mr-1">{requirement.check ? '✓' : '○'}</span>
              {requirement.text}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Gestion du token depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const isVerify = urlParams.get('verify')
    
    if (token && isVerify === 'true') {
      // Vérification d'email automatique depuis l'email
      handleEmailVerification(token)
    } else if (token && !isVerify) {
      // Reset de mot de passe
      setResetToken(token)
      setCurrentView('reset')
    }
  }, [])

  // Demande de réinitialisation
  const handleForgotPassword = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Un email de réinitialisation a été envoyé si cette adresse existe.')
        setTimeout(() => setCurrentView('auth'), 3000)
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  // Réinitialisation mot de passe
  const handleResetPassword = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      setError(`Mot de passe invalide: ${passwordValidation.errors.join(', ')}`)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: resetToken, 
          password: newPassword 
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.token && data.user && onLogin) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setSuccess('Mot de passe réinitialisé avec succès ! Connexion automatique...')
          setTimeout(() => onLogin(data.token, data.user), 1500)
        } else {
          setSuccess('Mot de passe réinitialisé avec succès ! Redirection vers la connexion...')
          setTimeout(() => {
            setCurrentView('auth')
            setIsLogin(true)
          }, 2000)
        }
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  // Fonction de vérification d'email
  const handleEmailVerification = async (token) => {
    setIsVerifyingEmail(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('✅ Email vérifié avec succès ! Connexion automatique...')
        setVerificationMessage('Votre compte est maintenant activé')
        
        // Connexion automatique après vérification
        try {
          // Récupérer les données utilisateur mises à jour
          const userResponse = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
          
          if (userResponse.ok) {
            const userData = await userResponse.json()
            
            // Connexion automatique avec données fraîches
            setTimeout(() => {
              onLogin(localStorage.getItem('token'), userData.user)
            }, 1500)
          } else {
            // Si pas de token valide, rediriger vers connexion
            setTimeout(() => {
              setCurrentView('auth')
              setIsLogin(true)
            }, 2000)
          }
        } catch (userError) {
          console.error('Erreur récupération utilisateur:', userError)
          setTimeout(() => {
            setCurrentView('auth')
            setIsLogin(true)
          }, 2000)
        }
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        setError(data.error || 'Token de vérification invalide ou expiré')
        setVerificationMessage('Erreur de vérification')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
      setVerificationMessage('Erreur de connexion')
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  // Fonction : Renvoyer email de vérification (publique)
  const handleResendVerificationEmail = async () => {
    if (!resendEmail) {
      setResendError('Veuillez entrer votre adresse email')
      return
    }

    setIsResendingEmail(true)
    setResendError('')
    setResendSuccess('')

    try {
      const resendResponse = await fetch(`${API_URL}/auth/resend-verification-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      })

      const data = await resendResponse.json()

      if (resendResponse.ok) {
        setResendSuccess('Email de vérification envoyé ! Vérifiez votre boîte mail.')
        setResendEmail('')
        setTimeout(() => {
          setShowResendSection(false)
          setResendSuccess('')
        }, 3000)
      } else {
        setResendError(data.error || 'Erreur lors de l\'envoi de l\'email')
      }
    } catch (error) {
      setResendError('Erreur de connexion au serveur')
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation mot de passe pour inscription
    if (!isLogin) {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        setError(`Mot de passe invalide: ${passwordValidation.errors.join(', ')}`)
        setLoading(false)
        return
      }
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register'
    const body = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        if (isLogin) {
          onLogin(data.token, data.user)
        } else {
          setSuccess('Inscription réussie ! Vérifiez votre email pour activer votre compte.')
          setIsLogin(true)
          // Préremplir l'email pour le renvoi
          setResendEmail(formData.email)
        }
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  // Page de vérification d'email en cours
  if (isVerifyingEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <h1 className="text-2xl font-bold mb-2">Vérification de votre email...</h1>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous vérifions votre adresse email.
            </p>
          </div>
          
          {verificationMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              {verificationMessage}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Page de demande de réinitialisation
  if (currentView === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => setCurrentView('auth')}
            className="flex items-center text-gray-600 mb-6 hover:text-gray-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour
          </button>

          <h1 className="text-2xl font-bold text-center mb-2">Mot de passe oublié</h1>
          <p className="text-gray-600 text-center mb-8">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Page de réinitialisation du mot de passe
  if (currentView === 'reset') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Nouveau mot de passe</h1>
          <p className="text-gray-600 text-center mb-8">
            Choisissez un nouveau mot de passe sécurisé
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {newPassword && <PasswordStrengthIndicator password={newPassword} />}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Page principale de connexion/inscription
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Cheapship</h1>
        
        <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded ${isLogin ? 'bg-white shadow' : ''}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded ${!isLogin ? 'bg-white shadow' : ''}`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Section : Renvoi d'email après inscription */}
        {success && success.includes('Inscription réussie') && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center mb-3">
              <p className="text-sm text-blue-700 mb-2">
                Vous n'avez pas reçu l'email ? Vérifiez vos spams ou 
              </p>
              <button
                onClick={() => setShowResendSection(!showResendSection)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                Renvoyer l'email de vérification
              </button>
            </div>

            {showResendSection && (
              <div className="space-y-3 border-t border-blue-200 pt-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="votre@email.com"
                  />
                </div>

                {resendError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {resendError}
                  </div>
                )}

                {resendSuccess && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    {resendSuccess}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleResendVerificationEmail}
                    disabled={isResendingEmail}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isResendingEmail ? (
                      <>
                        <Loader className="animate-spin mr-2" size={16} />
                        Envoi...
                      </>
                    ) : (
                      'Renvoyer l\'email'
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowResendSection(false)
                      setResendError('')
                      setResendSuccess('')
                      setResendEmail('')
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Annuler
                  </button>
                </div>

                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Si votre email n'est pas vérifié, vous recevrez un nouvel email de vérification.
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isLogin}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays
                </label>
                <PhonePrefixSelector
                  value={phoneData.prefix}
                  onChange={(prefixData) => setPhoneData(prev => ({
                    ...prev,
                    prefix: prefixData
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={phoneData.number}
                  onChange={(e) => setPhoneData(prev => ({
                    ...prev,
                    number: e.target.value
                  }))}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!isLogin && formData.password && (
              <PasswordStrengthIndicator password={formData.password} />
            )}
            {isLogin && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('forgot')}
                  className="text-blue-600 hover:text-blue-800 text-sm underline font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <span>{isLogin ? 'Se connecter' : 'S\'inscrire'}</span>
            )}
          </button>
        </form>

        {/* Section : Aide pour les utilisateurs perdus */}
        {isLogin && (
          <div className="mt-6">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-500 mb-2">
                Problème avec votre compte ?
              </p>
              <button
                onClick={() => setShowResendSection(!showResendSection)}
                className="text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Renvoyer un email de vérification
              </button>
            </div>

            {/* Section de renvoi d'email pour page de connexion */}
            {showResendSection && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="votre@email.com"
                  />
                </div>

                {resendError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {resendError}
                  </div>
                )}

                {resendSuccess && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    {resendSuccess}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleResendVerificationEmail}
                    disabled={isResendingEmail}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isResendingEmail ? (
                      <>
                        <Loader className="animate-spin mr-2" size={16} />
                        Envoi...
                      </>
                    ) : (
                      'Renvoyer l\'email'
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowResendSection(false)
                      setResendError('')
                      setResendSuccess('')
                      setResendEmail('')
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Annuler
                  </button>
                </div>

                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Si votre email n'est pas vérifié, vous recevrez un nouvel email de vérification.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthPage
