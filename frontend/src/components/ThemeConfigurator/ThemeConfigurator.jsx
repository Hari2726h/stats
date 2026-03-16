import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Save, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import ColorPickerField from "../ColorPicker/ColorPickerField";
import LogoUploader from "../LogoUploader/LogoUploader";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { configSchema } from "../../lib/schemas";

export default function ThemeConfigurator({
  config,
  onConfigChange,
  onMatchLoad,
  loadingMatch,
  error,
  onLogoSelect,
  logoError,
  onSavePreset,
}) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: config,
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = watch((values) => {
      if (!values) return;
      onConfigChange({ ...config, ...values });
    });
    return () => subscription.unsubscribe();
  }, [watch, onConfigChange, config]);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
      <Card className="glass">
        <CardHeader>
          <CardTitle>Configuration Panel</CardTitle>
          <CardDescription>Adjust styles and validate match ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matchId">Match ID</Label>
            <div className="flex gap-2">
              <Input id="matchId" placeholder="12345" {...register("matchId")} />
              <Button type="button" onClick={() => onMatchLoad(watch("matchId"))}>
                {loadingMatch ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
              </Button>
            </div>
            {errors.matchId ? <p className="text-xs text-red-500">{errors.matchId.message}</p> : null}
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ColorPickerField
              label="Primary"
              value={watch("primaryColor")}
              onChange={(value) => setValue("primaryColor", value, { shouldValidate: true })}
              error={errors.primaryColor?.message}
            />
            <ColorPickerField
              label="Secondary"
              value={watch("secondaryColor")}
              onChange={(value) => setValue("secondaryColor", value, { shouldValidate: true })}
              error={errors.secondaryColor?.message}
            />
            <ColorPickerField
              label="Accent"
              value={watch("accentColor")}
              onChange={(value) => setValue("accentColor", value, { shouldValidate: true })}
              error={errors.accentColor?.message}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select {...register("fontFamily")}>
                <option value="Manrope">Manrope</option>
                <option value="Sora">Sora</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Widget Size</Label>
              <Select {...register("widgetSize")}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select {...register("template")}>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="broadcast">Broadcast</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Locale</Label>
              <Select {...register("locale")}>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="hi-IN">Hindi (India)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select {...register("timezone")}>
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Border Radius ({watch("borderRadius")}px)</Label>
              <input
                type="range"
                min="4"
                max="28"
                className="w-full"
                value={watch("borderRadius")}
                onChange={(event) => setValue("borderRadius", Number(event.target.value), { shouldValidate: true })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">Toggle widget theme</p>
              </div>
              <Switch
                checked={watch("theme") === "dark"}
                onCheckedChange={(checked) => setValue("theme", checked ? "dark" : "light")}
              />
            </div>
          </div>

          <LogoUploader onFileSelect={onLogoSelect} error={logoError} logoName={config.logoFileName} />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onSavePreset}>
              <Save className="mr-2 h-4 w-4" />
              Save Theme Preset
            </Button>
            <Button type="button" variant="outline" onClick={() => onConfigChange(config)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Apply Current Values
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
