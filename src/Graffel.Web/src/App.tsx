import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DiagramCanvas } from './canvas/DiagramCanvas'
import { Palette } from './ui/Palette'
import { Toolbar } from './ui/Toolbar'
import './App.css'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="graffel-app">
        <Toolbar />
        <div className="graffel-body">
          <Palette />
          <DiagramCanvas />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
