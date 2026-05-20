import Topbar from './Topbar';

const PageWrapper = ({ title, children }) => {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title={title} />
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default PageWrapper;
