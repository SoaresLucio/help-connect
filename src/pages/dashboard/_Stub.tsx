export default function Stub({ title }: { title?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <h2 className="font-display text-2xl font-bold">{title ?? "Em breve"}</h2>
      <p className="text-sm text-muted-foreground mt-2">Esta seção será implementada na próxima fase.</p>
    </div>
  );
}
