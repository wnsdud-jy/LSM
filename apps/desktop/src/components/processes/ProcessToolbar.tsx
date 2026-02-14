export function ProcessToolbar() {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <input type="search" placeholder="search" className="rounded border px-3 py-2" />
      <select defaultValue="cpu" className="rounded border px-3 py-2">
        <option value="cpu">CPU</option>
        <option value="mem">MEM</option>
        <option value="pid">PID</option>
      </select>
    </div>
  );
}
