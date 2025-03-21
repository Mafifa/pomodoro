import { useState, useEffect, useCallback } from "react"
import { SettingsWindow } from "./components/main-components/SettingsWindow"
import { Tooltip } from "./components/main-components/Tooltip"

export const PRESETS = {
  SHORT: {
    work: 15 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  CLASSIC: {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  LONG: {
    work: 50 * 60,
    shortBreak: 15 * 60,
    longBreak: 30 * 60,
  },
}

type PresetKey = keyof typeof PRESETS

export default function App () {
  const [state, setState] = useState<PomodoroState | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isTransparent, setIsTransparent] = useState(false)

  const toggleTransparency = useCallback(() => {
    setIsTransparent(prev => {
      const newState = !prev
      window.api.toggleTransparency(newState)
      return newState
    })
  }, [])

  useEffect(() => {
    window.api.getInitialState().then(setState)
    window.api.onUpdate(setState)
    window.api.onTransparencyChanged(setIsTransparent)

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        toggleTransparency()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [toggleTransparency])

  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [isDarkMode])

  useEffect(() => {
    window.api.setDraggable(!isTransparent)
  }, [isTransparent])

  if (!state) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handlePresetChange = (newPreset: PresetKey) => {
    window.api.sendAction({ type: 'UPDATE_SETTING', payload: PRESETS[newPreset] })
  }

  const handleModeChange = (newMode: SessionType) => {
    window.api.sendAction({ type: 'CHANGE_SESSION', payload: newMode })
  }

  const handleSettingsSave = (newSettings: PomodoroSettings) => {
    window.api.sendAction({ type: 'UPDATE_SETTING', payload: newSettings })
    setIsSettingsOpen(false)
  }

  return (
    <div className={`flex flex-col items-center bg-card text-card-foreground w-[540px] h-[310px] p-6 rounded-3xl shadow-lg border border-border ${isTransparent ? 'bg-transparent' : 'bg-background'} text-foreground transition-all duration-300 overflow-hidden`}>
      <div className={`w-full h-full flex flex-col items-center p-2 justify-center relative overflow-hidden ${isTransparent ? 'bg-opacity-30 backdrop-blur-sm' : 'bg-card'} transition-all duration-300`}>
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            onClick={() => window.api.minimizeApp()}
            className="w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors duration-200"
          >
            <span className="sr-only">Minimize</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => window.api.closeApp()}
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-900" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {!isTransparent && (
          <div className="flex justify-center space-x-4 w-full mb-4">
            {(Object.keys(PRESETS) as PresetKey[]).map((presetKey) => (
              <Tooltip
                key={presetKey}
                content={
                  <div className="text-xs">
                    <p>Work: {formatTime(PRESETS[presetKey].work)}</p>
                    <p>Short Break: {formatTime(PRESETS[presetKey].shortBreak)}</p>
                    <p>Long Break: {formatTime(PRESETS[presetKey].longBreak)}</p>
                  </div>
                }
              >
                <button
                  onClick={() => handlePresetChange(presetKey)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${state.settings.work === PRESETS[presetKey].work &&
                    state.settings.shortBreak === PRESETS[presetKey].shortBreak &&
                    state.settings.longBreak === PRESETS[presetKey].longBreak
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                >
                  {presetKey}
                </button>
              </Tooltip>
            ))}
          </div>
        )}

        <div className={`text-8xl font-light mb-8 ${isTransparent ? 'text-white' : ''}`}>{formatTime(state.timeLeft)}</div>

        {!isTransparent && (
          <div className="flex justify-center space-x-4 w-full">
            <button
              onClick={() => window.api.sendAction({ type: 'START_STOP' })}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              {state.isRunning ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <button
              onClick={() => window.api.sendAction({ type: 'RESET' })}
              className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
            </button>
            <button
              onClick={() => handleModeChange(state.currentSession === "work" ? "shortBreak" : "work")}
              className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </button>
          </div>
        )}

        {!isTransparent && (
          <>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </>
        )}

        <div className="absolute top-4 left-4 text-sm font-medium text-muted-foreground">
          {state.isRunning ? `${state.currentSession.charAt(0).toUpperCase() + state.currentSession.slice(1)} in progress` : "Ready"}
        </div>
      </div>

      <SettingsWindow
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={state.settings}
        onSave={handleSettingsSave}
      />
    </div>
  )
}