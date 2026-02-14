import { Select, SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function ProcessToolbar() {
  return (
    <Card className="mb-4">
      <CardContent className="grid gap-3 pt-4 md:grid-cols-[1fr_160px]">
        <Input placeholder="Search process (user or command)" aria-label="search processes" />
        <Select defaultValue="cpu" aria-label="sort by">
          <SelectOption value="cpu">CPU</SelectOption>
          <SelectOption value="mem">MEM</SelectOption>
          <SelectOption value="pid">PID</SelectOption>
        </Select>
      </CardContent>
    </Card>
  );
}
