import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
const title = "PRISM · 工商业储能产品需求管理";
const description = "统一管理产品需求、负责人、进度、计划日期与延期风险。";
export async function generateMetadata(): Promise<Metadata> {
  const h=await headers(); const host=h.get("x-forwarded-host")??h.get("host")??"localhost:3000"; const protocol=h.get("x-forwarded-proto")??(host.startsWith("localhost")?"http":"https"); const base=new URL(`${protocol}://${host}`);
  return {metadataBase:base,title,description,icons:{icon:"/favicon.svg"},openGraph:{title,description,type:"website",images:[{url:new URL("/og.png",base).toString(),width:1733,height:909,alt:title}]},twitter:{card:"summary_large_image",title,description,images:[new URL("/og.png",base).toString()]}};
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}