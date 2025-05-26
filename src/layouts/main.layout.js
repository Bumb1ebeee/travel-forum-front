import Header from "@/components/header/Header";


export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  )}