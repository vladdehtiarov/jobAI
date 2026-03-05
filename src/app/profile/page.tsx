'use client'

import { useState, useMemo } from 'react'

type WorkPreference = 'Remote' | 'Hybrid' | 'On-site'

type ProfileData = {
    full_name: string
    target_role: string
    target_salary_usd: string
    years_of_experience: string
    work_preference: WorkPreference
    location: string
    education: string
    languages: string
    primary_skills: string
    linkedin_url: string
    github_url: string
    bio: string
}

export default function ProfilePage() {
    const initialData: ProfileData = {
        full_name: 'Jane Doe',
        target_role: 'Senior Frontend Engineer',
        target_salary_usd: '120000',
        years_of_experience: '5',
        work_preference: 'Remote',
        location: 'New York, NY',
        education: 'B.S. in Computer Science, MIT',
        languages: 'English (Native), Spanish (Conversational)',
        primary_skills: 'React, TypeScript, Next.js, Tailwind CSS',
        linkedin_url: 'https://linkedin.com/in/janedoe',
        github_url: 'https://github.com/janedoe',
        bio: '',
    }

    const [savedProfile, setSavedProfile] = useState<ProfileData>(initialData)
    const [formData, setFormData] = useState<ProfileData>(initialData)

    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'validation_error'>('idle')
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})

    const completeness = useMemo(() => {
        const keys = Object.keys(formData) as Array<keyof ProfileData>
        const filledCount = keys.filter((key) => {
            const value = formData[key]
            return typeof value === 'string' && value.trim().length > 0
        }).length

        return Math.round((filledCount / keys.length) * 100)
    }, [formData])

    const qualityLabel = useMemo(() => {
        if (completeness < 50) return { text: 'Basic', color: 'text-gray-400', bar: 'bg-gray-400' }
        if (completeness < 80) return { text: 'Good', color: 'text-blue-400', bar: 'bg-blue-400' }
        return { text: 'Excellent', color: 'text-emerald-400', bar: 'bg-emerald-400' }
    }, [completeness])

    // --- STRICT VALIDATION HELPERS ---

    const validateLinkedIn = (url: string): string | null => {
        if (!url.trim()) return null // Allow empty
        try {
            const parsed = new URL(url)
            if (!parsed.hostname.includes('linkedin.com')) {
                return 'Must be a valid linkedin.com URL'
            }
            // Check if there is a profile path (e.g., /in/username)
            if (!parsed.pathname.includes('/in/') || parsed.pathname.replace('/in/', '').length < 2) {
                return 'Must include your profile path (e.g., https://linkedin.com/in/username)'
            }
            return null
        } catch {
            return 'Please enter a valid full URL including https://'
        }
    }

    const validateGitHub = (url: string): string | null => {
        if (!url.trim()) return null // Allow empty
        try {
            const parsed = new URL(url)
            if (!parsed.hostname.includes('github.com')) {
                return 'Must be a valid github.com URL'
            }
            // Check if there is a username (pathname must be longer than just "/")
            if (parsed.pathname === '/' || parsed.pathname.length < 2) {
                return 'Must include your username (e.g., https://github.com/username)'
            }
            return null
        } catch {
            return 'Please enter a valid full URL including https://'
        }
    }

    // ---------------------------------

    const handleUpdateField = (field: keyof ProfileData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
        if (status !== 'idle') setStatus('idle')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Run Validations
        const newErrors: Partial<Record<keyof ProfileData, string>> = {}

        const linkedInError = validateLinkedIn(formData.linkedin_url)
        if (linkedInError) newErrors.linkedin_url = linkedInError

        const githubError = validateGitHub(formData.github_url)
        if (githubError) newErrors.github_url = githubError

        // Stop if there are validation errors
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            setStatus('validation_error')
            return
        }

        const previousProfile = { ...savedProfile }
        setSavedProfile({ ...formData })
        setStatus('saving')

        try {
            await new Promise((resolve) => {
                setTimeout(() => resolve(true), 1000)
            })

            setLastUpdated(new Date())
            setStatus('success')
            setTimeout(() => setStatus('idle'), 3000)

        } catch (error) {
            console.error('Save failed:', error)
            setSavedProfile(previousProfile)
            setFormData(previousProfile)
            setStatus('error')
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">Profile Settings</h1>
                        <p className="text-sm text-gray-400">Update your career preferences to improve your AI job matches.</p>
                    </div>

                    {lastUpdated && (
                        <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Last saved today at {formatTime(lastUpdated)}
                        </div>
                    )}
                </header>

                {/* Optimistic UI & Quality Indicator Card */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-900/50 shrink-0">
                                {savedProfile.full_name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{savedProfile.full_name}</h2>
                                <p className="text-purple-300 font-medium">{savedProfile.target_role}</p>
                                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                    {savedProfile.work_preference} • {savedProfile.location}
                                </p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right bg-gray-900/50 rounded-xl p-3 border border-gray-800/50">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Target Salary</p>
                            <p className="text-lg font-bold text-emerald-400">${Number(savedProfile.target_salary_usd).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800/50 space-y-2">
                        <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-gray-300">Profile Completeness</span>
                            <span className={qualityLabel.color}>
                {completeness}% • {qualityLabel.text}
              </span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                            <div
                                className={`h-full ${qualityLabel.bar} transition-all duration-500 ease-out`}
                                style={{ width: `${completeness}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* ... (Basic Info, Career Preferences, Education remain the same) ... */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Basic Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => handleUpdateField('full_name', e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Location (City, Country)</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleUpdateField('location', e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-2">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Career Preferences</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Role</label>
                                    <input
                                        type="text"
                                        value={formData.target_role}
                                        onChange={(e) => handleUpdateField('target_role', e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Salary (USD)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.target_salary_usd}
                                            onChange={(e) => handleUpdateField('target_salary_usd', e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Experience (Years)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.years_of_experience}
                                        onChange={(e) => handleUpdateField('years_of_experience', e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Preference</label>
                                    <select
                                        value={formData.work_preference}
                                        onChange={(e) => handleUpdateField('work_preference', e.target.value as WorkPreference)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all appearance-none"
                                    >
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="On-site">On-site</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-2">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Education & Languages</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Education</label>
                                    <input
                                        type="text"
                                        value={formData.education}
                                        onChange={(e) => handleUpdateField('education', e.target.value)}
                                        placeholder="e.g. B.S. Computer Science, Stanford"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Languages</label>
                                    <input
                                        type="text"
                                        value={formData.languages}
                                        onChange={(e) => handleUpdateField('languages', e.target.value)}
                                        placeholder="e.g. English (Native), German (B2)"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section: Skills & Links (WITH STRICT VALIDATION) */}
                        <section className="space-y-4 pt-2">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Skills & Links</h3>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Skills (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.primary_skills}
                                    onChange={(e) => handleUpdateField('primary_skills', e.target.value)}
                                    placeholder="e.g. React, Node.js, Python, AWS"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">LinkedIn URL</label>
                                    <input
                                        type="text"
                                        value={formData.linkedin_url}
                                        onChange={(e) => handleUpdateField('linkedin_url', e.target.value)}
                                        placeholder="https://linkedin.com/in/username"
                                        className={`w-full bg-gray-950 border rounded-xl p-3 text-gray-100 outline-none transition-all ${
                                            errors.linkedin_url
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                                                : 'border-gray-800 focus:ring-2 focus:ring-purple-600'
                                        }`}
                                    />
                                    {errors.linkedin_url && (
                                        <p className="text-xs text-red-400 font-medium animate-in slide-in-from-top-1">{errors.linkedin_url}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">GitHub / Portfolio URL</label>
                                    <input
                                        type="text"
                                        value={formData.github_url}
                                        onChange={(e) => handleUpdateField('github_url', e.target.value)}
                                        placeholder="https://github.com/username"
                                        className={`w-full bg-gray-950 border rounded-xl p-3 text-gray-100 outline-none transition-all ${
                                            errors.github_url
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                                                : 'border-gray-800 focus:ring-2 focus:ring-purple-600'
                                        }`}
                                    />
                                    {errors.github_url && (
                                        <p className="text-xs text-red-400 font-medium animate-in slide-in-from-top-1">{errors.github_url}</p>
                                    )}
                                </div>

                            </div>
                        </section>

                        <section className="space-y-1.5 pt-2">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Professional Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => handleUpdateField('bio', e.target.value)}
                                rows={4}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none transition-all resize-none"
                                placeholder="Tell us a little about your experience..."
                            />
                        </section>

                    </div>

                    <div className="bg-gray-950/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800">

                        <div className="flex-1">
                            {status === 'saving' && (
                                <span className="flex items-center gap-2 text-sm text-purple-400 animate-pulse font-medium">
                  Saving changes to server...
                </span>
                            )}
                            {status === 'success' && (
                                <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium animate-in fade-in zoom-in duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Profile updated successfully!
                </span>
                            )}
                            {status === 'validation_error' && (
                                <span className="flex items-center gap-2 text-sm text-red-400 font-medium animate-in shake">
                  ⚠️ Please fix the link errors above before saving.
                </span>
                            )}
                            {status === 'error' && (
                                <span className="flex items-center gap-2 text-sm text-red-400 font-medium">
                  Failed to save. Changes rolled back.
                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'saving'}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-600 text-white font-bold tracking-wide hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-900/30"
                        >
                            {status === 'saving' ? 'Saving...' : 'Save Profile'}
                        </button>

                    </div>
                </form>

            </div>
        </div>
    )
}