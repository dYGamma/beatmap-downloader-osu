import { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import LoginScreen from './screens/LoginScreen'
import ProfileScreen from './screens/ProfileScreen'
import DownloadScreen from './screens/DownloadScreen'
import DoneScreen from './screens/DoneScreen'

function AnimatedScreen({ children }) {
  const [entered, setEntered] = useState(false)
  // requestAnimationFrame delay forces a repaint before applying the enter class,
  // so the CSS animation actually plays on mount instead of being skipped
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div
      className={entered ? 'screen-enter' : ''}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        opacity: entered ? undefined : 0
      }}
    >
      {children}
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [downloadData, setDownloadData] = useState(null)
  const [downloadResults, setDownloadResults] = useState(null)

  useEffect(() => {
    window.api.authStatus().then(({ loggedIn }) => {
      setScreen(loggedIn ? 'profile' : 'login')
    })
  }, [])

  function handleLoggedIn() { setScreen('profile') }

  function handleStart({ user, beatmaps, folder }) {
    setDownloadData({ user, beatmaps, folder })
    setScreen('download')
  }

  function handleDone(results) {
    setDownloadResults(results)
    setScreen('done')
  }

  function handleLogout() {
    window.api.logout()
    setScreen('login')
  }

  function handleRestart() {
    setDownloadData(null)
    setDownloadResults(null)
    setScreen('profile')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar />

      {screen === 'loading' && (
        <AnimatedScreen key="loading">
          <div className="screen screen-centered">
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</p>
          </div>
        </AnimatedScreen>
      )}

      {screen === 'login' && (
        <AnimatedScreen key="login">
          <LoginScreen onLoggedIn={handleLoggedIn} />
        </AnimatedScreen>
      )}

      {screen === 'profile' && (
        <AnimatedScreen key="profile">
          <ProfileScreen onStart={handleStart} onLogout={handleLogout} />
        </AnimatedScreen>
      )}

      {screen === 'download' && downloadData && (
        <AnimatedScreen key="download">
          <DownloadScreen
            beatmaps={downloadData.beatmaps}
            folder={downloadData.folder}
            onDone={handleDone}
          />
        </AnimatedScreen>
      )}

      {screen === 'done' && downloadResults && (
        <AnimatedScreen key="done">
          <DoneScreen
            results={downloadResults}
            folder={downloadData.folder}
            onRestart={handleRestart}
          />
        </AnimatedScreen>
      )}
    </div>
  )
}
