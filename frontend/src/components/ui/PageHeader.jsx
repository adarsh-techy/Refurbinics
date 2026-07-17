// Consistent page title + optional description + right-aligned actions,
// used at the top of every feature page.
// titleClassName/titleStyle: optional overrides for one-off title styling
// (e.g. a page that wants its title in a different color or with an effect).
function PageHeader({ title, description, children, titleClassName, titleStyle }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1
          className={
            titleClassName ||
            'text-2xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100'
          }
          style={titleStyle}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 gap-2">{children}</div>}
    </div>
  );
}

export default PageHeader;
