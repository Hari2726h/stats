import { HexColorPicker } from "react-colorful";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function ColorPickerField({ label, value, onChange, error }) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background/60 p-3">
      <Label>{label}</Label>
      <HexColorPicker color={value} onChange={onChange} className="!h-36 !w-full" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} maxLength={7} />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
