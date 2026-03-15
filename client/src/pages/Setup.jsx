import { useEffect, useState, useCallback, useRef } from 'react'
import { API_URL } from '../api'

export default function Setup() {
  const [projects, setProjects] = useState([])
  const [fetchStatus, setFetchStatus] = useState({ running: false, progress: '', error: null })
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState({})
  const [customProjects, setCustomProjects] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const loadProjects = useCallback(() => {
    fetch(`${API_URL}/api/admin/projects`)
      .then(r => r.json())
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (!fetchStatus.running) return
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/admin/fetch-status`)
        .then(r => r.json())
        .then(status => {
          setFetchStatus(status)
          if (!status.running) {
            clearInterval(interval)
            loadProjects()
          }
        })
    }, 2000)
    return () => clearInterval(interval)
  }, [fetchStatus.running, loadProjects])

  const handleFetch = () => {
    setFetchStatus({ running: true, progress: 'Starting...', error: null })
    fetch(`${API_URL}/api/admin/fetch-printables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: 'Aerocreative' }),
    })
      .then(r => r.json())
      .then(() => setFetchStatus(prev => ({ ...prev, running: true })))
      .catch(err => setFetchStatus({ running: false, progress: '', error: err.message }))
  }

  const toggleBlacklist = (projectId, currentState) => {
    fetch(`${API_URL}/api/admin/projects/${projectId}/blacklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blacklisted: !currentState }),
    })
      .then(r => r.json())
      .then(() => {
        setProjects(prev =>
          prev.map(p => p.id === projectId ? { ...p, blacklisted: !currentState } : p)
        )
      })
  }

  const selectStl = (projectId, stlFile) => {
    setDownloading(prev => ({ ...prev, [projectId]: 'Starting...' }))
    fetch(`${API_URL}/api/admin/projects/${projectId}/select-stl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stlFileId: stlFile.id, stlFileName: stlFile.name }),
    })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || r.statusText) })
        return r.json()
      })
      .then(() => {
        let idleCount = 0
        const poll = setInterval(() => {
          fetch(`${API_URL}/api/admin/download-status/${projectId}`)
            .then(r => r.json())
            .then(status => {
              if (status.status === 'downloading') {
                idleCount = 0
                setDownloading(prev => ({ ...prev, [projectId]: status.progress || 'Downloading...' }))
              } else if (status.status === 'done') {
                clearInterval(poll)
                setDownloading(prev => ({ ...prev, [projectId]: false }))
                loadProjects()
              } else if (status.status === 'error') {
                clearInterval(poll)
                setDownloading(prev => ({ ...prev, [projectId]: false }))
                alert(`Download failed: ${status.error}`)
                loadProjects()
              } else if (status.status === 'idle') {
                idleCount++
                if (idleCount > 3) {
                  clearInterval(poll)
                  setDownloading(prev => ({ ...prev, [projectId]: false }))
                  alert('Download may have failed — check server console for details.')
                  loadProjects()
                }
              }
            })
        }, 2000)
      })
      .catch(err => {
        setDownloading(prev => ({ ...prev, [projectId]: false }))
        alert(`Error: ${err.message}`)
      })
  }

  const clearStl = (projectId) => {
    fetch(`${API_URL}/api/admin/projects/${projectId}/select-stl`, { method: 'DELETE' })
      .then(() => loadProjects())
  }

  const resetProject = (projectId, projectName) => {
    if (!confirm(`Reset "${projectName}"? This will clear its blacklist status, STL selection, and delete any downloaded file.`)) return
    fetch(`${API_URL}/api/admin/projects/${projectId}/reset`, { method: 'POST' })
      .then(() => loadProjects())
  }

  const resetAll = () => {
    if (!confirm('Reset EVERYTHING? This will delete all downloaded STLs, clear all blacklists and selections, and remove all project data. You will need to re-fetch from Printables.')) return
    fetch(`${API_URL}/api/admin/reset-all`, { method: 'POST' })
      .then(() => {
        setDownloading({})
        loadProjects()
      })
  }

  // Custom projects
  const loadCustomProjects = useCallback(() => {
    fetch(`${API_URL}/api/admin/custom-projects`)
      .then(r => r.json())
      .then(setCustomProjects)
      .catch(() => {})
  }, [])

  useEffect(() => { loadCustomProjects() }, [loadCustomProjects])

  const createCustomProject = (formData) => {
    fetch(`${API_URL}/api/admin/custom-projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(r => r.json())
      .then(() => {
        loadCustomProjects()
        setShowCreateForm(false)
      })
  }

  const deleteCustomProject = (id, name) => {
    if (!confirm(`Delete custom project "${name}"? This will remove it and all uploaded images.`)) return
    fetch(`${API_URL}/api/admin/custom-projects/${id}`, { method: 'DELETE' })
      .then(() => loadCustomProjects())
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] font-[Inter,sans-serif] p-4 pt-20 sm:p-8 sm:pt-20">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold italic uppercase mb-2">
          <span className="text-[#FF6B00] not-italic">//</span> Admin Setup
        </h1>
        <p className="text-[#888] text-sm mb-6">
          Andrew use this to setup which projects are being used from Printables and w/ stl file you want to display DONT CLICK ON ANYTHING THAT ISNT STL !!! youve been warned
        </p>

        {/* Fetch controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-[#111] border border-[#222] rounded-lg">
          <button
            onClick={handleFetch}
            disabled={fetchStatus.running}
            className="px-4 py-2.5 bg-[#FF6B00] text-white border-none rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[#FF8C33] transition-colors"
          >
            {fetchStatus.running ? 'Fetching...' : 'Fetch from Printables'}
          </button>
          <button
            onClick={resetAll}
            disabled={fetchStatus.running}
            className="px-4 py-2.5 bg-transparent text-[#CC2200] border border-[#CC2200] rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[#CC2200]/20 transition-colors"
          >
            Reset All
          </button>
          {fetchStatus.running && (
            <span className="text-[#FF6B00] text-sm">{fetchStatus.progress}</span>
          )}
          {fetchStatus.error && (
            <span className="text-[#CC2200] text-sm">{fetchStatus.error}</span>
          )}
          {!fetchStatus.running && fetchStatus.progress && !fetchStatus.error && (
            <span className="text-[#00cc44] text-sm">{fetchStatus.progress}</span>
          )}
        </div>

        {/* Projects */}
        {loading ? (
          <div className="text-[#666] text-center py-12">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-[#666] text-center py-12 bg-[#111] border border-[#222] rounded-lg">
            No projects found. Click "Fetch from Printables" to pull projects.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                downloading={downloading[project.id]}
                onToggleBlacklist={() => toggleBlacklist(project.id, project.blacklisted)}
                onSelectStl={(stl) => selectStl(project.id, stl)}
                onClearStl={() => clearStl(project.id)}
                onReset={() => resetProject(project.id, project.name)}
              />
            ))}
          </div>
        )}

        {/* Custom Projects */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold italic uppercase">
              <span className="text-[#FF6B00] not-italic">//</span> Custom Projects
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-[#FF6B00] text-white rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#FF8C33] transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ New Project'}
            </button>
          </div>

          {showCreateForm && (
            <CreateProjectForm
              onSubmit={createCustomProject}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {customProjects.length === 0 && !showCreateForm ? (
            <div className="text-[#666] text-center py-8 bg-[#111] border border-[#222] rounded-lg">
              No custom projects yet. Click "+ New Project" to create one.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {customProjects.map(project => (
                <CustomProjectCard
                  key={project.id}
                  project={project}
                  onDelete={() => deleteCustomProject(project.id, project.name)}
                  onUpdate={loadCustomProjects}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateProjectForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), summary, description })
  }

  const inputClass = "w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-[#f0f0f0] focus:border-[#FF6B00] focus:outline-none transition-colors"

  return (
    <form onSubmit={handleSubmit} className="bg-[#111] border border-[#222] rounded-lg p-5 mb-4">
      <div className="mb-4">
        <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-[#888] mb-1.5">Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Project name" required />
      </div>
      <div className="mb-4">
        <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-[#888] mb-1.5">Summary</label>
        <input value={summary} onChange={e => setSummary(e.target.value)} className={inputClass} placeholder="Short one-liner" />
      </div>
      <div className="mb-4">
        <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-[#888] mb-1.5">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Detailed description" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-[#FF6B00] text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#FF8C33] transition-colors">
          Create Project
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-transparent text-[#888] border border-[#444] rounded text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#f0f0f0] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

function CustomProjectCard({ project, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const coverInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const uploadCover = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('cover', file)
    fetch(`${API_URL}/api/admin/custom-projects/${project.id}/cover`, {
      method: 'POST',
      body: formData,
    })
      .then(r => r.json())
      .then(() => { onUpdate(); setUploading(false) })
      .catch(() => setUploading(false))
  }

  const uploadGallery = (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const formData = new FormData()
    for (const file of files) formData.append('images', file)
    fetch(`${API_URL}/api/admin/custom-projects/${project.id}/images`, {
      method: 'POST',
      body: formData,
    })
      .then(r => r.json())
      .then(() => { onUpdate(); setUploading(false) })
      .catch(() => setUploading(false))
  }

  const deleteImage = (imageId) => {
    fetch(`${API_URL}/api/admin/custom-projects/${project.id}/images/${imageId}`, { method: 'DELETE' })
      .then(() => onUpdate())
  }

  return (
    <div className="bg-[#111] border border-[#222] border-l-4 border-l-[#FF6B00] rounded-lg p-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          {project.coverImage ? (
            <img src={project.coverImage} alt={project.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md shrink-0 bg-[#1a1a1a]" />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md shrink-0 bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#555] text-[0.6rem] uppercase">
              No cover
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-bold truncate">{project.name}</h3>
              <span className="px-1.5 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[0.55rem] font-bold uppercase rounded">Custom</span>
            </div>
            <p className="text-[0.7rem] text-[#666] m-0 mb-1">
              {project.category || 'Custom'} &bull; {project.images?.length || 0} images
            </p>
            {project.summary && (
              <p className="text-xs text-[#888] m-0 hidden sm:block">{project.summary}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {project.coverImage && (
            <span className="px-2 py-1 bg-[#00cc44]/10 text-[#00cc44] border border-[#00cc44] rounded text-[0.6rem] font-bold uppercase tracking-wider">
              Cover Set
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00] rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#FF6B00]/20 transition-colors"
          >
            {expanded ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="px-2.5 py-1.5 bg-[#CC2200]/15 text-[#CC2200] border border-[#CC2200] rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#CC2200]/25 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#222]">
          {/* Cover image upload */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">Cover Image (shown on homepage)</span>
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-[#FF6B00] text-white rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : project.coverImage ? 'Change Cover' : 'Upload Cover'}
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={uploadCover} className="hidden" />
            </div>
            {project.coverImage && (
              <img src={project.coverImage} alt="Cover" className="h-32 rounded border border-[#333] object-cover" />
            )}
          </div>

          {/* Gallery upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">Gallery Images (shown on project page)</span>
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-[#FF6B00] text-white rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#FF8C33] disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Add Images'}
              </button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={uploadGallery} className="hidden" />
            </div>
            {project.images && project.images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {project.images.map(img => (
                  <div key={img.id} className="relative shrink-0 group">
                    <img src={img.url} alt="" className="h-24 rounded border border-[#333] object-cover" />
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-[#CC2200] text-white rounded-full text-[0.6rem] font-bold leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#555] text-xs">No gallery images yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, downloading, onToggleBlacklist, onSelectStl, onClearStl, onReset }) {
  const [expanded, setExpanded] = useState(false)

  const borderColor = project.blacklisted
    ? 'border-l-[#555]'
    : project.selectedStl && project.stlDownloaded
      ? 'border-l-[#00cc44]'
      : project.selectedStl
        ? 'border-l-[#FF6B00]'
        : 'border-l-[#333]'

  return (
    <div
      className={`bg-[#111] border border-[#222] border-l-4 ${borderColor} rounded-lg p-4 transition-opacity ${project.blacklisted ? 'opacity-40' : ''}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          {project.images?.[0] && (
            <img
              src={project.images[0].url}
              alt={project.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md shrink-0 bg-[#1a1a1a]"
            />
          )}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold m-0 mb-1 truncate">{project.name}</h3>
            <p className="text-[0.7rem] text-[#666] m-0 mb-1">
              {project.category} &bull; {project.stlFiles?.length || 0} STL files &bull; {project.images?.length || 0} images
            </p>
            {project.summary && (
              <p className="text-xs text-[#888] m-0 hidden sm:block">{project.summary}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {project.stlDownloaded && (
            <span className="px-2 py-1 bg-[#00cc44]/10 text-[#00cc44] border border-[#00cc44] rounded text-[0.6rem] font-bold uppercase tracking-wider">
              STL Ready
            </span>
          )}
          {project.selectedStl && !project.stlDownloaded && (
            <span className="px-2 py-1 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00] rounded text-[0.6rem] font-bold uppercase tracking-wider">
              STL Pending
            </span>
          )}

          <button
            onClick={onToggleBlacklist}
            className={`px-2.5 py-1.5 border rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap transition-colors ${
              project.blacklisted
                ? 'bg-[#333] text-[#888] border-[#444] hover:bg-[#444]'
                : 'bg-[#CC2200]/15 text-[#CC2200] border-[#CC2200] hover:bg-[#CC2200]/25'
            }`}
          >
            {project.blacklisted ? 'Unblock' : 'Blacklist'}
          </button>

          <button
            onClick={onReset}
            className="px-2.5 py-1.5 bg-[#888]/10 text-[#888] border border-[#555] rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#888]/20 transition-colors"
          >
            Reset
          </button>

          {!project.blacklisted && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-1.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00] rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#FF6B00]/20 transition-colors"
            >
              {expanded ? 'Close' : 'Select STL'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded STL selector */}
      {expanded && !project.blacklisted && (
        <div className="mt-4 pt-4 border-t border-[#222]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">Choose display STL:</span>
            {project.selectedStl && (
              <button
                onClick={onClearStl}
                className="px-2.5 py-1 bg-transparent text-[#888] border border-[#444] rounded text-[0.65rem] cursor-pointer hover:text-[#f0f0f0] hover:border-[#666] transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Image gallery */}
          {project.images && project.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
              {project.images.map(img => (
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="h-24 rounded object-cover shrink-0 bg-[#1a1a1a] border border-[#222]"
                />
              ))}
            </div>
          )}

          {/* STL file list */}
          <div className="flex flex-col gap-2">
            {(project.stlFiles || []).map(stl => {
              const isSelected = project.selectedStl?.stlFileId === stl.id
              const isDownloaded = isSelected && project.stlDownloaded
              const needsRetry = isSelected && !project.stlDownloaded && !downloading
              return (
                <div
                  key={stl.id}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 border rounded-md transition-all ${
                    isDownloaded
                      ? 'border-[#00cc44] bg-[#FF6B00]/5'
                      : isSelected
                        ? 'border-[#FF6B00] bg-[#FF6B00]/5'
                        : 'border-[#333] bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold truncate">{stl.name}</span>
                    <span className="text-[0.65rem] text-[#666]">
                      {stl.fileSize ? `${(stl.fileSize / 1024).toFixed(0)} KB` : ''}
                    </span>
                  </div>

                  {stl.previewUrl && (
                    <img src={stl.previewUrl} alt="" className="w-12 h-12 object-contain rounded bg-[#0a0a0a] shrink-0" />
                  )}

                  <button
                    onClick={() => onSelectStl(stl)}
                    disabled={!!downloading || isDownloaded}
                    className={`px-3 py-2 text-white border-none rounded text-[0.65rem] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors ${
                      isDownloaded
                        ? 'bg-[#00cc44] opacity-50 cursor-not-allowed'
                        : needsRetry
                          ? 'bg-[#CC2200] cursor-pointer hover:bg-[#e62800]'
                          : downloading
                            ? 'bg-[#FF6B00] opacity-50 cursor-not-allowed'
                            : 'bg-[#FF6B00] cursor-pointer hover:bg-[#FF8C33]'
                    }`}
                  >
                    {downloading
                      ? (typeof downloading === 'string' ? downloading : 'Downloading...')
                      : isDownloaded
                        ? 'Downloaded'
                        : needsRetry
                          ? 'Retry Download'
                          : 'Select & Download'
                    }
                  </button>
                </div>
              )
            })}
            {(!project.stlFiles || project.stlFiles.length === 0) && (
              <p className="text-[#666] text-sm">No STL files found for this project.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
