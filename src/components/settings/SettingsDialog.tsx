import { Button, Dialog, DialogBackdrop, DialogPanel, DialogTitle, Field, Input, Label, Select, Switch, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ArrowPathIcon, Cog6ToothIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, type ReactNode } from "react";
import { readStaticSettings } from "../../lib/deepcode-static/static-client";
import type { StaticSettingsResult } from "../../lib/deepcode-static/types";
import { cn } from "../../lib/utils/cn";
import { useUiPreferencesStore } from "../../stores/ui-preferences-store";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<StaticSettingsResult | null>(null);
  const showSkills = useUiPreferencesStore((state) => state.showSkills);
  const setShowSkills = useUiPreferencesStore((state) => state.setShowSkills);

  useEffect(() => {
    if (open) void reload();
  }, [open]);

  async function reload() {
    setSettings(await readStaticSettings());
  }

  const config = settings?.config ?? {};
  const env = config.env ?? {};

  return (
    <Dialog open={open} onClose={onClose} className="settings-dialog-root">
      <DialogBackdrop className="settings-dialog-backdrop" />
      <div className="settings-dialog-wrap">
        <DialogPanel className="settings-dialog-panel">
          <div className="settings-dialog-header">
            <div>
              <DialogTitle className="settings-dialog-title">DeepCode Settings</DialogTitle>
              <div className="settings-dialog-path">{settings?.path ?? "~/.deepcode/settings.json"}</div>
            </div>
            <div className="settings-dialog-actions">
              <Button className="settings-icon-button" onClick={() => void reload()} aria-label="Reload settings">
                <ArrowPathIcon className="settings-icon" />
              </Button>
              <Button className="settings-icon-button" onClick={onClose} aria-label="Close settings">
                <XMarkIcon className="settings-icon" />
              </Button>
            </div>
          </div>

          <TabGroup className="settings-tabs">
            <TabList className="settings-tab-list">
              <SettingsTab icon={<Cog6ToothIcon className="settings-tab-icon" />} label="DeepCode setting" />
              <SettingsTab icon={<PencilSquareIcon className="settings-tab-icon" />} label="对话设定" />
            </TabList>
            <TabPanels className="settings-tab-panels">
              <TabPanel className="settings-tab-panel">
                <div className="settings-file-status">
                  {settings?.exists ? "Loaded from DeepCode config file" : "Config file not found; showing documented defaults"}
                </div>
                <div className="settings-list">
                  <SettingsInput label="API key" value={maskSecret(env.API_KEY)} required />
                  <SettingsInput label="Base URL" value={env.BASE_URL ?? "https://api.deepseek.com"} />
                  <SettingsInput label="Model" value={env.MODEL ?? "deepseek-v4-pro"} />
                  <SettingsSwitch label="Thinking enabled" checked={config.thinkingEnabled ?? true} disabled />
                  <SettingsSelect label="Reasoning effort" value={config.reasoningEffort ?? "max"} options={["high", "max"]} />
                  <SettingsInput label="Notify script" value={config.notify ?? ""} />
                </div>
              </TabPanel>
              <TabPanel className="settings-tab-panel">
                <div className="settings-list">
                  <SettingsSwitch label="显示 skill" checked={showSkills} onChange={setShowSkills} />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function SettingsTab({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Tab className={({ selected }) => cn("settings-tab", selected && "selected")}>
      {icon}
      <span>{label}</span>
    </Tab>
  );
}

function SettingsInput({ label, value, required }: { label: string; value: string; required?: boolean }) {
  return (
    <Field className="settings-field">
      <Label className="settings-label">
        {label}
        {required ? <span className="settings-required">required</span> : null}
      </Label>
      <Input className="settings-input" readOnly value={value} />
    </Field>
  );
}

function SettingsSelect({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (
    <Field className="settings-field">
      <Label className="settings-label">{label}</Label>
      <Select className="settings-input" disabled value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </Select>
    </Field>
  );
}

function SettingsSwitch({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange?: (value: boolean) => void }) {
  return (
    <Field className="settings-field settings-switch-field">
      <Label className="settings-label">{label}</Label>
      <Switch checked={checked} disabled={disabled} onChange={onChange ?? (() => undefined)} className={cn("settings-switch", checked && "checked")}>
        <span className="settings-switch-thumb" />
      </Switch>
    </Field>
  );
}

function maskSecret(value?: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
