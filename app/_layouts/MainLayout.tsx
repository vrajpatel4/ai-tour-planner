import React, { PropsWithChildren } from "react";
import { Navbar } from "../_component";
import MaintenanceGate from "../_component/MaintenanceGate";
import { SiteConfigProvider } from "../_component/SiteConfigProvider";

type TMainLayout = PropsWithChildren;

const MainLayout: React.FC<TMainLayout> = ({ children }) => {
  return (
    <SiteConfigProvider>
      <MaintenanceGate>
        <Navbar />
        {children}
      </MaintenanceGate>
    </SiteConfigProvider>
  );
};

export default MainLayout;
