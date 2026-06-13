import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DiagramCanvas } from './canvas/DiagramCanvas'
import { Palette } from './ui/Palette'
import { Toolbar } from './ui/Toolbar'
import { Inspector } from './ui/Inspector'
import { CommandPalette } from './ui/CommandPalette'
import { AppDialogs } from './ui/AppDialogs'
import { DocumentsDialog } from './ui/DocumentsDialog'
import { ShareView } from './share/ShareView'
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
        </div>
        <CommandPalette />
        <DocumentsDialog />
        <AppDialogs />
      </div>
    </ReactFlowProvider>
  )
}
