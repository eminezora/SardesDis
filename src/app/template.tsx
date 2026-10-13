/** Her sayfa geçişinde içerik yumuşakça belirir (hareket azaltma tercihine uyar). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
