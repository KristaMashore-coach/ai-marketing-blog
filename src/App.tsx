import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import PersonSchema from "./components/JsonLd/PersonSchema";
import OrganizationSchema from "./components/JsonLd/OrganizationSchema";
import Home from "./pages/Home";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import PillarPage from "./pages/PillarPage";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/articles", element: <BlogIndex /> },
      { path: "/articles/:slug", element: <BlogPost /> },
      { path: "/real-estate-marketing", element: <PillarPage /> },
      { path: "/real-estate-lead-generation", element: <PillarPage /> },
      { path: "/personal-branding-authority", element: <PillarPage /> },
      { path: "/about", element: <About /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <>
      <PersonSchema />
      <OrganizationSchema />
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
