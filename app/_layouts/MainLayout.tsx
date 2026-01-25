import React, { PropsWithChildren } from "react";
import { Navbar } from "../_component";

type TMainLayout = PropsWithChildren;

const MainLayout: React.FC<TMainLayout> = ({ children }) => {
  return (
    <div>
      <div>
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
