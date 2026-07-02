import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DiagramCanvas } from './canvas/DiagramCanvas'
import { Palette } from './ui/Palette'
import { Toolbar } from './ui/Toolbar'
import { Inspector } from './ui/Inspector'
import { CommandPalette } from './ui/CommandPalette'
import { AppDialogs } from './ui/AppDialogs'
import { DocumentsDialog } from './ui/DocumentsDialog'
import { MermaidDialog } from './ui/MermaidDialog'
import { ShareView } from './share/ShareView'
import { TourPanel } from './ui/TourPanel'
import { HistoryPanel } from './ui/HistoryPanel'
import { Presenter } from './ui/Presenter'
import { useApplyTheme } from './ui/themeStore'
import './App.css'

const SHARE_PREFIX = '/v/'

function getShareToken(): string | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname
  if (!path.startsWith(SHARE_PREFIX)) return null
  const token = path.slice(SHARE_PREFIX.length).split('/')[0] ?? ''
  return token || null
}

export default function App() {
  useApplyTheme()
  const shareToken = getShareToken()
  if (shareToken) return <ShareView token={shareToken} />

  return (
    <ReactFlowProvider>
      <div className="graffel-app">
        <Toolbar />
        <div className="graffel-body">
          <Palette />
          <DiagramCanvas />
          <Inspector />
          <TourPanel />
          <HistoryPanel />
        </div>
        <CommandPalette />
        <DocumentsDialog />
        <MermaidDialog />
        <AppDialogs />
        <Presenter />
      </div>
    </ReactFlowProvider>
  )
}
