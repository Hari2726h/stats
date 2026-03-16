import { Upload } from "lucide-react";
import { Button } from "../ui/button";

const acceptedTypes = ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"];

export default function LogoUploader({ onFileSelect, error, logoName }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      onFileSelect(null, "Only PNG, SVG, and JPG formats are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      onFileSelect(null, "Logo size must be below 2MB.");
      return;
    }

    onFileSelect(file, "");
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Logo Upload</label>
      <div className="flex items-center gap-3">
        <input type="file" accept=".png,.svg,.jpg,.jpeg" className="hidden" id="logo-input" onChange={handleChange} />
        <Button type="button" variant="secondary" onClick={() => document.getElementById("logo-input")?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Logo
        </Button>
        <span className="text-xs text-slate-500 dark:text-slate-300">{logoName || "No file selected"}</span>
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
