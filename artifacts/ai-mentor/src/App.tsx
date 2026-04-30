import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "./store";
import { AppLayout } from "./layout";

import Catalog from "./pages/catalog";
import Builder from "./pages/builder";
import Analytics from "./pages/analytics";
import AccessPage from "./pages/access";
import { RunnerPage } from "./pages/runner";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/catalog" />} />
      <Route path="/catalog" component={() => <AppLayout><Catalog /></AppLayout>} />
      <Route path="/analytics" component={() => <AppLayout><Analytics /></AppLayout>} />
      <Route path="/admin/access" component={() => <AppLayout><AccessPage /></AppLayout>} />
      <Route path="/builder/:id" component={Builder} />
      <Route path="/preview/:id" component={() => <RunnerPage mode="preview" />} />
      <Route path="/sandbox/:id" component={() => <RunnerPage mode="sandbox" />} />
      <Route path="/learner/:id" component={() => <RunnerPage mode="learner" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <SonnerToaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "13px",
              },
            }}
          />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
