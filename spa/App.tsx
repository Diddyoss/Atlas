import { BRAND_MAP } from "@/data/brands";
import { getMachine } from "@/data/machines";
import BrandsPage from "@/app/brands/page";
import CataloguePage from "@/app/catalogue/page";
import ComparePage from "@/app/compare/page";
import NotFound from "@/app/not-found";
import Home from "@/app/page";
import VintagePage from "@/app/vintage/page";
import { BrandDetail } from "@/components/BrandDetail";
import { CompareTray } from "@/components/CompareTray";
import { MachineDetail } from "@/components/MachineDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useRoute } from "./router";

function Page({ path }: { path: string }) {
  const [, section, param] = path.split("/");
  switch (section) {
    case undefined:
    case "":
      return <Home />;
    case "catalogue":
      return <CataloguePage />;
    case "compare":
      return <ComparePage />;
    case "vintage":
      return <VintagePage />;
    case "brands": {
      if (!param) return <BrandsPage />;
      const b = BRAND_MAP[param];
      return b ? <BrandDetail b={b} /> : <NotFound />;
    }
    case "machines": {
      const m = param ? getMachine(param) : undefined;
      return m ? <MachineDetail m={m} /> : <NotFound />;
    }
    default:
      return <NotFound />;
  }
}

export function App() {
  const { path } = useRoute();
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="scanline" aria-hidden />
      <SiteHeader />
      <main className="flex-1">
        <div key={path} className="page-in">
          <Page path={path} />
        </div>
      </main>
      <SiteFooter />
      <CompareTray />
    </div>
  );
}
