import Header from "@/components/header/Header";


export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <div className="mt-6">
        {children}
      </div>

    </>
  )}