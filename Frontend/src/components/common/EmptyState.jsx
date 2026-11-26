export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon sx={{ fontSize: 44, opacity: 0.5 }} />}
      <h3 style={{ margin: 0, color: 'var(--text)' }}>{title}</h3>
      {hint && <p style={{ margin: 0, maxWidth: 320 }}>{hint}</p>}
      {action}
    </div>
  );
}