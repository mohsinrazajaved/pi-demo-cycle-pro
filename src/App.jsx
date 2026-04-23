import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import RouteLogger from '@/lib/RouteLogger'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotFoundView from './lib/NotFoundView';
import FitToViewport from './lib/FitToViewport';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout
    ? <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>;

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <FitToViewport>
      <Router>
        <RouteLogger />
        <Routes>
          <Route path="/" element={
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          } />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
          ))}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Router>
      </FitToViewport>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
