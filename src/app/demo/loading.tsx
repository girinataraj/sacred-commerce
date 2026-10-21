export default function DemoLoading() {
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-loading" aria-busy="true"><p className="eyebrow">A moment of stillness</p><p role="status">Preparing your next page…</p><div className="sc-loading-grid" aria-hidden="true">{[0,1,2,3].map(index=><div key={index}/>)}</div></main>;
}
