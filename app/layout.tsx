import type { Metadata } from "next";
import "./globals.css";

export const metadata:Metadata={
  title:"SAJ Control · PAYG 资产授权中心",
  description:"CH3 / CH2 工商业光储系统离线定时授权、Token 发放与锁机管理演示。",
  icons:{icon:"/favicon.svg"},
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="zh-CN"><body>{children}</body></html>;
}
