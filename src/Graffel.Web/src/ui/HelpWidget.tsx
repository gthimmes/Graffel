import { useEffect } from 'react'
import { HelpNavigator } from 'help-navigator'
import { useThemeStore } from './themeStore'
import { helpContent } from '../help/content'
import { helpArticlesFor } from '../help/context'

// Mounts the in-app help center (floating launcher bottom-right, F1 to
// toggle). Graffel is a single-canvas app, so the "Suggested for this page"
// context is set once from the pathname (editor vs read-only share view)
// rather than on route changes.
//
// Corner choice: bottom-right sits over the Inspector's empty lower area;
// bottom-left would collide with the palette's Libraries button. F1 is unused
// by the canvas (F2 edits labels; `/` opens the command palette).
export function HelpWidget() {
  const pref = useThemeStore((s) => s.pref)
  // 'auto' lets the widget track the OS itself while Graffel is on 'system';
  // an explicit toolbar choice re-inits the widget to match (there is no
  // runtime theme setter on the widget).
  const theme = pref === 'system' ? 'auto' : pref

  useEffect(() => {
    const help = HelpNavigator.init({
      content: helpContent,
      theme,
      accentColor: '#2563eb',
      position: 'bottom-right',
      hotkey: 'F1',
      texts: { panelTitle: 'Graffel Help' },
    })
    help.setContext(helpArticlesFor(window.location.pathname))
    return () => help.destroy()
  }, [theme])

  return null
}
