import { LayoutGroup } from 'motion/react'
import { BottomTabBar } from './BottomTabBar'
import { SideRail } from './SideRail'
import { Sidebar } from './Sidebar'

export function Navigation() {
  return (
    <LayoutGroup id="navigation">
      <BottomTabBar />
      <SideRail />
      <Sidebar />
    </LayoutGroup>
  )
}
